<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::select(
            'transactions.*',
            'users.nama as kasir_nama',
            'customers.nama as customer_nama',
            'verifiers.nama as verifier_nama'
        )
        ->join('users', 'transactions.user_id', '=', 'users.id')
        ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id')
        ->leftJoin('users as verifiers', 'transactions.verified_by', '=', 'verifiers.id');

        // Restrict customer role to their own transactions
        $user = auth()->user();
        if ($user && $user->role === 'customer') {
            $query->where('transactions.user_id', $user->id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(transactions.created_at)'), [$request->start_date, $request->end_date]);
        }

        if ($request->filled('status_pembayaran')) {
            $query->where('transactions.status_pembayaran', $request->status_pembayaran);
        }

        if ($request->filled('status_pesanan')) {
            $query->where('transactions.status_pesanan', $request->status_pesanan);
        }

        $transactions = $query->orderBy('transactions.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $userId = $user ? $user->id : 1;
        $isCustomer = $user && $user->role === 'customer';

        $rules = [
            'customer_id' => 'nullable|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'diskon' => 'nullable|numeric|min:0',
            'bayar' => 'required|numeric|min:0',
            'metode_bayar' => $isCustomer ? 'required|in:transfer,qris' : 'required|in:tunai,transfer,qris',
            'bank' => 'nullable|string',
            'catatan' => 'nullable|string',
        ];

        if ($isCustomer && $request->metode_bayar === 'transfer') {
            $rules['bank'] = 'required|in:BCA,BRI,Mandiri,bca,bri,mandiri';
        }

        $request->validate($rules, [
            'metode_bayar.in' => 'Metode pembayaran untuk pesanan customer hanya mendukung Transfer atau QRIS.',
            'bank.required' => 'Silakan pilih salah satu bank tujuan transfer (BCA, BRI, atau Mandiri).',
            'bank.in' => 'Pilihan bank tidak valid. Silakan pilih BCA, BRI, atau Mandiri.'
        ]);

        $bank = null;
        if ($request->metode_bayar === 'transfer') {
            $bankInput = strtoupper(trim($request->bank ?? ''));
            if (in_array($bankInput, ['BCA', 'BRI', 'MANDIRI'])) {
                $bank = $bankInput === 'MANDIRI' ? 'Mandiri' : $bankInput;
            } elseif ($isCustomer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Silakan pilih salah satu bank tujuan transfer (BCA, BRI, atau Mandiri).'
                ], 422);
            }
        }

        $diskon = floatval($request->diskon ?? 0);
        $bayar = floatval($request->bayar);

        try {
            $result = DB::transaction(function () use ($request, $userId, $isCustomer, $diskon, $bayar, $bank) {
                // 1. Generate sequential invoice number (INV-YYYYMMDD-XXXX)
                $datePrefix = 'INV-' . date('Ymd') . '-';
                $lastInvoice = Transaction::where('no_invoice', 'like', "{$datePrefix}%")
                    ->orderBy('no_invoice', 'desc')
                    ->first();

                $seq = 1;
                if ($lastInvoice) {
                    $parts = explode('-', $lastInvoice->no_invoice);
                    $seq = intval(end($parts)) + 1;
                }
                $noInvoice = $datePrefix . str_pad($seq, 4, '0', STR_PAD_LEFT);

                // 2. Fetch items details and calculate totals
                $subtotal = 0;
                $itemsToInsert = [];

                foreach ($request->items as $itemData) {
                    $product = Product::findOrFail($itemData['product_id']);

                    // Verify stock availability
                    if ($product->stok < $itemData['qty']) {
                        throw new \Exception("Stok produk '{$product->nama}' tidak mencukupi. Sisa stok: {$product->stok}.");
                    }

                    $itemSubtotal = floatval($product->harga_jual) * intval($itemData['qty']);
                    $subtotal += $itemSubtotal;

                    $itemsToInsert[] = [
                        'product_id' => $product->id,
                        'nama_produk' => $product->nama,
                        'harga' => $product->harga_jual,
                        'qty' => $itemData['qty'],
                        'subtotal' => $itemSubtotal
                    ];
                }

                $total = max(0, $subtotal - $diskon);
                $kembalian = max(0, $bayar - $total);

                if ($bayar < $total && !$isCustomer) {
                    throw new \Exception("Uang pembayaran tidak mencukupi total tagihan.");
                }

                // Determine default status
                if ($isCustomer) {
                    $statusPembayaran = 'Menunggu Pembayaran';
                    $statusPesanan = 'Menunggu Pembayaran';
                    $konfirmasiAt = null;
                    $verifiedBy = null;
                } else {
                    $statusPembayaran = $request->input('status_pembayaran', 'Dibayar');
                    $statusPesanan = $request->input('status_pesanan', 'Selesai');
                    $konfirmasiAt = now();
                    $verifiedBy = $userId;
                }

                // 3. Create Transaction Header
                $transaction = Transaction::create([
                    'no_invoice' => $noInvoice,
                    'user_id' => $userId,
                    'customer_id' => $request->customer_id,
                    'subtotal' => $subtotal,
                    'diskon' => $diskon,
                    'total' => $total,
                    'bayar' => $bayar,
                    'kembalian' => $kembalian,
                    'metode_bayar' => $request->metode_bayar,
                    'bank' => $bank,
                    'status_pembayaran' => $statusPembayaran,
                    'status_pesanan' => $statusPesanan,
                    'konfirmasi_at' => $konfirmasiAt,
                    'verified_by' => $verifiedBy,
                    'catatan' => $request->catatan
                ]);

                // 4. Create Transaction Items, Update Product Stock, & Insert Stock History
                foreach ($itemsToInsert as $item) {
                    $item['transaction_id'] = $transaction->id;
                    TransactionItem::create($item);

                    $product = Product::findOrFail($item['product_id']);
                    $stokSebelum = $product->stok;
                    $stokSesudah = $stokSebelum - $item['qty'];

                    // Update stock
                    $product->update(['stok' => $stokSesudah]);

                    // Audit history logs
                    StockHistory::create([
                        'product_id' => $product->id,
                        'user_id' => $userId,
                        'type' => 'sale',
                        'qty' => $item['qty'],
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => "Penjualan via invoice: {$noInvoice}",
                        'reference_id' => $transaction->id
                    ]);
                }

                // 5. Add Loyalty points for member (1 point for every Rp 10.000 spent)
                if ($request->filled('customer_id')) {
                    $customer = Customer::findOrFail($request->customer_id);
                    if ($customer->nama !== 'Umum (Walk-in)') {
                        $addedPoints = floor($total / 10000);
                        $customer->increment('poin', $addedPoints);
                    }
                }

                return $transaction;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $result->id,
                    'no_invoice' => $result->no_invoice,
                    'total' => $result->total,
                    'metode_bayar' => $result->metode_bayar,
                    'bank' => $result->bank,
                    'status_pembayaran' => $result->status_pembayaran,
                    'status_pesanan' => $result->status_pesanan
                ],
                'message' => 'Pesanan berhasil dibuat.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        $transaction = Transaction::select(
            'transactions.*',
            'users.nama as kasir_nama',
            'customers.nama as customer_nama',
            'verifiers.nama as verifier_nama'
        )
        ->join('users', 'transactions.user_id', '=', 'users.id')
        ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id')
        ->leftJoin('users as verifiers', 'transactions.verified_by', '=', 'verifiers.id')
        ->where('transactions.id', $id)
        ->firstOrFail();

        // Enforce customer user detail check
        $user = auth()->user();
        if ($user && $user->role === 'customer' && $transaction->user_id !== $user->id) {
            abort(403, 'Akses ditolak. Anda tidak memiliki izin melihat transaksi ini.');
        }

        $items = TransactionItem::where('transaction_id', $id)->get();
        $transaction->items = $items;

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }

    /**
     * Upload proof of payment by Customer
     */
    public function uploadProof($id, Request $request)
    {
        $request->validate([
            'bukti_bayar' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120'
        ], [
            'bukti_bayar.required' => 'File bukti pembayaran wajib dipilih.',
            'bukti_bayar.file' => 'Bukti pembayaran harus berupa file yang valid.',
            'bukti_bayar.mimes' => 'Format file bukti pembayaran harus JPG, JPEG, PNG, atau PDF.',
            'bukti_bayar.max' => 'Ukuran file bukti pembayaran maksimal 5MB.'
        ]);

        $transaction = Transaction::findOrFail($id);
        $user = auth()->user();

        // Authorization check
        if ($user && $user->role === 'customer' && $transaction->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin mengupload bukti pembayaran pada pesanan ini.'
            ], 403);
        }

        if ($transaction->status_pembayaran === 'Dibayar') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah berstatus Dibayar dan tidak memerlukan upload bukti ulang.'
            ], 422);
        }

        // Delete previous proof file if exists
        if ($transaction->bukti_bayar && Storage::disk('public')->exists($transaction->bukti_bayar)) {
            Storage::disk('public')->delete($transaction->bukti_bayar);
        }

        $file = $request->file('bukti_bayar');
        $originalName = $file->getClientOriginalName();
        $path = $file->store('payment_proofs', 'public');

        $transaction->update([
            'bukti_bayar' => $path,
            'bukti_bayar_original_name' => $originalName,
            'bukti_bayar_at' => now(),
            'status_pembayaran' => 'Menunggu Konfirmasi',
            'catatan_penolakan' => null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diupload. Status pembayaran kini Menunggu Konfirmasi.',
            'data' => $transaction
        ]);
    }

    /**
     * View/stream payment proof file securely
     */
    public function getProof($id)
    {
        $transaction = Transaction::findOrFail($id);
        $user = auth()->user();

        // Authorization check: customer can only view their own proof, admin/kasir can view any
        if ($user && $user->role === 'customer' && $transaction->user_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }

        if (!$transaction->bukti_bayar || !Storage::disk('public')->exists($transaction->bukti_bayar)) {
            abort(404, 'Bukti pembayaran belum diupload atau file tidak ditemukan.');
        }

        $path = Storage::disk('public')->path($transaction->bukti_bayar);
        $mimeType = mime_content_type($path) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . ($transaction->bukti_bayar_original_name ?? basename($path)) . '"'
        ]);
    }

    /**
     * Admin / Kasir verifies payment: sets to 'Dibayar' and 'Diproses'
     */
    public function verifyPayment($id, Request $request)
    {
        $user = auth()->user();
        if ($user && $user->role === 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Admin atau Kasir yang dapat memverifikasi pembayaran.'
            ], 403);
        }

        $transaction = Transaction::findOrFail($id);
        $transaction->update([
            'status_pembayaran' => 'Dibayar',
            'status_pesanan' => ($transaction->status_pesanan === 'Menunggu Pembayaran' || $transaction->status_pesanan === 'Dibatalkan') ? 'Diproses' : $transaction->status_pesanan,
            'catatan_penolakan' => null,
            'konfirmasi_at' => now(),
            'verified_by' => $user ? $user->id : 1
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dikonfirmasi. Status pesanan diperbarui menjadi Diproses.',
            'data' => $transaction
        ]);
    }

    /**
     * Admin / Kasir rejects payment: sets to 'Ditolak'
     */
    public function rejectPayment($id, Request $request)
    {
        $user = auth()->user();
        if ($user && $user->role === 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Admin atau Kasir yang dapat menolak pembayaran.'
            ], 403);
        }

        $request->validate([
            'catatan_penolakan' => 'nullable|string|max:500'
        ]);

        $reason = trim($request->input('catatan_penolakan') ?? '');
        if (empty($reason)) {
            $reason = 'Bukti pembayaran tidak sesuai atau transfer belum masuk.';
        }

        $transaction = Transaction::findOrFail($id);
        $transaction->update([
            'status_pembayaran' => 'Ditolak',
            'catatan_penolakan' => $reason,
            'konfirmasi_at' => now(),
            'verified_by' => $user ? $user->id : 1
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran telah ditolak.',
            'data' => $transaction
        ]);
    }

    /**
     * Admin / Kasir updates order status ('Diproses', 'Selesai', 'Dibatalkan')
     */
    public function updateStatus($id, Request $request)
    {
        $user = auth()->user();
        if ($user && $user->role === 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        $request->validate([
            'status_pesanan' => 'required|in:Menunggu Pembayaran,Diproses,Selesai,Dibatalkan'
        ]);

        $transaction = Transaction::findOrFail($id);
        $newStatus = $request->status_pesanan;
        $prevStatus = $transaction->status_pesanan;

        if ($newStatus === $prevStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Status pesanan tidak mengalami perubahan.',
                'data' => $transaction
            ]);
        }

        // If cancelling an active order, restore stock
        if ($newStatus === 'Dibatalkan' && $prevStatus !== 'Dibatalkan') {
            $items = TransactionItem::where('transaction_id', $id)->get();
            $userId = auth()->id() ?? 1;

            foreach ($items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $stokSebelum = $product->stok;
                    $stokSesudah = $stokSebelum + $item->qty;
                    $product->update(['stok' => $stokSesudah]);

                    StockHistory::create([
                        'product_id' => $product->id,
                        'user_id' => $userId,
                        'type' => 'adjustment',
                        'qty' => $item->qty,
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => "Pesanan dibatalkan (Invoice: {$transaction->no_invoice})",
                        'reference_id' => $transaction->id
                    ]);
                }
            }
        }

        $transaction->update([
            'status_pesanan' => $newStatus
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status pesanan berhasil diperbarui menjadi {$newStatus}.",
            'data' => $transaction
        ]);
    }

    public function void($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $transaction = Transaction::findOrFail($id);
                $items = TransactionItem::where('transaction_id', $id)->get();
                $userId = auth()->id() ?? 1;

                // 1. Restore stock and insert stock log
                foreach ($items as $item) {
                    $product = Product::findOrFail($item->product_id);
                    $stokSebelum = $product->stok;
                    $stokSesudah = $stokSebelum + $item->qty;

                    $product->update(['stok' => $stokSesudah]);

                    StockHistory::create([
                        'product_id' => $product->id,
                        'user_id' => $userId,
                        'type' => 'adjustment',
                        'qty' => $item->qty,
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => "Transaksi dibatalkan (VOID Invoice: {$transaction->no_invoice})",
                        'reference_id' => $transaction->id
                    ]);
                }

                // 2. Decrement Customer Loyalty points if member
                if ($transaction->customer_id) {
                    $customer = Customer::find($transaction->customer_id);
                    if ($customer && $customer->nama !== 'Umum (Walk-in)') {
                        $deductedPoints = floor($transaction->total / 10000);
                        $customer->decrement('poin', min($customer->poin, $deductedPoints));
                    }
                }

                // 3. Delete proof file from storage
                if ($transaction->bukti_bayar && Storage::disk('public')->exists($transaction->bukti_bayar)) {
                    Storage::disk('public')->delete($transaction->bukti_bayar);
                }

                // 4. Delete transaction (Cascade will delete items)
                $transaction->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan (void) dan stok dipulihkan.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan transaksi: ' . $e->getMessage()
            ], 422);
        }
    }
}
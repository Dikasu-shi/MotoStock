<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::select('transactions.*', 'users.nama as kasir_nama', 'customers.nama as customer_nama')
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id');

        // Restrict customer role to their own transactions
        $user = auth()->user();
        if ($user && $user->role === 'customer') {
            $query->where('transactions.user_id', $user->id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(transactions.created_at)'), [$request->start_date, $request->end_date]);
        }

        $transactions = $query->orderBy('transactions.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'nullable|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'diskon' => 'nullable|numeric|min:0',
            'bayar' => 'required|numeric|min:0',
            'metode_bayar' => 'required|in:tunai,transfer,qris',
            'catatan' => 'nullable|string',
        ]);

        $userId = auth()->id() ?? 1; // Fallback to user ID 1 if not logged in in test mode
        $diskon = floatval($request->diskon ?? 0);
        $bayar = floatval($request->bayar);

        try {
            $result = DB::transaction(function () use ($request, $userId, $diskon, $bayar) {
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

                if ($bayar < $total) {
                    throw new \Exception("Uang pembayaran tidak mencukupi total tagihan.");
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
                ],
                'message' => 'Transaksi penjualan berhasil disimpan.'
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
        $transaction = Transaction::select('transactions.*', 'users.nama as kasir_nama', 'customers.nama as customer_nama')
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id')
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

                // 3. Delete transaction (Cascade will delete items)
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
<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $query = Purchase::select('purchases.*', 'suppliers.nama as supplier_nama', 'users.nama as user_nama')
            ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->join('users', 'purchases.user_id', '=', 'users.id');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('purchases.created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        $purchases = $query->orderBy('purchases.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $purchases
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'catatan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.harga_beli' => 'required|numeric|min:0',
        ]);

        $userId = auth()->id() ?? 1;

        try {
            $purchase = DB::transaction(function () use ($request, $userId) {
                // Generate PO Number
                $dateCode = 'PO-' . date('Ymd') . '-';
                $lastPo = Purchase::where('no_pembelian', 'like', $dateCode . '%')
                    ->orderBy('no_pembelian', 'desc')
                    ->first();

                $nextNum = 1;
                if ($lastPo) {
                    $parts = explode('-', $lastPo->no_pembelian);
                    $nextNum = intval(end($parts)) + 1;
                }
                $noPembelian = $dateCode . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

                // Calculate total
                $total = 0;
                foreach ($request->items as $item) {
                    $total += $item['qty'] * $item['harga_beli'];
                }

                // Create Purchase Header
                $purchase = Purchase::create([
                    'no_pembelian' => $noPembelian,
                    'supplier_id' => $request->supplier_id,
                    'user_id' => $userId,
                    'total' => $total,
                    'catatan' => $request->catatan
                ]);

                // Create Purchase Items & Update Product Stocks
                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $stokSebelum = $product->stok;
                    $stokSesudah = $stokSebelum + $item['qty'];

                    // Save purchase item
                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $product->id,
                        'nama_produk' => $product->nama,
                        'harga_beli' => $item['harga_beli'],
                        'qty' => $item['qty'],
                        'subtotal' => $item['qty'] * $item['harga_beli']
                    ]);

                    // Update product stock and optionally update product purchase price if it changes
                    $product->update([
                        'stok' => $stokSesudah,
                        'harga_beli' => $item['harga_beli'] // Update price logic to keep DB fresh
                    ]);

                    // Write to stock history
                    StockHistory::create([
                        'product_id' => $product->id,
                        'user_id' => $userId,
                        'type' => 'in',
                        'qty' => $item['qty'],
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => 'Pembelian dari supplier (' . $noPembelian . ')',
                        'reference_id' => $purchase->id
                    ]);
                }

                return $purchase;
            });

            return response()->json([
                'success' => true,
                'data' => $purchase,
                'message' => 'Transaksi pembelian berhasil disimpan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pembelian: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        $this->authorizeAdmin();

        $purchase = Purchase::with(['supplier', 'user'])->findOrFail($id);
        $items = PurchaseItem::select('purchase_items.*', 'products.sku')
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'purchase' => $purchase,
                'items' => $items
            ]
        ]);
    }
}
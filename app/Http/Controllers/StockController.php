<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeStaff();

        $query = StockHistory::select('stock_history.*', 'products.nama as product_nama', 'products.sku', 'users.nama as user_nama')
            ->join('products', 'stock_history.product_id', '=', 'products.id')
            ->leftJoin('users', 'stock_history.user_id', '=', 'users.id');

        if ($request->filled('product_id')) {
            $query->where('stock_history.product_id', $request->product_id);
        }

        if ($request->filled('low_stock')) {
            // Get low stock alert list
            $lowStockProducts = Product::whereRaw('stok <= stok_minimum')
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
            return response()->json([
                'success' => true,
                'data' => $lowStockProducts
            ]);
        }

        $history = $query->orderBy('stock_history.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'qty' => 'required|integer|min:1',
            'keterangan' => 'required|string|max:255',
        ]);

        $userId = auth()->id() ?? 1;

        try {
            $history = DB::transaction(function () use ($request, $userId) {
                $product = Product::findOrFail($request->product_id);
                $stokSebelum = $product->stok;
                $stokSesudah = $stokSebelum + $request->qty;

                // Update product stock
                $product->update(['stok' => $stokSesudah]);

                // Create stock log
                return StockHistory::create([
                    'product_id' => $product->id,
                    'user_id' => $userId,
                    'type' => 'in',
                    'qty' => $request->qty,
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'keterangan' => $request->keterangan
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'Stok masuk berhasil disimpan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambah stok: ' . $e->getMessage()
            ], 422);
        }
    }

    public function adjust(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'physical_qty' => 'required|integer|min:0',
            'keterangan' => 'required|string|max:255',
        ]);

        $userId = auth()->id() ?? 1;

        try {
            $history = DB::transaction(function () use ($request, $userId) {
                $product = Product::findOrFail($request->product_id);
                $stokSebelum = $product->stok;
                $stokSesudah = $request->physical_qty;
                $diffQty = $stokSesudah - $stokSebelum;

                // Update product stock
                $product->update(['stok' => $stokSesudah]);

                // Create stock log (type adjustment)
                return StockHistory::create([
                    'product_id' => $product->id,
                    'user_id' => $userId,
                    'type' => 'adjustment',
                    'qty' => $diffQty,
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'keterangan' => $request->keterangan
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'Stock opname / penyesuaian berhasil disimpan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan penyesuaian stok: ' . $e->getMessage()
            ], 422);
        }
    }
}
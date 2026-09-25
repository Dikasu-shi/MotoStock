<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::select('products.*', 'categories.nama as category_nama')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('products.nama', 'like', "%{$search}%")
                  ->orWhere('products.sku', 'like', "%{$search}%")
                  ->orWhere('products.part_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('products.category_id', $request->category_id);
        }

        if ($request->filled('motor')) {
            $motor = $request->motor;
            $query->where('products.motor', 'like', "%{$motor}%");
        }

        if ($request->filled('stock_status')) {
            $status = $request->stock_status;
            if ($status === 'habis') {
                $query->where('products.stok', '=', 0);
            } elseif ($status === 'menipis') {
                $query->where('products.stok', '>', 0)
                      ->whereRaw('products.stok <= products.stok_minimum');
            } elseif ($status === 'aman') {
                $query->whereRaw('products.stok > products.stok_minimum');
            }
        }

        if ($request->filled('low_stock')) {
            $query->whereRaw('products.stok <= products.stok_minimum');
        }

        $sortBy = $request->input('sort_by', 'nama');
        $sortOrder = $request->input('sort_order', 'asc');

        if (in_array($sortBy, ['nama', 'stok', 'harga_jual'])) {
            $query->orderBy('products.' . $sortBy, $sortOrder);
        } else {
            $query->orderBy('products.nama', 'asc');
        }

        $products = $query->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'sku' => 'required|string|max:50|unique:products,sku',
            'part_number' => 'nullable|string|max:100',
            'category_id' => 'required|integer|exists:categories,id',
            'nama' => 'required|string|max:200',
            'motor' => 'nullable|string',
            'satuan' => 'required|string|max:20',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'stok' => 'nullable|integer|min:0',
            'stok_minimum' => 'required|integer|min:1',
            'deskripsi' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $payload = $request->all();
        $payload['stok'] = $payload['stok'] ?? 0;
        $payload['is_active'] = $request->has('is_active') ? (bool)$request->is_active : true;

        $product = Product::create($payload);

        // Also record stock history if initial stock > 0
        if (intval($product->stok) > 0) {
            \App\Models\StockHistory::create([
                'product_id' => $product->id,
                'user_id' => auth()->id() ?? 1, // Fallback if no session
                'type' => 'in',
                'qty' => $product->stok,
                'stok_sebelum' => 0,
                'stok_sesudah' => $product->stok,
                'keterangan' => 'Stok awal produk baru didaftarkan'
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Produk berhasil disimpan'
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'id' => 'required|integer|exists:products,id',
            'sku' => 'required|string|max:50|unique:products,sku,' . $request->id,
            'part_number' => 'nullable|string|max:100',
            'category_id' => 'required|integer|exists:categories,id',
            'nama' => 'required|string|max:200',
            'motor' => 'nullable|string',
            'satuan' => 'required|string|max:20',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'stok_minimum' => 'required|integer|min:1',
            'deskripsi' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $product = Product::findOrFail($request->id);
        $product->update($request->only([
            'sku', 'part_number', 'category_id', 'nama', 'motor', 'satuan', 'harga_beli', 'harga_jual', 'stok_minimum', 'deskripsi', 'is_active'
        ]));

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Produk berhasil diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $this->authorizeAdmin();

        $product = Product::findOrFail($id);

        // Check if there is transaction history
        $hasHistory = \App\Models\TransactionItem::where('product_id', $id)->exists();

        if ($hasHistory) {
            $product->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Produk dideaktivasi (diarsipkan) karena memiliki riwayat transaksi'
            ]);
        } else {
            $product->delete();
            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dihapus secara permanen'
            ]);
        }
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount(['products' => function ($query) {
            $query->where('is_active', true);
        }])->get();

        // Map product count column
        $categories->map(function ($cat) {
            $cat->total_produk = $cat->products_count;
            return $cat;
        });

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
        ]);

        $category = Category::create($request->only(['nama', 'deskripsi', 'icon']));

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Kategori berhasil dibuat'
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|integer|exists:categories,id',
            'nama' => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
        ]);

        $category = Category::findOrFail($request->id);
        $category->update($request->only(['nama', 'deskripsi', 'icon']));

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Kategori berhasil diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // Check if there are active products inside this category
        $hasProducts = Product::where('category_id', $id)->where('is_active', true)->exists();
        if ($hasProducts) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak dapat dihapus karena masih terdapat produk aktif di dalamnya.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus'
        ]);
    }
}
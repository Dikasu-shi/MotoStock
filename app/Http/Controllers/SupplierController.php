<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $query = Supplier::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kontak_person', 'like', "%{$search}%")
                  ->orWhere('telepon', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->orderBy('nama', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'nama' => 'required|string|max:100',
            'kontak_person' => 'required|string|max:100',
            'telepon' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'alamat' => 'nullable|string',
        ]);

        $supplier = Supplier::create($request->only(['nama', 'kontak_person', 'telepon', 'email', 'alamat']));

        return response()->json([
            'success' => true,
            'data' => $supplier,
            'message' => 'Supplier baru berhasil disimpan'
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'id' => 'required|integer|exists:suppliers,id',
            'nama' => 'required|string|max:100',
            'kontak_person' => 'required|string|max:100',
            'telepon' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'alamat' => 'nullable|string',
        ]);

        $supplier = Supplier::findOrFail($request->id);
        $supplier->update($request->only(['nama', 'kontak_person', 'telepon', 'email', 'alamat']));

        return response()->json([
            'success' => true,
            'data' => $supplier,
            'message' => 'Data supplier diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $this->authorizeAdmin();

        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil dihapus'
        ]);
    }
}
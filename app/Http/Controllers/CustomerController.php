<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('telepon', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('nama', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
            'telepon' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'alamat' => 'nullable|string',
        ]);

        $customer = Customer::create([
            'nama' => $request->nama,
            'telepon' => $request->telepon,
            'email' => $request->email,
            'alamat' => $request->alamat,
            'poin' => 0
        ]);

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => 'Pelanggan berhasil didaftarkan'
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|integer|exists:customers,id',
            'nama' => 'required|string|max:100',
            'telepon' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'alamat' => 'nullable|string',
        ]);

        $customer = Customer::findOrFail($request->id);

        // Prevent editing default Walk-in customer
        if ($customer->nama === 'Umum (Walk-in)') {
            return response()->json([
                'success' => false,
                'message' => 'Data pelanggan default sistem tidak dapat diubah.'
            ], 422);
        }

        $customer->update($request->only(['nama', 'telepon', 'email', 'alamat']));

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => 'Data pelanggan diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->nama === 'Umum (Walk-in)') {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan default sistem tidak dapat dihapus.'
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggan berhasil dihapus'
        ]);
    }
}
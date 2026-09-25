<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $users = User::orderBy('nama', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:6',
            'nama' => 'required|string|max:100',
            'role' => 'required|in:admin,kasir,customer',
            'is_active' => 'nullable|boolean'
        ]);

        $payload = $request->all();
        // The hashed cast in User.php will handle automatic hashing of 'password'
        $payload['is_active'] = $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true;

        $user = User::create($payload);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Pengguna berhasil ditambahkan'
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'id' => 'required|integer|exists:users,id',
            'username' => 'required|string|max:50|unique:users,username,' . $request->id,
            'password' => 'nullable|string|min:6',
            'nama' => 'required|string|max:100',
            'role' => 'required|in:admin,kasir,customer',
            'is_active' => 'nullable|boolean'
        ]);

        $user = User::findOrFail($request->id);

        $data = $request->only(['username', 'nama', 'role']);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Pengguna berhasil diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        // Prevent self-deletion
        if (auth()->id() == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri'
            ], 422);
        }

        // Check if user has transaction, purchase, or stock history
        $hasHistory = \App\Models\Transaction::where('user_id', $id)->exists()
            || \App\Models\Purchase::where('user_id', $id)->exists()
            || \App\Models\StockHistory::where('user_id', $id)->exists();

        if ($hasHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna ini masih memiliki riwayat transaksi dan tidak dapat dihapus. Silakan ubah status menjadi Nonaktif.'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus'
        ]);
    }
}
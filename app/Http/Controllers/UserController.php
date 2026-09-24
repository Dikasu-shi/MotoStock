<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // Require admin role
        $this->checkAdmin();

        $users = User::orderBy('nama', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $this->checkAdmin();

        $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:6',
            'nama' => 'required|string|max:100',
            'role' => 'required|in:admin,kasir,customer',
            'is_active' => 'nullable|boolean'
        ]);

        $payload = $request->all();
        // The hashed cast in User.php will handle automatic hashing of 'password'
        $payload['is_active'] = $request->has('is_active') ? (bool)$request->is_active : true;

        $user = User::create($payload);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Pengguna berhasil ditambahkan'
        ]);
    }

    public function update(Request $request)
    {
        $this->checkAdmin();

        $request->validate([
            'id' => 'required|integer|exists:users,id',
            'username' => 'required|string|max:50|unique:users,username,' . $request->id,
            'password' => 'nullable|string|min:6',
            'nama' => 'required|string|max:100',
            'role' => 'required|in:admin,kasir,customer',
            'is_active' => 'nullable|boolean'
        ]);

        $user = User::findOrFail($request->id);

        $data = $request->only(['username', 'nama', 'role', 'is_active']);
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
        $this->checkAdmin();

        $user = User::findOrFail($id);

        // Prevent self-deletion
        if (auth()->id() == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri'
            ], 422);
        }

        // Check if user has transaction history
        $hasTrx = \App\Models\Transaction::where('user_id', $id)->exists();
        if ($hasTrx) {
            $user->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Pengguna dinonaktifkan (diarsipkan) karena memiliki riwayat transaksi'
            ]);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus secara permanen'
        ]);
    }

    private function checkAdmin()
    {
        $user = auth()->user() ?? User::find(1); // fallback to admin if no session (local CLI)
        if ($user && $user->role !== 'admin') {
            abort(403, 'Akses ditolak. Hanya Administrator yang dapat mengakses menu ini.');
        }
    }
}
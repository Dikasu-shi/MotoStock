<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = $request->username;
        $field = filter_var($loginInput, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $credentials = [
            $field => $loginInput,
            'password' => $request->password
        ];

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();
            if (isset($user->is_active) && !$user->is_active) {
                Auth::logout();
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.'
                ], 403);
            }

            // Update last login
            $user->update(['last_login' => now()]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'nama' => $user->nama,
                    'role' => $user->role,
                ],
                'message' => 'Login berhasil'
            ]);
        }

        // Fallback check alternative field
        $altField = ($field === 'email') ? 'username' : 'email';
        if (Auth::attempt([$altField => $loginInput, 'password' => $request->password])) {
            $request->session()->regenerate();
            $user = Auth::user();
            if (isset($user->is_active) && !$user->is_active) {
                Auth::logout();
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.'
                ], 403);
            }
            $user->update(['last_login' => now()]);
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'nama' => $user->nama,
                    'role' => $user->role,
                ],
                'message' => 'Login berhasil'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Username/Email atau password salah.'
        ], 422);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }

    public function check(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'nama' => $user->nama,
                    'role' => $user->role,
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Not authenticated'
        ], 401);
    }
}
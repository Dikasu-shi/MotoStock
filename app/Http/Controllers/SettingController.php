<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:100',
            'store_tagline' => 'required|string|max:100',
            'store_address' => 'required|string|max:255',
            'store_phone' => 'required|string|max:20',
            'point_rate' => 'required|integer|min:0',
        ]);

        foreach ($request->only(['store_name', 'store_tagline', 'store_address', 'store_phone', 'point_rate']) as $key => $value) {
            Setting::setValue($key, $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan aplikasi berhasil disimpan'
        ]);
    }
}
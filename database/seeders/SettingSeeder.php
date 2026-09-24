<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'store_name', 'value' => 'MotoStock', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_tagline', 'value' => 'Inventory & Point of Sale', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_address', 'value' => 'Jl. Raya Serpong No. 45, Tangerang', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_phone', 'value' => '021-5551234', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'point_rate', 'value' => '100', 'created_at' => now(), 'updated_at' => now()],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(['key' => $setting['key']], $setting);
        }
    }
}
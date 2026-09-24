<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\StockHistory;
use Illuminate\Database\Seeder;

class StockAdjustmentSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::limit(3)->get();
        if ($products->isEmpty()) return;

        $reasons = [
            'Selisih hitung stok opname rutin bulanan',
            'Barang rusak terkena oli bocor di rak belakang',
            'Penyesuaian serah terima shift kasir & gudang'
        ];

        foreach ($products as $index => $p) {
            $stokSebelum = $p->stok;
            $qtyDiff = ($index % 2 == 0) ? -2 : 3;
            $stokSesudah = max(0, $stokSebelum + $qtyDiff);
            $actualDiff = $stokSesudah - $stokSebelum;

            StockHistory::create([
                'product_id' => $p->id,
                'user_id' => 1,
                'type' => 'adjustment',
                'qty' => $actualDiff,
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSesudah,
                'keterangan' => $reasons[$index % count($reasons)],
                'created_at' => date('Y-m-d H:i:s', strtotime("-{$index} days")),
                'updated_at' => date('Y-m-d H:i:s', strtotime("-{$index} days"))
            ]);

            $p->update(['stok' => $stokSesudah]);
        }
    }
}
<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockHistory;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = Supplier::limit(3)->get();
        if ($suppliers->isEmpty()) return;

        // Purchase 1: PT. Astra Honda Motor
        $sup1 = $suppliers[0];
        $products1 = Product::where('category_id', 1)->limit(2)->get(); // Oli & Pelumas

        if ($products1->count() >= 2) {
            $po1 = Purchase::create([
                'no_pembelian' => 'PO-' . date('Ymd', strtotime('-5 days')) . '-0001',
                'supplier_id' => $sup1->id,
                'user_id' => 1,
                'total' => 0,
                'catatan' => 'Restock oli mesin MPX2 dan SPX2 bulanan',
                'created_at' => date('Y-m-d H:i:s', strtotime('-5 days')),
                'updated_at' => date('Y-m-d H:i:s', strtotime('-5 days'))
            ]);

            $total = 0;
            foreach ($products1 as $p) {
                $qty = 20;
                $subtotal = $p->harga_beli * $qty;
                $total += $subtotal;

                PurchaseItem::create([
                    'purchase_id' => $po1->id,
                    'product_id' => $p->id,
                    'nama_produk' => $p->nama,
                    'harga_beli' => $p->harga_beli,
                    'qty' => $qty,
                    'subtotal' => $subtotal,
                    'created_at' => $po1->created_at,
                    'updated_at' => $po1->updated_at
                ]);

                // Log stock history
                StockHistory::create([
                    'product_id' => $p->id,
                    'user_id' => 1,
                    'type' => 'in',
                    'qty' => $qty,
                    'stok_sebelum' => $p->stok,
                    'stok_sesudah' => $p->stok + $qty,
                    'keterangan' => 'Pembelian dari supplier (' . $po1->no_pembelian . ')',
                    'reference_id' => $po1->id,
                    'created_at' => $po1->created_at,
                    'updated_at' => $po1->updated_at
                ]);

                $p->increment('stok', $qty);
            }

            $po1->update(['total' => $total]);
        }

        // Purchase 2: Federal Parts Indonesia
        $sup2 = $suppliers[1];
        $products2 = Product::where('category_id', 2)->limit(2)->get(); // Kampas Rem

        if ($products2->count() >= 2) {
            $po2 = Purchase::create([
                'no_pembelian' => 'PO-' . date('Ymd', strtotime('-2 days')) . '-0001',
                'supplier_id' => $sup2->id,
                'user_id' => 1,
                'total' => 0,
                'catatan' => 'Pembelian darurat kampas rem Beat FI',
                'created_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
                'updated_at' => date('Y-m-d H:i:s', strtotime('-2 days'))
            ]);

            $total = 0;
            foreach ($products2 as $p) {
                $qty = 15;
                $subtotal = $p->harga_beli * $qty;
                $total += $subtotal;

                PurchaseItem::create([
                    'purchase_id' => $po2->id,
                    'product_id' => $p->id,
                    'nama_produk' => $p->nama,
                    'harga_beli' => $p->harga_beli,
                    'qty' => $qty,
                    'subtotal' => $subtotal,
                    'created_at' => $po2->created_at,
                    'updated_at' => $po2->updated_at
                ]);

                StockHistory::create([
                    'product_id' => $p->id,
                    'user_id' => 1,
                    'type' => 'in',
                    'qty' => $qty,
                    'stok_sebelum' => $p->stok,
                    'stok_sesudah' => $p->stok + $qty,
                    'keterangan' => 'Pembelian dari supplier (' . $po2->no_pembelian . ')',
                    'reference_id' => $po2->id,
                    'created_at' => $po2->created_at,
                    'updated_at' => $po2->updated_at
                ]);

                $p->increment('stok', $qty);
            }

            $po2->update(['total' => $total]);
        }
    }
}
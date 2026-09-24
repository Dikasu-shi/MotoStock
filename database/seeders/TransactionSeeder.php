<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockHistory;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::limit(3)->get();
        $products = Product::where('stok', '>', 5)->limit(5)->get();

        if ($customers->isEmpty() || $products->isEmpty()) return;

        // Transaction 1: 3 days ago
        $tx1 = Transaction::create([
            'no_invoice' => 'INV-' . date('Ymd', strtotime('-3 days')) . '-0001',
            'user_id' => 1,
            'customer_id' => $customers[1]->id,
            'subtotal' => 0,
            'diskon' => 5000,
            'total' => 0,
            'bayar' => 150000,
            'kembalian' => 0,
            'metode_bayar' => 'tunai',
            'catatan' => 'Pelanggan bengkel langganan',
            'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
            'updated_at' => date('Y-m-d H:i:s', strtotime('-3 days'))
        ]);

        $sub1 = 0;
        foreach ($products->slice(0, 2) as $p) {
            $qty = 1;
            $itemSub = $p->harga_jual * $qty;
            $sub1 += $itemSub;

            TransactionItem::create([
                'transaction_id' => $tx1->id,
                'product_id' => $p->id,
                'nama_produk' => $p->nama,
                'harga' => $p->harga_jual,
                'qty' => $qty,
                'subtotal' => $itemSub
            ]);

            StockHistory::create([
                'product_id' => $p->id,
                'user_id' => 1,
                'type' => 'sale',
                'qty' => -$qty,
                'stok_sebelum' => $p->stok,
                'stok_sesudah' => $p->stok - $qty,
                'keterangan' => 'Penjualan invoice (' . $tx1->no_invoice . ')',
                'reference_id' => $tx1->id,
                'created_at' => $tx1->created_at
            ]);

            $p->decrement('stok', $qty);
        }
        $total1 = $sub1 - $tx1->diskon;
        $tx1->update([
            'subtotal' => $sub1,
            'total' => $total1,
            'kembalian' => 150000 - $total1
        ]);

        // Transaction 2: 1 day ago
        $tx2 = Transaction::create([
            'no_invoice' => 'INV-' . date('Ymd', strtotime('-1 day')) . '-0001',
            'user_id' => 1,
            'customer_id' => $customers[0]->id,
            'subtotal' => 0,
            'diskon' => 0,
            'total' => 0,
            'bayar' => 200000,
            'kembalian' => 0,
            'metode_bayar' => 'qris',
            'catatan' => 'Pembayaran via QRIS mandiri',
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'updated_at' => date('Y-m-d H:i:s', strtotime('-1 day'))
        ]);

        $sub2 = 0;
        foreach ($products->slice(2, 2) as $p) {
            $qty = 2;
            $itemSub = $p->harga_jual * $qty;
            $sub2 += $itemSub;

            TransactionItem::create([
                'transaction_id' => $tx2->id,
                'product_id' => $p->id,
                'nama_produk' => $p->nama,
                'harga' => $p->harga_jual,
                'qty' => $qty,
                'subtotal' => $itemSub
            ]);

            StockHistory::create([
                'product_id' => $p->id,
                'user_id' => 1,
                'type' => 'sale',
                'qty' => -$qty,
                'stok_sebelum' => $p->stok,
                'stok_sesudah' => $p->stok - $qty,
                'keterangan' => 'Penjualan invoice (' . $tx2->no_invoice . ')',
                'reference_id' => $tx2->id,
                'created_at' => $tx2->created_at
            ]);

            $p->decrement('stok', $qty);
        }
        $tx2->update([
            'subtotal' => $sub2,
            'total' => $sub2,
            'kembalian' => 200000 - $sub2
        ]);
    }
}
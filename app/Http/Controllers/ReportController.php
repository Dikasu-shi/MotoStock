<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'type' => 'nullable|in:daily,monthly',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $type = $request->type ?? 'daily';

        // 1. Ringkasan Laporan
        $totalOmset = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->sum('total');
        $jumlahTransaksi = Transaction::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->count();
        $rataBelanja = $jumlahTransaksi > 0 ? ($totalOmset / $jumlahTransaksi) : 0;

        // Hitung total profit = sum of (item.harga - product.harga_beli) * item.qty
        $totalProfit = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('(transaction_items.harga - products.harga_beli) * transaction_items.qty'));

        $ringkasan = [
            'total_penjualan' => floatval($totalOmset),
            'jumlah_transaksi' => intval($jumlahTransaksi),
            'rata_rata_transaksi' => floatval($rataBelanja),
            'total_profit' => floatval($totalProfit)
        ];

        // 2. Detail Harian/Bulanan Breakdown
        $dateFormat = $type === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
        $detailHarian = Transaction::select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as tanggal"),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(id) as jumlah_transaksi')
            )
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->groupBy('tanggal')
            ->orderBy('tanggal', 'asc')
            ->get();

        // 3. 10 Produk Terlaris
        $produkTerlaris = TransactionItem::select(
                'transaction_items.product_id',
                'transaction_items.nama_produk',
                'products.sku',
                'products.satuan',
                DB::raw('SUM(transaction_items.qty) as total_qty'),
                DB::raw('SUM(transaction_items.subtotal) as total_omset')
            )
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->groupBy('transaction_items.product_id', 'transaction_items.nama_produk', 'products.sku', 'products.satuan')
            ->orderBy('total_qty', 'desc')
            ->limit(10)
            ->get();

        // 4. Penjualan Per Kategori
        $kategoriPenjualan = TransactionItem::select(
                'categories.nama as kategori_nama',
                DB::raw('SUM(transaction_items.qty) as total_qty'),
                DB::raw('SUM(transaction_items.subtotal) as total_omset')
            )
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereBetween(DB::raw('DATE(transactions.created_at)'), [$startDate, $endDate])
            ->groupBy('categories.nama')
            ->orderBy('total_omset', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'ringkasan' => $ringkasan,
                'detail_harian' => $detailHarian,
                'produk_terlaris' => $produkTerlaris,
                'kategori_penjualan' => $kategoriPenjualan
            ]
        ]);
    }

    public function purchases(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'type' => 'nullable|in:daily,monthly',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $type = $request->type ?? 'daily';

        $totalBeli = \App\Models\Purchase::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->sum('total');
        $jumlahTransaksi = \App\Models\Purchase::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->count();
        $rataBelanja = $jumlahTransaksi > 0 ? ($totalBeli / $jumlahTransaksi) : 0;

        $ringkasan = [
            'total_pembelian' => floatval($totalBeli),
            'jumlah_transaksi' => intval($jumlahTransaksi),
            'rata_rata_transaksi' => floatval($rataBelanja)
        ];

        // Detail Harian/Bulanan breakdown
        $dateFormat = $type === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
        $detailHarian = \App\Models\Purchase::select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as tanggal"),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(id) as jumlah_transaksi')
            )
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->groupBy('tanggal')
            ->orderBy('tanggal', 'asc')
            ->get();

        // Top Suppliers
        $topSuppliers = \App\Models\Purchase::select(
                'suppliers.nama as supplier_nama',
                DB::raw('SUM(purchases.total) as total_omset'),
                DB::raw('COUNT(purchases.id) as jumlah_transaksi')
            )
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween(DB::raw('DATE(purchases.created_at)'), [$startDate, $endDate])
            ->groupBy('suppliers.nama')
            ->orderBy('total_omset', 'desc')
            ->get();

        // Detail items purchased
        $itemsPurchased = \App\Models\PurchaseItem::select(
                'purchase_items.product_id',
                'purchase_items.nama_produk',
                'products.sku',
                DB::raw('SUM(purchase_items.qty) as total_qty'),
                DB::raw('SUM(purchase_items.subtotal) as total_omset')
            )
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween(DB::raw('DATE(purchases.created_at)'), [$startDate, $endDate])
            ->groupBy('purchase_items.product_id', 'purchase_items.nama_produk', 'products.sku')
            ->orderBy('total_qty', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'ringkasan' => $ringkasan,
                'detail_harian' => $detailHarian,
                'top_suppliers' => $topSuppliers,
                'items_purchased' => $itemsPurchased
            ]
        ]);
    }

    public function stockValuation()
    {
        $products = \App\Models\Product::where('is_active', true)->get();

        $totalBeliVal = 0;
        $totalJualVal = 0;
        $totalItems = 0;
        $stokAmanCount = 0;
        $stokMenipisCount = 0;
        $stokHabisCount = 0;

        foreach ($products as $p) {
            $stok = intval($p->stok);
            $totalItems += $stok;
            $totalBeliVal += $p->harga_beli * $stok;
            $totalJualVal += $p->harga_jual * $stok;

            if ($stok <= 0) {
                $stokHabisCount++;
            } elseif ($stok <= $p->stok_minimum) {
                $stokMenipisCount++;
            } else {
                $stokAmanCount++;
            }
        }

        // Group by category valuation
        $kategoriValuation = \App\Models\Product::select(
                'categories.nama as kategori_nama',
                DB::raw('SUM(products.stok) as total_qty'),
                DB::raw('SUM(products.stok * products.harga_beli) as total_valuasi_beli'),
                DB::raw('SUM(products.stok * products.harga_jual) as total_valuasi_jual')
            )
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('products.is_active', true)
            ->groupBy('categories.nama')
            ->orderBy('total_valuasi_beli', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'ringkasan' => [
                    'total_beli_valuation' => $totalBeliVal,
                    'total_jual_valuation' => $totalJualVal,
                    'total_items' => $totalItems,
                    'stok_aman' => $stokAmanCount,
                    'stok_menipis' => $stokMenipisCount,
                    'stok_habis' => $stokHabisCount
                ],
                'kategori_valuation' => $kategoriValuation
            ]
        ]);
    }
}
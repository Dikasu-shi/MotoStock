<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = date('Y-m-d');

        // 1. Penjualan Hari Ini
        $penjualanHariIni = Transaction::whereDate('created_at', $today)->sum('total');

        // 2. Transaksi Hari Ini
        $transaksiHariIni = Transaction::whereDate('created_at', $today)->count();

        // 3. Total Produk Aktif
        $totalProduk = Product::where('is_active', true)->count();

        // 4. Stok Menipis Count & List
        $stokMenipisQuery = Product::select('products.*', 'categories.nama as kategori')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('products.is_active', true)
            ->whereRaw('products.stok <= products.stok_minimum');

        $stokMenipisCount = $stokMenipisQuery->count();
        $stokMenipisList = $stokMenipisQuery->orderBy('products.stok', 'asc')->limit(10)->get();

        // 5. Produk Terlaris (30 Hari)
        $dateLimit = date('Y-m-d H:i:s', strtotime('-30 days'));
        $produkTerlaris = TransactionItem::select(
                'transaction_items.product_id',
                'transaction_items.nama_produk',
                'transaction_items.harga',
                'products.sku',
                'products.satuan',
                DB::raw('SUM(transaction_items.qty) as total_qty')
            )
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.created_at', '>=', $dateLimit)
            ->groupBy('transaction_items.product_id', 'transaction_items.nama_produk', 'transaction_items.harga', 'products.sku', 'products.satuan')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get();

        // 6. Grafik Penjualan (7 Hari Terakhir)
        $grafikPenjualan = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $totalSales = Transaction::whereDate('created_at', $date)->sum('total');
            $grafikPenjualan[] = [
                'tanggal' => $date,
                'total' => floatval($totalSales)
            ];
        }

        // 7. Transaksi Terakhir (5 Transaksi)
        $transaksiTerakhir = Transaction::select('transactions.*', 'customers.nama as customer_nama')
            ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id')
            ->orderBy('transactions.created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'penjualan_hari_ini' => floatval($penjualanHariIni),
                'transaksi_hari_ini' => intval($transaksiHariIni),
                'total_produk' => intval($totalProduk),
                'stok_menipis' => intval($stokMenipisCount),
                'stok_menipis_list' => $stokMenipisList,
                'produk_terlaris' => $produkTerlaris,
                'grafik_penjualan' => $grafikPenjualan,
                'transaksi_terakhir' => $transaksiTerakhir
            ]
        ]);
    }
}
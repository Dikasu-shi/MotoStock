<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['nama' => 'PT. Astra Honda Motor', 'kontak_person' => 'Bpk. Hendra Wijaya', 'telepon' => '021-5551234', 'alamat' => 'Jl. Laksda Yos Sudarso, Sunter, Jakarta Utara', 'email' => 'ahm.supply@honda.co.id'],
            ['nama' => 'Honda Genuine Parts Cengkareng', 'kontak_person' => 'Bpk. Rizki Pratama', 'telepon' => '021-5809999', 'alamat' => 'Jl. Lingkar Luar Barat No. 12A Cengkareng Jakarta', 'email' => 'order@hondacengkareng.com'],
            ['nama' => 'PT. NGK Busi Indonesia', 'kontak_person' => 'Ibu Yuki Tanaka', 'telepon' => '021-8970456', 'alamat' => 'Kawasan Industri MM2100, Bekasi', 'email' => 'sales@ngk.co.id'],
            ['nama' => 'Federal Parts Indonesia', 'kontak_person' => 'Bpk. Ahmad Fauzi', 'telepon' => '021-7654321', 'alamat' => 'Jl. Raya Bogor KM 29, Jakarta Timur', 'email' => 'info@federalparts.co.id'],
            ['nama' => 'Indoparts Nusantara', 'kontak_person' => 'Ibu Dewi Sartika', 'telepon' => '021-3456789', 'alamat' => 'Jl. Hayam Wuruk No. 88, Jakarta Barat', 'email' => 'order@indoparts.co.id']
        ];

        foreach ($suppliers as $s) {
            Supplier::create($s);
        }
    }
}
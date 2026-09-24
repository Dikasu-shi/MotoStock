<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['nama' => 'Umum (Walk-in)', 'telepon' => '-', 'alamat' => '-', 'email' => '-', 'poin' => 0],
            ['nama' => 'Bengkel Jaya Motor', 'telepon' => '08123456789', 'alamat' => 'Jl. Raya Serpong No. 45', 'email' => 'jayamotor@gmail.com', 'poin' => 150],
            ['nama' => 'Ahmad Ridwan', 'telepon' => '08567891234', 'alamat' => 'Jl. Kebon Jeruk No. 12, Jakarta Barat', 'email' => 'ahmad.ridwan@gmail.com', 'poin' => 85],
            ['nama' => 'Bengkel Maju Bersama', 'telepon' => '08111222333', 'alamat' => 'Jl. Daan Mogot KM 18, Tangerang', 'email' => 'majubersama.bengkel@gmail.com', 'poin' => 230],
            ['nama' => 'Dedi Supriadi', 'telepon' => '08999888777', 'alamat' => 'Jl. Cengkareng Indah Blok C5', 'email' => 'dedi.supri@yahoo.com', 'poin' => 45]
        ];

        foreach ($customers as $c) {
            Customer::create($c);
        }
    }
}
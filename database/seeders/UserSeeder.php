<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'username' => 'admin',
            'password' => 'admin123', // Will be hashed automatically by user model cast in Laravel 10/11/12
            'nama' => 'Administrator',
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'kasir1',
            'password' => 'kasir123',
            'nama' => 'Siti Nurhaliza',
            'role' => 'kasir',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'customer1',
            'password' => 'customer123',
            'nama' => 'Budi Santoso',
            'role' => 'customer',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'customer2',
            'password' => 'customer123',
            'nama' => 'Dewi Lestari',
            'role' => 'customer',
            'is_active' => true,
        ]);
    }
}
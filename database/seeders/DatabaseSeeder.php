<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            CustomerSeeder::class,
            SupplierSeeder::class,
            SettingSeeder::class,
            PurchaseSeeder::class,
            StockAdjustmentSeeder::class,
            TransactionSeeder::class,
        ]);
    }
}
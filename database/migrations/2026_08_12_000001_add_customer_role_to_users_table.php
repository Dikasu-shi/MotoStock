<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modify role column to add 'customer' to enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'kasir', 'customer') DEFAULT 'customer'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'kasir') DEFAULT 'kasir'");
    }
};
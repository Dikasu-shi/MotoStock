<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('no_invoice', 50)->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('diskon', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->decimal('bayar', 12, 2);
            $table->decimal('kembalian', 12, 2);
            $table->enum('metode_bayar', ['tunai', 'transfer', 'qris'])->default('tunai');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
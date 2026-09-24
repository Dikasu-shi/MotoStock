<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('status_pembayaran', 50)->default('Dibayar')->after('metode_bayar');
            $table->string('status_pesanan', 50)->default('Selesai')->after('status_pembayaran');
            $table->string('bukti_bayar')->nullable()->after('status_pesanan');
            $table->string('bukti_bayar_original_name')->nullable()->after('bukti_bayar');
            $table->timestamp('bukti_bayar_at')->nullable()->after('bukti_bayar_original_name');
            $table->text('catatan_penolakan')->nullable()->after('bukti_bayar_at');
            $table->timestamp('konfirmasi_at')->nullable()->after('catatan_penolakan');
            $table->unsignedBigInteger('verified_by')->nullable()->after('konfirmasi_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'status_pembayaran',
                'status_pesanan',
                'bukti_bayar',
                'bukti_bayar_original_name',
                'bukti_bayar_at',
                'catatan_penolakan',
                'konfirmasi_at',
                'verified_by'
            ]);
        });
    }
};

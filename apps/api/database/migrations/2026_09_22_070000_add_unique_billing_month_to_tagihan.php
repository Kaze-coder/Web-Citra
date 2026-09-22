<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tagihan') && ! Schema::hasIndex('tagihan', ['pelanggan_id', 'bulan_tagihan'], 'unique')) {
            $hasDuplicates = DB::table('tagihan')
                ->select(['pelanggan_id', 'bulan_tagihan'])
                ->groupBy('pelanggan_id', 'bulan_tagihan')
                ->havingRaw('COUNT(*) > 1')
                ->exists();

            if ($hasDuplicates) {
                throw new RuntimeException(
                    'Duplikat tagihan per pelanggan dan bulan harus diselesaikan sebelum migrasi dijalankan.'
                );
            }

            Schema::table('tagihan', function (Blueprint $table): void {
                $table->unique(['pelanggan_id', 'bulan_tagihan'], 'uq_tagihan_pelanggan_bulan');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tagihan') && Schema::hasIndex('tagihan', 'uq_tagihan_pelanggan_bulan')) {
            Schema::table('tagihan', function (Blueprint $table): void {
                $table->dropUnique('uq_tagihan_pelanggan_bulan');
            });
        }
    }
};

<?php

namespace Tests\Concerns;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

trait BuildsLegacySchema
{
    protected function createLegacySchema(): void
    {
        Schema::create('admin', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password');
            $table->string('nama_lengkap', 100)->nullable();
            $table->string('status')->default('aktif');
            $table->string('role')->default('operator');
            $table->timestamp('tanggal_dibuat')->nullable();
            $table->timestamp('tanggal_login_terakhir')->nullable();
            $table->timestamp('tanggal_diperbarui')->nullable();
        });

        Schema::create('pelanggan', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nama_pelanggan', 100);
            $table->string('no_telepon', 15)->unique();
            $table->string('email', 100)->nullable();
            $table->text('alamat');
            $table->string('status')->default('aktif');
            $table->string('paket_layanan', 50)->nullable();
            $table->decimal('harga_bulanan', 10, 2)->nullable();
            $table->date('tanggal_langganan');
            $table->timestamp('tanggal_dibuat')->nullable();
            $table->timestamp('tanggal_diperbarui')->nullable();
        });

        Schema::create('lokasi', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('pelanggan_id')->unique();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('keterangan_lokasi', 255)->nullable();
            $table->timestamp('tanggal_dibuat')->nullable();
            $table->foreign('pelanggan_id')->references('id')->on('pelanggan')->cascadeOnDelete();
        });

        Schema::create('perangkat', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('pelanggan_id');
            $table->string('nama_perangkat', 100);
            $table->string('tipe_perangkat')->default('router');
            $table->string('ip_address', 50)->nullable();
            $table->string('mac_address', 50)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->string('status_perangkat')->default('aktif');
            $table->date('tanggal_instalasi')->nullable();
            $table->timestamp('tanggal_dibuat')->nullable();
            $table->timestamp('tanggal_diperbarui')->nullable();
            $table->foreign('pelanggan_id')->references('id')->on('pelanggan')->cascadeOnDelete();
        });

        Schema::create('tagihan', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('pelanggan_id');
            $table->date('bulan_tagihan');
            $table->decimal('jumlah_tagihan', 10, 2);
            $table->string('status_pembayaran')->default('belum_lunas');
            $table->date('tanggal_pembayaran')->nullable();
            $table->string('metode_pembayaran', 50)->nullable();
            $table->text('catatan')->nullable();
            $table->timestamp('tanggal_dibuat')->nullable();
            $table->timestamp('tanggal_diperbarui')->nullable();
            $table->foreign('pelanggan_id')->references('id')->on('pelanggan')->cascadeOnDelete();
            $table->unique(['pelanggan_id', 'bulan_tagihan'], 'uq_tagihan_pelanggan_bulan');
        });

        if (! Schema::hasTable('notification_dispatches')) {
            Schema::create('notification_dispatches', function (Blueprint $table): void {
                $table->id();
                $table->string('dedupe_key', 64)->unique();
                $table->string('channel', 20)->default('whatsapp');
                $table->string('recipient', 30);
                $table->text('message');
                $table->string('status', 20)->default('queued');
                $table->unsignedSmallInteger('attempts')->default(0);
                $table->text('last_error')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }
}

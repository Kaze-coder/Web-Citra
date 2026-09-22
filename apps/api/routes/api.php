<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LokasiController;
use App\Http\Controllers\Api\V1\PelangganController;
use App\Http\Controllers\Api\V1\PerangkatController;
use App\Http\Controllers\Api\V1\TagihanController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active.admin'])->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});

Route::middleware(['auth:sanctum', 'active.admin'])->group(function (): void {
    Route::get('/pelanggan/statistik', [PelangganController::class, 'statistics']);
    Route::get('/maps/customers', [PelangganController::class, 'coordinates']);
    Route::apiResource('pelanggan', PelangganController::class);

    Route::get('/perangkat/pelanggan/{pelanggan}', [PerangkatController::class, 'byCustomer'])->whereNumber('pelanggan');
    Route::apiResource('perangkat', PerangkatController::class);

    Route::get('/tagihan/statistik', [TagihanController::class, 'statistics']);
    Route::get('/tagihan/belum-bayar', [TagihanController::class, 'outstanding']);
    Route::get('/tagihan/pelanggan/{pelanggan}', [TagihanController::class, 'byCustomer'])->whereNumber('pelanggan');
    Route::apiResource('tagihan', TagihanController::class);

    Route::get('/lokasi/pelanggan/{pelanggan}', [LokasiController::class, 'byCustomer'])->whereNumber('pelanggan');
    Route::apiResource('lokasi', LokasiController::class);
});

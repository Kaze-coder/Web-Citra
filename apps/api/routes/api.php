<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\CustomerImportController;
use App\Http\Controllers\Api\V1\GeocodingController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LokasiController;
use App\Http\Controllers\Api\V1\PelangganController;
use App\Http\Controllers\Api\V1\PerangkatController;
use App\Http\Controllers\Api\V1\TagihanController;
use App\Http\Controllers\Api\V1\WhatsAppController;
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
    Route::middleware('throttle:geocoding')->prefix('geocoding')->group(function (): void {
        Route::post('/geocode', [GeocodingController::class, 'geocode']);
        Route::post('/reverse', [GeocodingController::class, 'reverse']);
    });

    Route::get('/pelanggan/statistik', [PelangganController::class, 'statistics']);
    Route::post('/pelanggan/geocode/auto-all', [PelangganController::class, 'geocodeMissing'])->middleware('throttle:operations');
    Route::post('/pelanggan/import', CustomerImportController::class)->middleware('throttle:operations');
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

    Route::middleware('throttle:whatsapp')->prefix('whatsapp')->group(function (): void {
        Route::post('/send', [WhatsAppController::class, 'send']);
        Route::post('/send-reminder', [WhatsAppController::class, 'reminder']);
        Route::post('/send-confirmation', [WhatsAppController::class, 'confirmation']);
        Route::post('/send-reminder-h3', [WhatsAppController::class, 'remindersH3']);
    });

    Route::prefix('billing')->group(function (): void {
        Route::get('/schedules', [BillingController::class, 'schedules']);
        Route::get('/schedules/{pelanggan}', [BillingController::class, 'schedule'])->whereNumber('pelanggan');
        Route::post('/run', [BillingController::class, 'run'])->middleware('throttle:operations');
        Route::get('/status', [BillingController::class, 'status']);
    });

    Route::apiResource('admins', AdminController::class)->parameters(['admins' => 'admin']);
});

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;

class BillingController extends Controller
{
    public function schedules(BillingService $billing): JsonResponse
    {
        $this->authorize('viewAny', Pelanggan::class);

        return $this->success($billing->schedules(), 'Jadwal tagihan berhasil diambil.');
    }

    public function schedule(Pelanggan $pelanggan, BillingService $billing): JsonResponse
    {
        $this->authorize('view', $pelanggan);
        abort_unless($pelanggan->status === 'aktif', 404);

        return $this->success($billing->schedule($pelanggan), 'Jadwal tagihan pelanggan berhasil diambil.');
    }

    public function run(BillingService $billing): JsonResponse
    {
        $this->authorize('run-billing');

        return $this->success($billing->run(), 'Pemeriksaan tagihan selesai.');
    }

    public function status(): JsonResponse
    {
        $this->authorize('viewAny', Pelanggan::class);

        return $this->success([
            'enabled' => true,
            'billing_schedule' => 'daily at 00:00',
            'reminder_schedule' => 'daily at 08:00',
            'queue_connection' => config('queue.default'),
        ], 'Status scheduler berhasil diambil.');
    }
}

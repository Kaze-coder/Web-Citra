<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lokasi;
use App\Services\EarthEngineService;
use Illuminate\Http\JsonResponse;

class EarthEngineController extends Controller
{
    public function status(EarthEngineService $earthEngine): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);

        return $this->success($earthEngine->status(), 'Status Earth Engine berhasil diambil.');
    }

    public function tiles(EarthEngineService $earthEngine): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);

        return $this->success($earthEngine->tiles(), 'Layer Earth Engine berhasil diambil.');
    }

    public function clearCache(EarthEngineService $earthEngine): JsonResponse
    {
        $this->authorize('create', Lokasi::class);
        $earthEngine->clearCache();

        return $this->success(null, 'Cache Earth Engine berhasil dibersihkan.');
    }
}

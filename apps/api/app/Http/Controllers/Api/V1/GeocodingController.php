<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lokasi;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeocodingController extends Controller
{
    public function geocode(Request $request, GeocodingService $geocoding): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);
        $validated = $request->validate(['address' => ['required', 'string', 'max:500']]);
        $result = $geocoding->geocode($validated['address']);

        return $result
            ? $this->success($result, 'Koordinat alamat berhasil ditemukan.')
            : $this->success(null, 'Alamat tidak ditemukan.', status: 404);
    }

    public function reverse(Request $request, GeocodingService $geocoding): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);
        $result = $geocoding->reverse((float) $validated['latitude'], (float) $validated['longitude']);

        return $result
            ? $this->success($result, 'Alamat koordinat berhasil ditemukan.')
            : $this->success(null, 'Alamat tidak ditemukan.', status: 404);
    }
}

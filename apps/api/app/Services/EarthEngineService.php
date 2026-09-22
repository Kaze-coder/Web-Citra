<?php

namespace App\Services;

use App\Exceptions\ExternalServiceException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class EarthEngineService
{
    public function status(): array
    {
        return $this->request()->get('/v1/status')->throw()->json('data')
            ?? throw new ExternalServiceException('Respons Earth Engine tidak valid.');
    }

    public function tiles(): array
    {
        return $this->request()->get('/v1/tiles')->throw()->json('data')
            ?? throw new ExternalServiceException('Respons Earth Engine tidak valid.');
    }

    public function clearCache(): void
    {
        $this->request()->delete('/v1/cache')->throw();
    }

    private function request(): PendingRequest
    {
        $token = (string) config('services.earth_engine.token');
        if ($token === '') {
            throw new ExternalServiceException('Earth Engine belum dikonfigurasi.');
        }

        return Http::baseUrl(rtrim((string) config('services.earth_engine.url'), '/'))
            ->acceptJson()
            ->withHeaders(['X-Internal-Token' => $token])
            ->timeout(15);
    }
}

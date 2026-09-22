<?php

namespace App\Jobs;

use App\Models\Pelanggan;
use App\Services\GeocodingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Queue\SerializesModels;

class GeocodeCustomer implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $uniqueFor = 3600;

    public function __construct(public readonly int $customerId) {}

    public function handle(GeocodingService $geocoding): void
    {
        $customer = Pelanggan::query()->findOrFail($this->customerId);
        if ($customer->lokasi()->exists()) {
            return;
        }

        $coordinates = $geocoding->geocode($customer->alamat);
        if ($coordinates) {
            $customer->lokasi()->create([
                'latitude' => $coordinates['latitude'],
                'longitude' => $coordinates['longitude'],
                'keterangan_lokasi' => $coordinates['formatted_address'],
            ]);
        }
    }

    public function middleware(): array
    {
        return [(new RateLimited('nominatim'))->releaseAfter(1)];
    }

    public function uniqueId(): string
    {
        return (string) $this->customerId;
    }
}

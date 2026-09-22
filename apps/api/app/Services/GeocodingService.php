<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class GeocodingService
{
    public function geocode(string $address): ?array
    {
        foreach ($this->variations($address) as $query) {
            $result = $this->client()->get('/search', [
                'q' => $query,
                'format' => 'json',
                'limit' => 1,
                'accept-language' => 'id',
            ])->throw()->json('0');

            if (is_array($result) && isset($result['lat'], $result['lon'])) {
                return [
                    'latitude' => (float) $result['lat'],
                    'longitude' => (float) $result['lon'],
                    'formatted_address' => (string) ($result['display_name'] ?? $query),
                    'place_id' => $result['place_id'] ?? null,
                ];
            }
        }

        return null;
    }

    public function reverse(float $latitude, float $longitude): ?array
    {
        $result = $this->client()->get('/reverse', [
            'lat' => $latitude,
            'lon' => $longitude,
            'format' => 'json',
            'accept-language' => 'id',
        ])->throw()->json();

        if (! is_array($result) || empty($result['display_name'])) {
            return null;
        }

        return ['address' => (string) $result['display_name']];
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.nominatim.url'), '/'))
            ->acceptJson()
            ->withUserAgent((string) config('services.nominatim.user_agent'))
            ->timeout(10);
    }

    private function variations(string $address): array
    {
        $address = trim($address);
        $kampung = $this->extractKampung($address);
        $city = $this->extractCity($address);
        $province = $this->extractProvince($address);

        return array_values(array_unique(array_filter([
            $address.', Indonesia',
            $address,
            $kampung && $city && $province ? "{$kampung}, {$city}, {$province}, Indonesia" : null,
            $kampung && $city ? "{$kampung}, {$city}, Indonesia" : null,
            $city && $province ? "{$city}, {$province}, Indonesia" : null,
            $city ? "{$city}, Indonesia" : null,
            $province ? "{$province}, Indonesia" : null,
        ])));
    }

    private function extractKampung(string $address): string
    {
        preg_match('/Kp\.\s+([^,]+)/i', $address, $kampung);
        if (! empty($kampung[1])) {
            return trim($kampung[1]);
        }

        preg_match('/(?:Desa|Kelurahan)\s+([^,]+)/i', $address, $desa);

        return trim($desa[1] ?? '');
    }

    private function extractCity(string $address): string
    {
        $parts = array_filter(array_map('trim', explode(',', $address)), function (string $part): bool {
            return $part !== ''
                && ! preg_match('/^(?:ID|INDONESIA|\d{5,6})$/i', $part)
                && ! preg_match('/(?:Jl\.|No\.|RT\.|RW\.|Kp\.)/i', $part);
        });

        foreach ($parts as $part) {
            if (str_contains(strtolower($part), 'kec.')) {
                return trim(str_ireplace('Kec.', '', $part));
            }
        }

        $provinceTerms = '/JAWA|SUMATERA|SULAWESI|KALIMANTAN|BARAT|TIMUR|TENGAH|TENGGARA|BALI|MALUKU|PAPUA|RIAU|JAMBI|BENGKULU|LAMPUNG|YOGYAKARTA/i';
        foreach (array_reverse($parts) as $part) {
            if (! preg_match($provinceTerms, $part) && ! preg_match('/KAB\.|KOTA/i', $part)) {
                return $part;
            }
        }

        return '';
    }

    private function extractProvince(string $address): string
    {
        $provinces = [
            'JAWA BARAT', 'JAWA TIMUR', 'JAWA TENGAH', 'SUMATERA UTARA', 'SUMATERA BARAT',
            'RIAU', 'JAMBI', 'SUMATERA SELATAN', 'KALIMANTAN UTARA', 'KALIMANTAN BARAT',
            'KALIMANTAN TENGAH', 'KALIMANTAN SELATAN', 'KALIMANTAN TIMUR', 'SULAWESI UTARA',
            'SULAWESI TENGAH', 'SULAWESI SELATAN', 'SULAWESI TENGGARA', 'NUSA TENGGARA BARAT',
            'NUSA TENGGARA TIMUR', 'MALUKU UTARA', 'MALUKU', 'PAPUA BARAT', 'PAPUA',
            'BALI', 'YOGYAKARTA', 'JAKARTA', 'BENGKULU', 'LAMPUNG',
        ];
        $upper = strtoupper($address);

        foreach ($provinces as $province) {
            if (str_contains($upper, $province)) {
                return ucwords(strtolower($province));
            }
        }

        return '';
    }
}

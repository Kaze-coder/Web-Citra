<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FonnteService
{
    public function send(string $phone, string $message): array
    {
        $token = (string) config('services.fonnte.token');
        if ($token === '') {
            throw new RuntimeException('FONNTE_TOKEN belum dikonfigurasi.');
        }

        $response = Http::baseUrl(rtrim((string) config('services.fonnte.url'), '/'))
            ->withHeaders(['Authorization' => $token])
            ->asForm()
            ->timeout(15)
            ->post('/send', [
                'target' => $this->formatPhone($phone),
                'message' => $message,
                'countryCode' => '62',
            ])
            ->throw()
            ->json();

        if (! is_array($response) || ($response['status'] ?? false) !== true) {
            throw new RuntimeException('Fonnte menolak pengiriman pesan.');
        }

        return $response;
    }

    public function formatPhone(string $phone): string
    {
        $phone = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($phone, '0')) {
            return '62'.substr($phone, 1);
        }

        return str_starts_with($phone, '62') ? $phone : '62'.$phone;
    }
}

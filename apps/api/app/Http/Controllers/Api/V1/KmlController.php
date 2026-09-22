<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Services\KmlService;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class KmlController extends Controller
{
    public function all(KmlService $kml): Response
    {
        $this->authorize('viewAny', Pelanggan::class);
        $customers = Pelanggan::query()->whereHas('lokasi')->with('lokasi')->orderBy('nama_pelanggan')->get();

        return $this->download($kml->customers($customers, 'Lokasi Pelanggan Citra NET'), 'lokasi-pelanggan.kml');
    }

    public function customer(Pelanggan $pelanggan, KmlService $kml): Response
    {
        $this->authorize('view', $pelanggan);
        abort_unless($pelanggan->load('lokasi')->lokasi, 404);
        $slug = Str::slug($pelanggan->nama_pelanggan) ?: 'pelanggan-'.$pelanggan->id;
        $filename = 'lokasi-'.$slug.'.kml';

        return $this->download($kml->customers(collect([$pelanggan]), $pelanggan->nama_pelanggan.' - Citra NET'), $filename);
    }

    private function download(string $content, string $filename): Response
    {
        return response($content, 200, [
            'Content-Type' => 'application/vnd.google-earth.kml+xml; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}

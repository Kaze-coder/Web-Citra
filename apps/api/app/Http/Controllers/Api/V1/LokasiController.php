<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LokasiRequest;
use App\Models\Lokasi;
use App\Models\Pelanggan;
use Illuminate\Http\JsonResponse;

class LokasiController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);
        $data = Lokasi::query()->with('pelanggan')->latest('id')->get()->map(fn (Lokasi $lokasi) => $this->data($lokasi));

        return $this->success($data, 'Data lokasi berhasil diambil.');
    }

    public function byCustomer(Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('viewAny', Lokasi::class);
        $lokasi = $pelanggan->lokasi()->with('pelanggan')->first();

        return $this->success($lokasi ? $this->data($lokasi) : null, 'Data lokasi pelanggan berhasil diambil.');
    }

    public function show(Lokasi $lokasi): JsonResponse
    {
        $this->authorize('view', $lokasi);

        return $this->success($this->data($lokasi->load('pelanggan')), 'Data lokasi berhasil diambil.');
    }

    public function store(LokasiRequest $request): JsonResponse
    {
        $this->authorize('create', Lokasi::class);
        $data = $request->validated();
        $data['keterangan_lokasi'] ??= 'Lokasi Pelanggan';
        $lokasi = Lokasi::query()->create($data)->load('pelanggan');

        return $this->success($this->data($lokasi), 'Lokasi baru berhasil ditambahkan.', status: 201);
    }

    public function update(LokasiRequest $request, Lokasi $lokasi): JsonResponse
    {
        $this->authorize('update', $lokasi);
        $lokasi->update($request->validated());

        return $this->success($this->data($lokasi->refresh()->load('pelanggan')), 'Lokasi berhasil diperbarui.');
    }

    public function destroy(Lokasi $lokasi): JsonResponse
    {
        $this->authorize('delete', $lokasi);
        $lokasi->delete();

        return $this->success(null, 'Lokasi berhasil dihapus.');
    }

    private function data(Lokasi $lokasi): array
    {
        $pelanggan = $lokasi->relationLoaded('pelanggan') ? $lokasi->pelanggan : null;

        return [
            ...$lokasi->withoutRelations()->toArray(),
            'nama_pelanggan' => $pelanggan?->nama_pelanggan,
            'no_telepon' => $pelanggan?->no_telepon,
            'alamat' => $pelanggan?->alamat,
        ];
    }
}

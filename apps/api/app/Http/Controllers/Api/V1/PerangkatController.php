<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PerangkatRequest;
use App\Models\Pelanggan;
use App\Models\Perangkat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerangkatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Perangkat::class);
        $perPage = min(max($request->integer('limit', 10), 1), 100);
        $paginator = Perangkat::query()->with('pelanggan')->latest('id')->paginate($perPage);

        return $this->success(
            collect($paginator->items())->map(fn (Perangkat $perangkat) => $this->data($perangkat))->values(),
            'Data perangkat berhasil diambil.',
            ['pagination' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'pages' => $paginator->lastPage(),
            ]]
        );
    }

    public function byCustomer(Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('viewAny', Perangkat::class);

        return $this->success(
            $pelanggan->perangkat()->with('pelanggan')->latest('id')->get()->map(fn (Perangkat $item) => $this->data($item)),
            'Data perangkat pelanggan berhasil diambil.'
        );
    }

    public function show(Perangkat $perangkat): JsonResponse
    {
        $this->authorize('view', $perangkat);

        return $this->success($this->data($perangkat->load('pelanggan')), 'Data perangkat berhasil diambil.');
    }

    public function store(PerangkatRequest $request): JsonResponse
    {
        $this->authorize('create', Perangkat::class);
        $data = $request->validated();
        $data['tipe_perangkat'] ??= 'router';
        $data['status_perangkat'] ??= 'aktif';
        $perangkat = Perangkat::query()->create($data)->load('pelanggan');

        return $this->success($this->data($perangkat), 'Perangkat baru berhasil ditambahkan.', status: 201);
    }

    public function update(PerangkatRequest $request, Perangkat $perangkat): JsonResponse
    {
        $this->authorize('update', $perangkat);
        $perangkat->update($request->validated());

        return $this->success($this->data($perangkat->refresh()->load('pelanggan')), 'Perangkat berhasil diperbarui.');
    }

    public function destroy(Perangkat $perangkat): JsonResponse
    {
        $this->authorize('delete', $perangkat);
        $perangkat->delete();

        return $this->success(null, 'Perangkat berhasil dihapus.');
    }

    private function data(Perangkat $perangkat): array
    {
        $pelanggan = $perangkat->relationLoaded('pelanggan') ? $perangkat->pelanggan : null;

        return [
            ...$perangkat->withoutRelations()->toArray(),
            'nama_pelanggan' => $pelanggan?->nama_pelanggan,
            'no_telepon' => $pelanggan?->no_telepon,
        ];
    }
}

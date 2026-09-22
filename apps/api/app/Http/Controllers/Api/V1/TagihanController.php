<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TagihanRequest;
use App\Models\Pelanggan;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagihanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Tagihan::class);
        $perPage = min(max($request->integer('limit', 10), 1), 100);
        $status = $request->query('status');

        $query = Tagihan::query()->with('pelanggan')->latest('bulan_tagihan');
        if (in_array($status, ['lunas', 'belum_lunas', 'cicilan'], true)) {
            $query->where('status_pembayaran', $status);
        }

        $paginator = $query->paginate($perPage);

        return $this->success(
            collect($paginator->items())->map(fn (Tagihan $tagihan) => $this->data($tagihan))->values(),
            'Data tagihan berhasil diambil.',
            ['pagination' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'pages' => $paginator->lastPage(),
            ]]
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', Tagihan::class);
        $stats = Tagihan::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status_pembayaran = 'lunas' THEN 1 ELSE 0 END) as lunas")
            ->selectRaw("SUM(CASE WHEN status_pembayaran = 'belum_lunas' THEN 1 ELSE 0 END) as belum_lunas")
            ->selectRaw("SUM(CASE WHEN status_pembayaran = 'cicilan' THEN 1 ELSE 0 END) as cicilan")
            ->selectRaw("COALESCE(SUM(CASE WHEN status_pembayaran = 'lunas' THEN jumlah_tagihan ELSE 0 END), 0) as total_pemasukan")
            ->first();

        return $this->success([
            'total' => (int) $stats->total,
            'lunas' => (int) $stats->lunas,
            'belum_lunas' => (int) $stats->belum_lunas,
            'cicilan' => (int) $stats->cicilan,
            'totalPemasukan' => (string) $stats->total_pemasukan,
        ], 'Statistik tagihan berhasil diambil.');
    }

    public function outstanding(): JsonResponse
    {
        $this->authorize('viewAny', Tagihan::class);
        $data = Tagihan::query()
            ->with('pelanggan')
            ->where('status_pembayaran', 'belum_lunas')
            ->oldest('bulan_tagihan')
            ->get()
            ->map(fn (Tagihan $tagihan) => $this->data($tagihan));

        return $this->success($data, 'Data tagihan belum dibayar berhasil diambil.');
    }

    public function byCustomer(Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('viewAny', Tagihan::class);

        return $this->success(
            $pelanggan->tagihan()->with('pelanggan')->latest('bulan_tagihan')->get()->map(fn (Tagihan $item) => $this->data($item)),
            'Data tagihan pelanggan berhasil diambil.'
        );
    }

    public function show(Tagihan $tagihan): JsonResponse
    {
        $this->authorize('view', $tagihan);

        return $this->success($this->data($tagihan->load('pelanggan')), 'Data tagihan berhasil diambil.');
    }

    public function store(TagihanRequest $request): JsonResponse
    {
        $this->authorize('create', Tagihan::class);
        $data = $request->validated();
        $data['status_pembayaran'] ??= 'belum_lunas';
        $tagihan = Tagihan::query()->create($data)->load('pelanggan');

        return $this->success($this->data($tagihan), 'Tagihan baru berhasil dibuat.', status: 201);
    }

    public function update(TagihanRequest $request, Tagihan $tagihan): JsonResponse
    {
        $this->authorize('update', $tagihan);
        $tagihan->update($request->validated());

        return $this->success($this->data($tagihan->refresh()->load('pelanggan')), 'Tagihan berhasil diperbarui.');
    }

    public function destroy(Tagihan $tagihan): JsonResponse
    {
        $this->authorize('delete', $tagihan);
        $tagihan->delete();

        return $this->success(null, 'Tagihan berhasil dihapus.');
    }

    private function data(Tagihan $tagihan): array
    {
        $pelanggan = $tagihan->relationLoaded('pelanggan') ? $tagihan->pelanggan : null;

        return [
            ...$tagihan->withoutRelations()->toArray(),
            'nama_pelanggan' => $pelanggan?->nama_pelanggan,
            'no_telepon' => $pelanggan?->no_telepon,
        ];
    }
}

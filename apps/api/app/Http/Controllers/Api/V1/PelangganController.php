<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PelangganRequest;
use App\Models\Pelanggan;
use App\Models\Tagihan;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PelangganController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Pelanggan::class);

        $perPage = min(max($request->integer('limit', 10), 1), 100);
        $search = trim((string) $request->query('search', ''));

        $query = Pelanggan::query()->with('lokasi');
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('nama_pelanggan', 'like', "%{$search}%")
                    ->orWhere('no_telepon', 'like', "%{$search}%")
                    ->orWhere('alamat', 'like', "%{$search}%");
            });
        }

        $paginator = $query->latest('id')->paginate($perPage);

        return $this->success(
            collect($paginator->items())->map(fn (Pelanggan $pelanggan) => $this->data($pelanggan))->values(),
            'Data pelanggan berhasil diambil.',
            ['pagination' => $this->pagination($paginator)]
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', Pelanggan::class);

        $pelanggan = Pelanggan::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif")
            ->first();
        $tagihan = Tagihan::query()
            ->selectRaw("SUM(CASE WHEN status_pembayaran = 'belum_lunas' THEN 1 ELSE 0 END) as tagihan_belum")
            ->selectRaw("COALESCE(SUM(CASE WHEN status_pembayaran = 'lunas' THEN jumlah_tagihan ELSE 0 END), 0) as total_pemasukan")
            ->first();

        return $this->success([
            'total' => (int) $pelanggan->total,
            'aktif' => (int) $pelanggan->aktif,
            'tagihanBelum' => (int) $tagihan->tagihan_belum,
            'totalPemasukan' => (string) $tagihan->total_pemasukan,
        ], 'Statistik pelanggan berhasil diambil.');
    }

    public function coordinates(): JsonResponse
    {
        $this->authorize('viewAny', Pelanggan::class);

        $data = Pelanggan::query()
            ->whereHas('lokasi')
            ->with('lokasi')
            ->orderBy('nama_pelanggan')
            ->get()
            ->map(fn (Pelanggan $pelanggan) => $this->data($pelanggan));

        return $this->success($data, 'Data pelanggan dengan koordinat berhasil diambil.');
    }

    public function show(Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('view', $pelanggan);

        return $this->success($this->data($pelanggan->load('lokasi')), 'Data pelanggan berhasil diambil.');
    }

    public function store(PelangganRequest $request, GeocodingService $geocoding): JsonResponse
    {
        $this->authorize('create', Pelanggan::class);

        $pelanggan = DB::transaction(function () use ($request): Pelanggan {
            $data = $request->validated();
            $coordinates = Arr::only($data, ['latitude', 'longitude']);
            unset($data['latitude'], $data['longitude']);

            $data['status'] ??= 'aktif';
            $data['tanggal_langganan'] ??= now()->toDateString();
            $pelanggan = Pelanggan::query()->create($data);

            if (isset($coordinates['latitude'], $coordinates['longitude'])) {
                $pelanggan->lokasi()->create([
                    ...$coordinates,
                    'keterangan_lokasi' => 'Lokasi '.$pelanggan->nama_pelanggan,
                ]);
            }

            return $pelanggan->load('lokasi');
        });

        if (! $pelanggan->lokasi && $pelanggan->alamat) {
            try {
                $coordinates = $geocoding->geocode($pelanggan->alamat);
                if ($coordinates) {
                    $pelanggan->lokasi()->create([
                        'latitude' => $coordinates['latitude'],
                        'longitude' => $coordinates['longitude'],
                        'keterangan_lokasi' => $coordinates['formatted_address'],
                    ]);
                    $pelanggan->load('lokasi');
                }
            } catch (Throwable $exception) {
                Log::warning('Auto-geocode pelanggan gagal.', [
                    'pelanggan_id' => $pelanggan->id,
                    'exception' => $exception::class,
                ]);
            }
        }

        return $this->success($this->data($pelanggan), 'Pelanggan baru berhasil ditambahkan.', status: 201);
    }

    public function geocodeMissing(GeocodingService $geocoding): JsonResponse
    {
        $this->authorize('create', Pelanggan::class);
        $customers = Pelanggan::query()->whereDoesntHave('lokasi')->whereNotNull('alamat')->get();
        $success = 0;
        $failed = 0;

        foreach ($customers as $index => $pelanggan) {
            try {
                $coordinates = $geocoding->geocode($pelanggan->alamat);
                if ($coordinates) {
                    $pelanggan->lokasi()->create([
                        'latitude' => $coordinates['latitude'],
                        'longitude' => $coordinates['longitude'],
                        'keterangan_lokasi' => $coordinates['formatted_address'],
                    ]);
                    $success++;
                } else {
                    $failed++;
                }
            } catch (Throwable $exception) {
                $failed++;
                Log::warning('Batch geocode pelanggan gagal.', [
                    'pelanggan_id' => $pelanggan->id,
                    'exception' => $exception::class,
                ]);
            }

            if ($index < $customers->count() - 1) {
                usleep(1_000_000);
            }
        }

        return $this->success([
            'total' => $customers->count(),
            'success' => $success,
            'failed' => $failed,
        ], 'Proses geocoding pelanggan selesai.');
    }

    public function update(PelangganRequest $request, Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('update', $pelanggan);

        DB::transaction(function () use ($request, $pelanggan): void {
            $data = $request->validated();
            $coordinates = Arr::only($data, ['latitude', 'longitude']);
            unset($data['latitude'], $data['longitude']);
            $pelanggan->update($data);

            if (isset($coordinates['latitude'], $coordinates['longitude'])) {
                $pelanggan->lokasi()->updateOrCreate(
                    ['pelanggan_id' => $pelanggan->id],
                    [...$coordinates, 'keterangan_lokasi' => $pelanggan->alamat]
                );
            }
        });

        return $this->success(
            $this->data($pelanggan->refresh()->load('lokasi')),
            'Pelanggan berhasil diperbarui.'
        );
    }

    public function destroy(Pelanggan $pelanggan): JsonResponse
    {
        $this->authorize('delete', $pelanggan);
        $pelanggan->delete();

        return $this->success(null, 'Pelanggan berhasil dihapus.');
    }

    private function data(Pelanggan $pelanggan): array
    {
        $lokasi = $pelanggan->relationLoaded('lokasi') ? $pelanggan->lokasi : null;

        return [
            ...$pelanggan->withoutRelations()->toArray(),
            'latitude' => $lokasi?->latitude,
            'longitude' => $lokasi?->longitude,
            'keterangan_lokasi' => $lokasi?->keterangan_lokasi,
        ];
    }

    private function pagination($paginator): array
    {
        return [
            'page' => $paginator->currentPage(),
            'limit' => $paginator->perPage(),
            'total' => $paginator->total(),
            'pages' => $paginator->lastPage(),
        ];
    }
}

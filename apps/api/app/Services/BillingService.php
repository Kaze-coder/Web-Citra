<?php

namespace App\Services;

use App\Models\Pelanggan;
use App\Models\Tagihan;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class BillingService
{
    public function __construct(
        private readonly WhatsAppMessageService $messages,
        private readonly WhatsAppDispatcher $dispatcher,
    ) {}

    public function schedules(): Collection
    {
        return Pelanggan::query()
            ->where('status', 'aktif')
            ->withCount(['tagihan as tagihan_belum_lunas' => fn ($query) => $query->where('status_pembayaran', 'belum_lunas')])
            ->orderBy('nama_pelanggan')
            ->get()
            ->map(fn (Pelanggan $pelanggan): array => $this->schedule($pelanggan));
    }

    public function schedule(Pelanggan $pelanggan): array
    {
        $next = $this->nextScheduledDate($pelanggan);
        $days = CarbonImmutable::today()->diffInDays($next, false);

        return [
            'id' => $pelanggan->id,
            'nama_pelanggan' => $pelanggan->nama_pelanggan,
            'no_telepon' => $pelanggan->no_telepon,
            'paket_layanan' => $pelanggan->paket_layanan,
            'harga_bulanan' => $pelanggan->harga_bulanan,
            'tanggal_langganan' => $pelanggan->tanggal_langganan?->toDateString(),
            'tagihan_belum_lunas' => (int) ($pelanggan->tagihan_belum_lunas ?? $pelanggan->tagihan()->where('status_pembayaran', 'belum_lunas')->count()),
            'next_billing_date' => $next->toDateString(),
            'next_billing_formatted' => $next->locale('id')->translatedFormat('l, d F Y'),
            'days_until_billing' => $days,
            'status' => $days <= 0 ? 'overdue' : ($days <= 3 ? 'soon' : 'normal'),
        ];
    }

    public function run(): array
    {
        $result = ['checked' => 0, 'created' => 0, 'queued' => 0, 'skipped' => 0];

        Pelanggan::query()->where('status', 'aktif')->orderBy('id')->each(function (Pelanggan $pelanggan) use (&$result): void {
            $result['checked']++;
            if ($pelanggan->harga_bulanan === null || $pelanggan->tanggal_langganan === null) {
                $result['skipped']++;

                return;
            }

            $lastBillingDate = $pelanggan->tagihan()->max('bulan_tagihan');
            $base = CarbonImmutable::parse($lastBillingDate ?: $pelanggan->tanggal_langganan);
            $billingDate = $base->addMonthNoOverflow()->startOfDay();

            if ($billingDate->isFuture()) {
                $result['skipped']++;

                return;
            }

            $tagihan = Tagihan::query()->firstOrCreate([
                'pelanggan_id' => $pelanggan->id,
                'bulan_tagihan' => $billingDate->toDateString(),
            ], [
                'jumlah_tagihan' => $pelanggan->harga_bulanan,
                'status_pembayaran' => 'belum_lunas',
                'catatan' => 'Tagihan otomatis - '.($pelanggan->paket_layanan ?: 'Paket internet'),
            ]);

            if (! $tagihan->wasRecentlyCreated) {
                $result['skipped']++;

                return;
            }

            $result['created']++;
            $this->dispatcher->dispatch(
                $pelanggan->no_telepon,
                $this->messages->billingReminder($pelanggan, $tagihan),
                "billing-created:{$tagihan->id}",
            );
            $result['queued']++;
        });

        return $result;
    }

    public function queueH3Reminders(): int
    {
        $queued = 0;
        Tagihan::query()
            ->with('pelanggan')
            ->where('status_pembayaran', 'belum_lunas')
            ->whereDate('bulan_tagihan', CarbonImmutable::today()->addDays(3))
            ->each(function (Tagihan $tagihan) use (&$queued): void {
                $dispatch = $this->dispatcher->dispatch(
                    $tagihan->pelanggan->no_telepon,
                    $this->messages->billingReminder($tagihan->pelanggan, $tagihan),
                    "billing-h3:{$tagihan->id}",
                );
                if ($dispatch->wasRecentlyCreated) {
                    $queued++;
                }
            });

        return $queued;
    }

    private function nextScheduledDate(Pelanggan $pelanggan): CarbonImmutable
    {
        $today = CarbonImmutable::today();
        $subscription = CarbonImmutable::parse($pelanggan->tanggal_langganan);
        $candidate = $today->startOfMonth()->day(min($subscription->day, $today->daysInMonth));

        if ($candidate->lessThanOrEqualTo($today)) {
            $nextMonth = $today->addMonthNoOverflow()->startOfMonth();
            $candidate = $nextMonth->day(min($subscription->day, $nextMonth->daysInMonth));
        }

        return $candidate;
    }
}

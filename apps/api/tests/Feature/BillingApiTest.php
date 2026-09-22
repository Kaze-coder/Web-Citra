<?php

namespace Tests\Feature;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Admin;
use App\Models\Pelanggan;
use App\Models\Tagihan;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class BillingApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
        CarbonImmutable::setTestNow('2026-09-22 10:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_lists_schedules_and_clamps_end_of_month_dates(): void
    {
        $this->actingAs($this->admin('operator'), 'web');
        $customer = $this->customer('2026-01-31');

        $this->fromSpa()->getJson('/api/v1/billing/schedules')
            ->assertOk()
            ->assertJsonPath('data.0.next_billing_date', '2026-09-30');
        $this->fromSpa()->getJson("/api/v1/billing/schedules/{$customer->id}")
            ->assertOk()
            ->assertJsonPath('data.days_until_billing', 8);
    }

    public function test_billing_run_is_idempotent_and_queues_one_notification(): void
    {
        Queue::fake();
        $this->actingAs($this->admin('admin'), 'web');
        $customer = $this->customer('2026-08-15');

        $this->fromSpa()->postJson('/api/v1/billing/run')
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.queued', 1);
        $this->fromSpa()->postJson('/api/v1/billing/run')
            ->assertOk()
            ->assertJsonPath('data.created', 0);

        $this->assertDatabaseCount('tagihan', 1);
        $invoice = $customer->tagihan()->firstOrFail();
        $this->assertSame('2026-09-15', $invoice->bulan_tagihan->toDateString());
        $this->assertSame('300000.00', $invoice->jumlah_tagihan);
        Queue::assertPushed(SendWhatsAppMessage::class, 1);
    }

    public function test_operator_cannot_run_billing(): void
    {
        $this->actingAs($this->admin('operator'), 'web');

        $this->fromSpa()->postJson('/api/v1/billing/run')->assertForbidden();
    }

    public function test_h3_reminders_are_queued_only_once(): void
    {
        Queue::fake();
        $this->actingAs($this->admin('admin'), 'web');
        $customer = $this->customer('2026-08-25');
        Tagihan::query()->create([
            'pelanggan_id' => $customer->id,
            'bulan_tagihan' => '2026-09-25',
            'jumlah_tagihan' => 300000,
            'status_pembayaran' => 'belum_lunas',
        ]);

        $this->fromSpa()->postJson('/api/v1/whatsapp/send-reminder-h3')
            ->assertAccepted()
            ->assertJsonPath('data.queued', 1);
        $this->fromSpa()->postJson('/api/v1/whatsapp/send-reminder-h3')
            ->assertAccepted()
            ->assertJsonPath('data.queued', 0);
        Queue::assertPushed(SendWhatsAppMessage::class, 1);
    }

    private function admin(string $role): Admin
    {
        return Admin::query()->create([
            'username' => $role,
            'email' => $role.'@example.com',
            'password' => Hash::make('password'),
            'status' => 'aktif',
            'role' => $role,
        ]);
    }

    private function customer(string $subscriptionDate): Pelanggan
    {
        return Pelanggan::query()->create([
            'nama_pelanggan' => 'Pelanggan Billing',
            'no_telepon' => '081234567890',
            'alamat' => 'Jakarta',
            'status' => 'aktif',
            'paket_layanan' => '30 Mbps',
            'harga_bulanan' => 300000,
            'tanggal_langganan' => $subscriptionDate,
        ]);
    }

    private function fromSpa(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ]);
    }
}

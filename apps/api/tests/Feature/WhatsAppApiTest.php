<?php

namespace Tests\Feature;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Admin;
use App\Models\Pelanggan;
use App\Models\Tagihan;
use App\Services\FonnteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class WhatsAppApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
    }

    public function test_admin_can_queue_general_reminder_and_confirmation_messages(): void
    {
        Queue::fake();
        $this->actingAs($this->admin('admin'), 'web');
        $customer = $this->customer();
        $invoice = Tagihan::query()->create([
            'pelanggan_id' => $customer->id,
            'bulan_tagihan' => '2026-09-01',
            'jumlah_tagihan' => 275000,
            'status_pembayaran' => 'lunas',
            'tanggal_pembayaran' => '2026-09-10',
        ]);

        $this->fromSpa()->postJson('/api/v1/whatsapp/send', [
            'phone' => '0812-3456-7890',
            'message' => 'Pesan uji',
        ])->assertAccepted();
        $this->fromSpa()->postJson('/api/v1/whatsapp/send-reminder', [
            'tagihan_id' => $invoice->id,
        ])->assertAccepted();
        $this->fromSpa()->postJson('/api/v1/whatsapp/send-confirmation', [
            'tagihan_id' => $invoice->id,
        ])->assertAccepted();

        Queue::assertPushed(SendWhatsAppMessage::class, 3);
        $this->assertDatabaseHas('notification_dispatches', [
            'dedupe_key' => hash('sha256', "payment-confirmation:{$invoice->id}"),
        ]);
        $this->assertDatabaseHas('notification_dispatches', ['status' => 'queued']);

        $this->fromSpa()->postJson('/api/v1/whatsapp/send-confirmation', [
            'tagihan_id' => $invoice->id,
        ])->assertAccepted();
        Queue::assertPushed(SendWhatsAppMessage::class, 3);
    }

    public function test_operator_cannot_queue_messages(): void
    {
        Queue::fake();
        $this->actingAs($this->admin('operator'), 'web');

        $this->fromSpa()->postJson('/api/v1/whatsapp/send', [
            'phone' => '081234567890',
            'message' => 'Tidak boleh terkirim',
        ])->assertForbidden();
        Queue::assertNothingPushed();
    }

    public function test_fonnte_service_formats_indonesian_phone_and_authenticates(): void
    {
        config(['services.fonnte.token' => 'test-token']);
        Http::fake(['*/send' => Http::response(['status' => true])]);

        $response = app(FonnteService::class)->send('0812-3456-7890', 'Halo');

        $this->assertTrue($response['status']);
        Http::assertSent(fn ($request): bool => $request['target'] === '6281234567890'
            && $request->hasHeader('Authorization', 'test-token')
        );
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

    private function customer(): Pelanggan
    {
        return Pelanggan::query()->create([
            'nama_pelanggan' => 'Pelanggan WhatsApp',
            'no_telepon' => '081234567890',
            'alamat' => 'Jakarta',
            'status' => 'aktif',
            'paket_layanan' => '30 Mbps',
            'harga_bulanan' => 275000,
            'tanggal_langganan' => '2026-08-01',
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

<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Pelanggan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class MappingApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
        config([
            'services.earth_engine.url' => 'http://earth-engine.internal:5000',
            'services.earth_engine.token' => 'internal-secret',
        ]);
    }

    public function test_kml_download_escapes_customer_data_and_includes_coordinates(): void
    {
        $this->actingAs($this->admin('operator'), 'web');
        $customer = $this->customer('A & B <ISP>');
        $customer->lokasi()->create([
            'latitude' => -6.2,
            'longitude' => 106.8,
            'keterangan_lokasi' => 'Lokasi',
        ]);

        $response = $this->fromSpa()->get("/api/v1/maps/customers/{$customer->id}.kml");

        $response->assertOk()->assertHeader('Content-Type', 'application/vnd.google-earth.kml+xml; charset=UTF-8');
        $this->assertStringContainsString('A &amp; B &lt;ISP&gt;', $response->getContent());
        $this->assertStringContainsString('106.80000000,-6.20000000,0', $response->getContent());
    }

    public function test_laravel_proxies_earth_engine_with_internal_token(): void
    {
        $this->actingAs($this->admin('operator'), 'web');
        Http::fake([
            '*/v1/status' => Http::response(['data' => ['initialized' => true]]),
            '*/v1/tiles' => Http::response(['data' => [[
                'name' => 'Sentinel-2 Satelit',
                'url' => 'https://tiles.example/{z}/{x}/{y}',
                'attribution' => 'Copernicus',
            ]]]),
        ]);

        $this->fromSpa()->getJson('/api/v1/earth-engine/status')
            ->assertOk()->assertJsonPath('data.initialized', true);
        $this->fromSpa()->getJson('/api/v1/earth-engine/tiles')
            ->assertOk()->assertJsonPath('data.0.name', 'Sentinel-2 Satelit');
        Http::assertSent(fn ($request): bool => $request->hasHeader('X-Internal-Token', 'internal-secret'));
    }

    public function test_operator_cannot_clear_earth_engine_cache(): void
    {
        $this->actingAs($this->admin('operator'), 'web');
        $this->fromSpa()->deleteJson('/api/v1/earth-engine/cache')->assertForbidden();
    }

    public function test_manager_can_clear_earth_engine_cache(): void
    {
        Http::fake(['*/v1/cache' => Http::response(['data' => null])]);

        $this->actingAs($this->admin('admin'), 'web');
        $this->fromSpa()->deleteJson('/api/v1/earth-engine/cache')->assertOk();
    }

    public function test_unavailable_earth_engine_uses_external_service_error_envelope(): void
    {
        $this->actingAs($this->admin('operator'), 'web');
        Http::fake(['*' => Http::response([], 503)]);

        $this->fromSpa()->getJson('/api/v1/earth-engine/tiles')
            ->assertStatus(502)
            ->assertJsonPath('message', 'Layanan eksternal sedang tidak tersedia.');
    }

    private function admin(string $role): Admin
    {
        $suffix = Admin::query()->count();

        return Admin::query()->create([
            'username' => $role.$suffix,
            'email' => $role.$suffix.'@example.com',
            'password' => Hash::make('password'),
            'status' => 'aktif',
            'role' => $role,
        ]);
    }

    private function customer(string $name): Pelanggan
    {
        return Pelanggan::query()->create([
            'nama_pelanggan' => $name,
            'no_telepon' => '081234567890',
            'alamat' => 'Jl. Peta & Lokasi',
            'status' => 'aktif',
            'tanggal_langganan' => '2026-09-01',
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

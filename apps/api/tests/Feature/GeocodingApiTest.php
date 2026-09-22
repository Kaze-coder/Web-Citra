<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Pelanggan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class GeocodingApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
        $this->actingAs(Admin::query()->create([
            'username' => 'geocoder',
            'email' => 'geocoder@example.com',
            'password' => Hash::make('password'),
            'status' => 'aktif',
            'role' => 'admin',
        ]), 'web');
    }

    public function test_geocodes_and_reverse_geocodes_through_nominatim(): void
    {
        Http::fake([
            '*/search*' => Http::response([[
                'lat' => '-6.200000',
                'lon' => '106.816666',
                'display_name' => 'Jakarta, Indonesia',
                'place_id' => 123,
            ]]),
            '*/reverse*' => Http::response(['display_name' => 'Jakarta, Indonesia']),
        ]);

        $this->fromSpa()->postJson('/api/v1/geocoding/geocode', ['address' => 'Jakarta'])
            ->assertOk()
            ->assertJsonPath('data.latitude', -6.2)
            ->assertJsonPath('data.place_id', 123);
        $this->fromSpa()->postJson('/api/v1/geocoding/reverse', [
            'latitude' => -6.2,
            'longitude' => 106.816666,
        ])->assertOk()->assertJsonPath('data.address', 'Jakarta, Indonesia');

        Http::assertSent(fn ($request): bool => $request->hasHeader('User-Agent'));
    }

    public function test_customer_auto_geocode_is_best_effort(): void
    {
        Http::fake(['*' => Http::response([], 503)]);

        $this->fromSpa()->postJson('/api/v1/pelanggan', [
            'nama_pelanggan' => 'Tetap Tersimpan',
            'no_telepon' => '081234567899',
            'alamat' => 'Alamat tidak tersedia',
        ])->assertCreated()->assertJsonPath('data.latitude', null);

        $this->assertDatabaseHas('pelanggan', ['nama_pelanggan' => 'Tetap Tersimpan']);
    }

    public function test_batch_geocodes_customers_without_locations(): void
    {
        Http::fake(['*' => Http::response([[
            'lat' => '-6.2',
            'lon' => '106.8',
            'display_name' => 'Lokasi hasil geocode',
        ]])]);
        $customer = Pelanggan::query()->create([
            'nama_pelanggan' => 'Butuh Lokasi',
            'no_telepon' => '081234567898',
            'alamat' => 'Jakarta',
            'status' => 'aktif',
            'tanggal_langganan' => '2026-09-01',
        ]);

        $this->fromSpa()->postJson('/api/v1/pelanggan/geocode/auto-all')
            ->assertOk()
            ->assertJsonPath('data.success', 1);
        $this->assertDatabaseHas('lokasi', ['pelanggan_id' => $customer->id]);
    }

    public function test_upstream_failure_uses_api_error_envelope(): void
    {
        Http::fake(['*' => Http::response([], 503)]);

        $this->fromSpa()->postJson('/api/v1/geocoding/geocode', ['address' => 'Jakarta'])
            ->assertStatus(502)
            ->assertJsonPath('message', 'Layanan eksternal sedang tidak tersedia.');
    }

    private function fromSpa(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Lokasi;
use App\Models\Pelanggan;
use App\Models\Perangkat;
use App\Models\Tagihan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class ModelAndPolicyTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
    }

    public function test_legacy_models_map_casts_and_relationships(): void
    {
        $pelanggan = Pelanggan::query()->create([
            'nama_pelanggan' => 'Pelanggan Test',
            'no_telepon' => '081234567890',
            'alamat' => 'Jl. Test No. 1',
            'status' => 'aktif',
            'paket_layanan' => '50 Mbps',
            'harga_bulanan' => 500000,
            'tanggal_langganan' => '2026-09-01',
        ]);

        Lokasi::query()->create([
            'pelanggan_id' => $pelanggan->id,
            'latitude' => -6.20000000,
            'longitude' => 106.81666600,
        ]);
        Perangkat::query()->create([
            'pelanggan_id' => $pelanggan->id,
            'nama_perangkat' => 'Router Test',
            'tipe_perangkat' => 'router',
        ]);
        Tagihan::query()->create([
            'pelanggan_id' => $pelanggan->id,
            'bulan_tagihan' => '2026-09-01',
            'jumlah_tagihan' => 500000,
        ]);

        $pelanggan->refresh()->load(['lokasi', 'perangkat', 'tagihan']);

        $this->assertSame('500000.00', $pelanggan->harga_bulanan);
        $this->assertSame('106.81666600', $pelanggan->lokasi->longitude);
        $this->assertCount(1, $pelanggan->perangkat);
        $this->assertSame('500000.00', $pelanggan->tagihan->first()->jumlah_tagihan);
        $this->assertTrue($pelanggan->tanggal_langganan->isSameDay('2026-09-01'));
    }

    public function test_role_policies_match_the_approved_access_rules(): void
    {
        $operator = $this->createAdmin('operator', 'operator');
        $admin = $this->createAdmin('admin', 'admin');
        $superAdmin = $this->createAdmin('super', 'super_admin');

        $this->assertTrue(Gate::forUser($operator)->allows('viewAny', Pelanggan::class));
        $this->assertFalse(Gate::forUser($operator)->allows('create', Pelanggan::class));
        $this->assertTrue(Gate::forUser($admin)->allows('create', Pelanggan::class));
        $this->assertTrue(Gate::forUser($admin)->allows('run-billing'));
        $this->assertTrue(Gate::forUser($superAdmin)->allows('create', Admin::class));
        $this->assertFalse(Gate::forUser($admin)->allows('create', Admin::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('delete', $superAdmin));
    }

    private function createAdmin(string $username, string $role): Admin
    {
        return Admin::query()->create([
            'username' => $username,
            'email' => $username.'@example.com',
            'password' => Hash::make('password'),
            'status' => 'aktif',
            'role' => $role,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Pelanggan;
use App\Models\Perangkat;
use App\Models\Tagihan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class DomainApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
        $this->actingAs($this->createAdmin('admin'), 'web');
    }

    public function test_pelanggan_crud_search_statistics_coordinates_and_cascade_delete(): void
    {
        $create = $this->fromSpa()->postJson('/api/v1/pelanggan', [
            'nama_pelanggan' => 'Citra Pelanggan',
            'no_telepon' => '0812-3456-7890',
            'email' => 'citra@example.com',
            'alamat' => 'Jl. Merdeka No. 1',
            'paket_layanan' => '50 Mbps',
            'harga_bulanan' => 500000,
            'tanggal_langganan' => '2026-09-01',
            'latitude' => -6.20000000,
            'longitude' => 106.81666600,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.no_telepon', '081234567890')
            ->assertJsonPath('data.latitude', '-6.20000000');
        $pelangganId = $create->json('data.id');

        $this->fromSpa()->getJson('/api/v1/pelanggan?search=Citra&limit=5')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.pagination.total', 1);

        $this->fromSpa()->patchJson("/api/v1/pelanggan/{$pelangganId}", [
            'status' => 'suspend',
            'harga_bulanan' => 550000,
        ])->assertOk()->assertJsonPath('data.status', 'suspend');

        $this->fromSpa()->getJson('/api/v1/maps/customers')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->fromSpa()->getJson('/api/v1/pelanggan/statistik')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.aktif', 0);

        Perangkat::query()->create([
            'pelanggan_id' => $pelangganId,
            'nama_perangkat' => 'Router Cascade',
        ]);
        Tagihan::query()->create([
            'pelanggan_id' => $pelangganId,
            'bulan_tagihan' => '2026-09-01',
            'jumlah_tagihan' => 550000,
        ]);

        $this->fromSpa()->deleteJson("/api/v1/pelanggan/{$pelangganId}")->assertOk();
        $this->assertDatabaseMissing('pelanggan', ['id' => $pelangganId]);
        $this->assertDatabaseMissing('perangkat', ['pelanggan_id' => $pelangganId]);
        $this->assertDatabaseMissing('tagihan', ['pelanggan_id' => $pelangganId]);
        $this->assertDatabaseMissing('lokasi', ['pelanggan_id' => $pelangganId]);
    }

    public function test_perangkat_crud_and_customer_lookup(): void
    {
        $pelanggan = $this->createPelanggan();

        $create = $this->fromSpa()->postJson('/api/v1/perangkat', [
            'pelanggan_id' => $pelanggan->id,
            'nama_perangkat' => 'Mikrotik Utama',
            'tipe_perangkat' => 'mikrotik',
            'ip_address' => '192.168.1.1',
        ])->assertCreated()->assertJsonPath('data.nama_pelanggan', $pelanggan->nama_pelanggan);

        $perangkatId = $create->json('data.id');
        $this->fromSpa()->getJson("/api/v1/perangkat/pelanggan/{$pelanggan->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->fromSpa()->patchJson("/api/v1/perangkat/{$perangkatId}", [
            'status_perangkat' => 'error',
        ])->assertOk()->assertJsonPath('data.status_perangkat', 'error');
        $this->fromSpa()->deleteJson("/api/v1/perangkat/{$perangkatId}")->assertOk();
        $this->assertDatabaseMissing('perangkat', ['id' => $perangkatId]);
    }

    public function test_tagihan_crud_filters_statistics_outstanding_and_monthly_uniqueness(): void
    {
        $pelanggan = $this->createPelanggan();
        $payload = [
            'pelanggan_id' => $pelanggan->id,
            'bulan_tagihan' => '2026-09-01',
            'jumlah_tagihan' => 500000,
        ];

        $create = $this->fromSpa()->postJson('/api/v1/tagihan', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status_pembayaran', 'belum_lunas');
        $tagihanId = $create->json('data.id');

        $this->fromSpa()->postJson('/api/v1/tagihan', $payload)
            ->assertUnprocessable()
            ->assertJsonStructure(['meta' => ['errors' => ['bulan_tagihan']]]);

        $this->fromSpa()->getJson('/api/v1/tagihan/belum-bayar')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->fromSpa()->getJson("/api/v1/tagihan/pelanggan/{$pelanggan->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->fromSpa()->patchJson("/api/v1/tagihan/{$tagihanId}", [
            'status_pembayaran' => 'lunas',
            'tanggal_pembayaran' => '2026-09-10',
            'metode_pembayaran' => 'transfer',
        ])->assertOk()->assertJsonPath('data.status_pembayaran', 'lunas');

        $this->fromSpa()->getJson('/api/v1/tagihan?status=lunas')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->fromSpa()->getJson('/api/v1/tagihan/statistik')
            ->assertOk()
            ->assertJsonPath('data.lunas', 1)
            ->assertJsonPath('data.totalPemasukan', '500000');

        $this->fromSpa()->deleteJson("/api/v1/tagihan/{$tagihanId}")->assertOk();
    }

    public function test_lokasi_crud_enforces_one_location_per_customer(): void
    {
        $pelanggan = $this->createPelanggan();
        $payload = [
            'pelanggan_id' => $pelanggan->id,
            'latitude' => -6.2,
            'longitude' => 106.8,
            'keterangan_lokasi' => 'Tiang depan rumah',
        ];

        $create = $this->fromSpa()->postJson('/api/v1/lokasi', $payload)->assertCreated();
        $lokasiId = $create->json('data.id');

        $this->fromSpa()->postJson('/api/v1/lokasi', $payload)->assertUnprocessable();
        $this->fromSpa()->getJson("/api/v1/lokasi/pelanggan/{$pelanggan->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $lokasiId);
        $this->fromSpa()->patchJson("/api/v1/lokasi/{$lokasiId}", [
            'latitude' => -6.3,
            'longitude' => 106.9,
        ])->assertOk()->assertJsonPath('data.latitude', '-6.30000000');
        $this->fromSpa()->deleteJson("/api/v1/lokasi/{$lokasiId}")->assertOk();
    }

    public function test_operator_can_read_but_cannot_write_domain_data(): void
    {
        $operator = $this->createAdmin('operator');
        $this->actingAs($operator, 'web');

        $this->fromSpa()->getJson('/api/v1/pelanggan')->assertOk();
        $this->fromSpa()->postJson('/api/v1/pelanggan', [
            'nama_pelanggan' => 'Ditolak',
            'no_telepon' => '081234567891',
            'alamat' => 'Alamat ditolak',
        ])->assertForbidden()->assertJsonPath('message', 'Anda tidak memiliki izin untuk tindakan ini.');
    }

    public function test_missing_domain_model_uses_the_api_error_envelope(): void
    {
        $this->fromSpa()->getJson('/api/v1/pelanggan/999999')
            ->assertNotFound()
            ->assertJsonPath('data', null)
            ->assertJsonPath('message', 'Data tidak ditemukan.')
            ->assertJsonStructure(['meta' => ['request_id']]);
    }

    private function createAdmin(string $role): Admin
    {
        $suffix = Admin::query()->count() + 1;

        return Admin::query()->create([
            'username' => $role.$suffix,
            'email' => $role.$suffix.'@example.com',
            'password' => Hash::make('password'),
            'status' => 'aktif',
            'role' => $role,
        ]);
    }

    private function createPelanggan(): Pelanggan
    {
        return Pelanggan::query()->create([
            'nama_pelanggan' => 'Pelanggan Domain',
            'no_telepon' => '081234567890',
            'alamat' => 'Jl. Domain No. 1',
            'status' => 'aktif',
            'paket_layanan' => '50 Mbps',
            'harga_bulanan' => 500000,
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

<?php

namespace Tests\Feature;

use App\Jobs\GeocodeCustomer;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class CustomerImportApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
    }

    public function test_admin_imports_valid_rows_and_receives_row_level_errors(): void
    {
        Queue::fake();
        $this->actingAs($this->admin('admin'), 'web');
        $csv = implode("\n", [
            'nama_pelanggan,no_telepon,email,alamat,paket_layanan,harga_bulanan,tanggal_langganan',
            'Pelanggan Valid,081234567890,valid@example.com,Jakarta,30 Mbps,300000,2026-09-01',
            'Email Buruk,081234567891,bukan-email,Bandung,20 Mbps,200000,2026-09-01',
            'Telepon Sama,081234567890,duplicate@example.com,Bogor,10 Mbps,100000,2026-09-01',
        ]);

        $this->fromSpa()->post('/api/v1/pelanggan/import', [
            'file' => UploadedFile::fake()->createWithContent('pelanggan.csv', $csv),
        ])->assertOk()
            ->assertJsonPath('data.imported', 1)
            ->assertJsonPath('data.skipped', 2)
            ->assertJsonCount(2, 'data.errors');

        $this->assertDatabaseHas('pelanggan', ['nama_pelanggan' => 'Pelanggan Valid']);
        Queue::assertPushed(GeocodeCustomer::class, 1);
    }

    public function test_import_requires_expected_headers(): void
    {
        $file = UploadedFile::fake()->createWithContent('pelanggan.csv', "nama,email\nTanpa Kolom,x@example.com");
        $this->actingAs($this->admin('admin'), 'web');
        $this->fromSpa()->post('/api/v1/pelanggan/import', ['file' => $file])
            ->assertUnprocessable();

    }

    public function test_operator_cannot_import_customers(): void
    {
        $this->actingAs($this->admin('operator'), 'web');

        $this->fromSpa()->postJson('/api/v1/pelanggan/import')->assertForbidden();
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

    private function fromSpa(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ]);
    }
}

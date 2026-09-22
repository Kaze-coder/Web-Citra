<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
    }

    public function test_active_admin_can_login_read_session_and_logout(): void
    {
        $admin = $this->createAdmin();

        $login = $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => $admin->username,
            'password' => 'admin123',
        ]);

        $login
            ->assertOk()
            ->assertJsonPath('data.user.id', $admin->id)
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonMissingPath('data.user.password');
        $this->assertAuthenticatedAs($admin);
        $this->assertNotNull($admin->fresh()->tanggal_login_terakhir);

        $this->fromSpa()->getJson('/api/v1/auth/user')
            ->assertOk()
            ->assertJsonPath('data.user.username', $admin->username);

        $this->fromSpa()->postJson('/api/v1/auth/logout')->assertOk();
        $this->fromSpa()->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials_without_revealing_the_username(): void
    {
        $this->createAdmin();

        $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ])->assertUnauthorized()->assertJsonPath('message', 'Username atau password salah.');

        $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => 'missing',
            'password' => 'wrong-password',
        ])->assertUnauthorized()->assertJsonPath('message', 'Username atau password salah.');
    }

    public function test_inactive_admin_cannot_login(): void
    {
        $admin = $this->createAdmin(status: 'nonaktif');

        $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => $admin->username,
            'password' => 'admin123',
        ])->assertForbidden();
    }

    public function test_login_accepts_the_existing_bcryptjs_password_hash(): void
    {
        Admin::query()->create([
            'username' => 'legacy-admin',
            'email' => 'legacy@example.com',
            'password' => '$2a$10$fqqO315SSgyp/erHwdgS4eu9GPZrJitaiSXPV0AsVNrk9dSPgCiWi',
            'status' => 'aktif',
            'role' => 'super_admin',
        ]);

        $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => 'legacy-admin',
            'password' => 'admin123',
        ])->assertOk()->assertJsonPath('data.user.role', 'super_admin');

        $rehash = Admin::query()->where('username', 'legacy-admin')->value('password');
        $this->assertStringStartsWith('$2y$', $rehash);
        $this->assertTrue(Hash::check('admin123', $rehash));
    }

    public function test_login_rejects_non_stateful_requests_without_throwing(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ])->assertBadRequest()->assertJsonPath('message', 'Permintaan autentikasi tidak valid.');
    }

    public function test_existing_session_is_rejected_after_admin_is_deactivated(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'web');
        $admin->update(['status' => 'nonaktif']);

        $this->fromSpa()->getJson('/api/v1/auth/user')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun tidak aktif. Hubungi administrator.');
    }

    public function test_auth_endpoints_require_a_session_and_public_registration_is_absent(): void
    {
        $this->fromSpa()->getJson('/api/v1/auth/user')
            ->assertUnauthorized()
            ->assertJsonPath('data', null)
            ->assertJsonPath('message', 'Sesi tidak valid atau telah berakhir.')
            ->assertJsonStructure(['meta' => ['request_id']]);
        $this->fromSpa()->postJson('/api/v1/auth/logout')->assertUnauthorized();
        $this->postJson('/api/v1/auth/register')->assertNotFound();
    }

    public function test_login_validation_uses_the_api_error_envelope(): void
    {
        $this->fromSpa()->postJson('/api/v1/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonPath('data', null)
            ->assertJsonPath('message', 'Data tidak valid.')
            ->assertJsonStructure([
                'meta' => [
                    'errors' => ['username', 'password'],
                    'request_id',
                ],
            ]);
    }

    public function test_login_is_rate_limited_by_username_and_ip(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->fromSpa()->postJson('/api/v1/auth/login', [
                'username' => 'rate-limited-user',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->fromSpa()->postJson('/api/v1/auth/login', [
            'username' => 'rate-limited-user',
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }

    private function createAdmin(string $status = 'aktif'): Admin
    {
        return Admin::query()->create([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'nama_lengkap' => 'Admin Test',
            'status' => $status,
            'role' => 'admin',
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

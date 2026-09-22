<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\BuildsLegacySchema;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use BuildsLegacySchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createLegacySchema();
    }

    public function test_super_admin_can_manage_administrators_without_exposing_passwords(): void
    {
        $superAdmin = $this->admin('root', 'super_admin');
        $this->actingAs($superAdmin, 'web');

        $create = $this->fromSpa()->postJson('/api/v1/admins', [
            'username' => 'operator-baru',
            'email' => 'operator-baru@example.com',
            'password' => 'password-baru',
            'password_confirmation' => 'password-baru',
            'nama_lengkap' => 'Operator Baru',
            'role' => 'operator',
        ])->assertCreated()->assertJsonMissingPath('data.password');
        $adminId = $create->json('data.id');

        $this->fromSpa()->getJson('/api/v1/admins')
            ->assertOk()
            ->assertJsonMissingPath('data.0.password');
        $this->fromSpa()->patchJson("/api/v1/admins/{$adminId}", [
            'status' => 'nonaktif',
        ])->assertOk()->assertJsonPath('data.status', 'nonaktif');
        $this->fromSpa()->deleteJson("/api/v1/admins/{$adminId}")->assertOk();
    }

    public function test_regular_admin_cannot_manage_administrators(): void
    {
        $this->actingAs($this->admin('regular', 'admin'), 'web');

        $this->fromSpa()->getJson('/api/v1/admins')->assertForbidden();
    }

    public function test_super_admin_cannot_demote_or_delete_self(): void
    {
        $superAdmin = $this->admin('root', 'super_admin');
        $this->actingAs($superAdmin, 'web');

        $this->fromSpa()->patchJson("/api/v1/admins/{$superAdmin->id}", [
            'role' => 'operator',
        ])->assertUnprocessable();

        $other = $this->admin('other-root', 'super_admin');
        $this->fromSpa()->deleteJson("/api/v1/admins/{$superAdmin->id}")->assertForbidden();
        $this->fromSpa()->deleteJson("/api/v1/admins/{$other->id}")->assertOk();
    }

    private function admin(string $username, string $role): Admin
    {
        return Admin::query()->create([
            'username' => $username,
            'email' => $username.'@example.com',
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

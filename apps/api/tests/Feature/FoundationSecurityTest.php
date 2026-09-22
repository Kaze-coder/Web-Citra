<?php

namespace Tests\Feature;

use App\Models\Admin;
use Tests\TestCase;

class FoundationSecurityTest extends TestCase
{
    public function test_sanctum_csrf_cookie_is_available_to_the_spa(): void
    {
        $response = $this
            ->withHeaders([
                'Origin' => 'http://localhost:3000',
                'Referer' => 'http://localhost:3000/',
            ])
            ->get('/sanctum/csrf-cookie');

        $response
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN');
    }

    public function test_auth_provider_uses_the_existing_admin_model(): void
    {
        $this->assertSame(Admin::class, config('auth.providers.admins.model'));
        $this->assertSame('admins', config('auth.guards.web.provider'));
    }
}

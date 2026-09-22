<?php

namespace App\Providers;

use App\Models\Admin;
use App\Models\Lokasi;
use App\Models\Pelanggan;
use App\Models\Perangkat;
use App\Models\Tagihan;
use App\Policies\AdminPolicy;
use App\Policies\OperasionalPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Admin::class, AdminPolicy::class);
        Gate::policy(Pelanggan::class, OperasionalPolicy::class);
        Gate::policy(Perangkat::class, OperasionalPolicy::class);
        Gate::policy(Tagihan::class, OperasionalPolicy::class);
        Gate::policy(Lokasi::class, OperasionalPolicy::class);

        Gate::define('run-billing', fn (Admin $admin): bool => $admin->isActive() && $admin->canManageOperations());
        Gate::define('send-whatsapp', fn (Admin $admin): bool => $admin->isActive() && $admin->canManageOperations());

        RateLimiter::for('login', function (Request $request): Limit {
            $username = Str::lower((string) $request->input('username'));

            return Limit::perMinute(5)->by($username.'|'.$request->ip());
        });
    }
}

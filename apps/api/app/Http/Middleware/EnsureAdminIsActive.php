<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->user();

        if ($admin instanceof Admin && ! $admin->isActive()) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            Auth::forgetGuards();

            return new JsonResponse([
                'data' => null,
                'message' => 'Akun tidak aktif. Hubungi administrator.',
                'meta' => ['request_id' => $request->header('X-Request-ID')],
            ], 403);
        }

        return $next($request);
    }
}

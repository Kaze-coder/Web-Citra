<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (! $request->hasSession()) {
            return response()->json([
                'data' => null,
                'message' => 'Permintaan autentikasi tidak valid.',
                'meta' => [],
            ], 400);
        }

        $credentials = $request->validated();
        $admin = Admin::query()->where('username', $credentials['username'])->first();

        if (! $admin || ! Hash::check($credentials['password'], $admin->password)) {
            return response()->json([
                'data' => null,
                'message' => 'Username atau password salah.',
                'meta' => [],
            ], 401);
        }

        if (! $admin->isActive()) {
            return response()->json([
                'data' => null,
                'message' => 'Akun tidak aktif. Hubungi administrator.',
                'meta' => [],
            ], 403);
        }

        Auth::guard('web')->login($admin);
        $request->session()->regenerate();

        if (Hash::needsRehash($admin->password)) {
            $admin->password = Hash::make($credentials['password']);
        }

        $admin->tanggal_login_terakhir = now();
        $admin->save();

        return response()->json([
            'data' => ['user' => $this->userData($admin)],
            'message' => 'Login berhasil.',
            'meta' => [],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return response()->json([
            'data' => null,
            'message' => 'Logout berhasil.',
            'meta' => [],
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return response()->json([
            'data' => ['user' => $this->userData($admin)],
            'message' => 'Pengguna aktif.',
            'meta' => [],
        ]);
    }

    private function userData(Admin $admin): array
    {
        return [
            'id' => $admin->id,
            'username' => $admin->username,
            'email' => $admin->email,
            'nama_lengkap' => $admin->nama_lengkap,
            'role' => $admin->role,
        ];
    }
}

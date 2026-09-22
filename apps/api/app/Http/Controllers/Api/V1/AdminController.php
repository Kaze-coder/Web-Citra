<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Admin::class);
        $paginator = Admin::query()
            ->latest('id')
            ->paginate(min(max($request->integer('limit', 10), 1), 100));

        return $this->success($paginator->items(), 'Data administrator berhasil diambil.', [
            'pagination' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'pages' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Admin $admin): JsonResponse
    {
        $this->authorize('view', $admin);

        return $this->success($admin, 'Data administrator berhasil diambil.');
    }

    public function store(AdminRequest $request): JsonResponse
    {
        $this->authorize('create', Admin::class);
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $data['status'] ??= 'aktif';

        return $this->success(Admin::query()->create($data), 'Administrator berhasil ditambahkan.', status: 201);
    }

    public function update(AdminRequest $request, Admin $admin): JsonResponse
    {
        $this->authorize('update', $admin);
        $data = $request->validated();

        if ($request->user()->is($admin)) {
            $demotesSelf = isset($data['role']) && $data['role'] !== 'super_admin';
            $deactivatesSelf = isset($data['status']) && $data['status'] !== 'aktif';
            if ($demotesSelf || $deactivatesSelf) {
                throw ValidationException::withMessages([
                    'status' => ['Akun sendiri tidak dapat didemote atau dinonaktifkan.'],
                ]);
            }
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }
        $admin->update($data);

        return $this->success($admin->refresh(), 'Administrator berhasil diperbarui.');
    }

    public function destroy(Admin $admin): JsonResponse
    {
        $this->authorize('delete', $admin);
        if ($admin->isSuperAdmin() && $admin->isActive() && Admin::query()
            ->where('role', 'super_admin')->where('status', 'aktif')->count() <= 1) {
            throw ValidationException::withMessages([
                'admin' => ['Super administrator aktif terakhir tidak dapat dihapus.'],
            ]);
        }

        $admin->delete();

        return $this->success(null, 'Administrator berhasil dihapus.');
    }
}

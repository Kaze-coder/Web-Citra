<?php

namespace App\Policies;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Model;

class OperasionalPolicy
{
    public function viewAny(Admin $admin): bool
    {
        return $admin->isActive();
    }

    public function view(Admin $admin, Model $model): bool
    {
        return $admin->isActive();
    }

    public function create(Admin $admin): bool
    {
        return $admin->isActive() && $admin->canManageOperations();
    }

    public function update(Admin $admin, Model $model): bool
    {
        return $admin->isActive() && $admin->canManageOperations();
    }

    public function delete(Admin $admin, Model $model): bool
    {
        return $admin->isActive() && $admin->canManageOperations();
    }
}

<?php

namespace App\Policies;

use App\Models\Admin;

class AdminPolicy
{
    public function viewAny(Admin $admin): bool
    {
        return $admin->isActive() && $admin->isSuperAdmin();
    }

    public function view(Admin $admin, Admin $target): bool
    {
        return $admin->isActive() && $admin->isSuperAdmin();
    }

    public function create(Admin $admin): bool
    {
        return $admin->isActive() && $admin->isSuperAdmin();
    }

    public function update(Admin $admin, Admin $target): bool
    {
        return $admin->isActive() && $admin->isSuperAdmin();
    }

    public function delete(Admin $admin, Admin $target): bool
    {
        return $admin->isActive() && $admin->isSuperAdmin() && ! $admin->is($target);
    }
}

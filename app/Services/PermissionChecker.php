<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\AdminPermission;
use Illuminate\Support\Facades\Cache;

class PermissionChecker
{
    /**
     * Check if an admin has a specific permission.
     * Super admins always pass. Results cached per session.
     */
    public static function can(Admin $admin, string $permissionKey): bool
    {
        // Super admin always has all permissions
        if ($admin->role === 'super_admin') {
            return true;
        }

        // No role assigned
        if (!$admin->role_id) {
            return false;
        }

        $cacheKey = "admin_perms_{$admin->id}";

        $permissions = Cache::remember($cacheKey, 300, function () use ($admin) {
            $admin->load('adminRole.permissions');
            return $admin->adminRole?->permissions?->pluck('key')->toArray() ?? [];
        });

        return in_array($permissionKey, $permissions, true);
    }

    /**
     * Clear cached permissions for an admin (call after role change).
     */
    public static function clearCache(int $adminId): void
    {
        Cache::forget("admin_perms_{$adminId}");
    }
}

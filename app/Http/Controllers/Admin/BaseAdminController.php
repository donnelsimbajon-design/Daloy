<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminLog;
use Illuminate\Http\Request;

abstract class BaseAdminController extends Controller
{
    /**
     * Check if the current admin has a specific permission.
     * Super admins bypass all checks.
     */
    protected function authorizeAdmin(Request $request, string $permissionKey): void
    {
        $admin = $request->user()?->admin;
        if (!$admin || !$admin->can($permissionKey)) {
            abort(403, 'Unauthorized access to this administrative module.');
        }
    }

    /**
     * Log an admin action for the audit trail.
     */
    protected function logAction(Request $request, string $action, array $metadata = []): void
    {
        $admin = $request->user()?->admin;
        if (!$admin) return;

        AdminLog::create([
            'admin_id'   => $admin->id,
            'action'     => $action,
            'ip_address' => $request->ip(),
            'metadata'   => $metadata,
        ]);
    }
}

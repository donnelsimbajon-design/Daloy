<?php

namespace App\Http\Controllers\Moderator;

use App\Http\Controllers\Controller;
use App\Models\AdminLog;
use Illuminate\Http\Request;

abstract class BaseModeratorController extends Controller
{
    /**
     * Log an action for the audit trail.
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

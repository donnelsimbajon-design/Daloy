<?php

namespace App\Http\Controllers\Admin;

use App\Models\Admin;
use App\Models\AdminLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogController extends BaseAdminController
{
    public function __invoke(Request $request)
    {
        $this->authorizeAdmin($request, 'logs');

        $query = AdminLog::with('admin.user');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('admin.user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($admin = $request->input('admin_filter')) {
            $query->where('admin_id', $admin);
        }

        $logs = $query->latest()->paginate(20)->through(fn($l) => [
            'id' => $l->id,
            'admin' => $l->admin?->user?->name ?? 'System',
            'admin_id' => 'ADM-' . str_pad($l->admin_id, 3, '0', STR_PAD_LEFT),
            'action' => $l->action,
            'target' => $l->metadata['target'] ?? '—',
            'timestamp' => $l->created_at->format('Y-m-d H:i:s'),
            'ip' => $l->ip_address ?? '—',
        ]);

        $admins = Admin::with('user')->get()->map(fn($a) => [
            'id' => $a->id,
            'name' => $a->user->name,
        ]);

        return Inertia::render('Admin/Logs', [
            'logs' => $logs,
            'admins' => $admins,
            'filters' => $request->only(['search', 'admin_filter']),
        ]);
    }
}

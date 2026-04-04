<?php

namespace App\Http\Controllers\Admin;

use App\Models\AdminLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'settings');

        $settings = SystemSetting::all()->pluck('value', 'key')->toArray();

        $changeLog = AdminLog::with('admin.user')
            ->where('action', 'like', '%Setting%')
            ->orWhere('action', 'like', '%Toggle%')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($l) => [
                'admin' => $l->admin?->user?->name ?? 'System',
                'change' => $l->action,
                'time' => $l->created_at->diffForHumans(),
            ]);

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
            'changeLog' => $changeLog,
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdmin($request, 'settings');

        $request->validate([
            'settings' => 'required|array',
        ]);

        $admin = $request->user()->admin;

        foreach ($request->settings as $key => $value) {
            SystemSetting::set($key, is_bool($value) ? ($value ? '1' : '0') : (string)$value, $admin->id);
        }

        $this->logAction($request, 'Settings Updated', [
            'changes' => array_keys($request->settings),
        ]);

        return back()->with('success', 'Settings saved.');
    }
}

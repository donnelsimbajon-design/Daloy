<?php

namespace App\Http\Controllers\Moderator;

use App\Models\AdminLog;
use App\Models\Report;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends BaseModeratorController
{
    public function __invoke(Request $request)
    {
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subWeek();

        $pendingReports = Report::where('status', 'pending')->count();

        // Active alerts
        $alerts = Report::where('status', 'pending')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'title' => ucfirst($r->reportable_type ?? 'Report') . ' #' . $r->id,
                'desc' => \Illuminate\Support\Str::limit($r->reason, 60),
                'level' => 'warning',
            ]);

        // Moderation-specific stats
        $moderationStats = [
            'pending_reports' => $pendingReports,
            'resolved_today' => Report::where('status', 'resolved')
                ->whereDate('updated_at', $today)->count(),
            'dismissed_today' => Report::where('status', 'dismissed')
                ->whereDate('updated_at', $today)->count(),
            'total_reports_week' => Report::where('created_at', '>=', $weekAgo)->count(),
            'flagged_conversations' => Report::where('status', 'pending')
                ->where(fn($q) => $q->where('reportable_type', 'App\\Models\\Conversation')
                    ->orWhere('reportable_type', 'App\\Models\\Message'))
                ->count(),
            'flagged_posts' => Report::where('status', 'pending')
                ->where('reportable_type', 'App\\Models\\Post')
                ->count(),
        ];

        // My recent actions
        $myActions = [];
        $admin = $request->user()?->admin;
        if ($admin) {
            $myActions = AdminLog::where('admin_id', $admin->id)
                ->latest()
                ->take(5)
                ->get()
                ->map(fn($log) => [
                    'action' => $log->action,
                    'target' => $log->metadata['target'] ?? '—',
                    'time' => $log->created_at->diffForHumans(),
                ]);
        }

        return Inertia::render('Moderator/Dashboard', [
            'alerts' => $alerts,
            'moderationStats' => $moderationStats,
            'myActions' => $myActions,
        ]);
    }
}

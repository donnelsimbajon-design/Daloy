<?php

namespace App\Http\Controllers\Admin;

use App\Models\Admin;
use App\Models\AdminLog;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends BaseAdminController
{
    public function __invoke(Request $request)
    {
        // Dashboard is accessible to all admins
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subWeek();
        $prevWeek = Carbon::now()->subWeeks(2);

        $dauThisWeek = User::where('updated_at', '>=', $today)->count();
        $newRegsWeek = User::where('created_at', '>=', $weekAgo)->count();
        $prevRegsWeek = User::whereBetween('created_at', [$prevWeek, $weekAgo])->count();
        $regsChange = $prevRegsWeek > 0 ? round((($newRegsWeek - $prevRegsWeek) / $prevRegsWeek) * 100, 1) : 0;

        $postsToday = Post::whereDate('created_at', $today)->count();
        $pendingReports = Report::where('status', 'pending')->count();
        $totalUsers = User::count();
        $totalPosts = Post::count();

        // Engagement data (last 30 days) — cached
        $engagementData = \Illuminate\Support\Facades\Cache::remember('admin:engagement:30d', 600, function () {
            $startDate = Carbon::today()->subDays(29);

            $posts = Post::selectRaw("DATE(created_at) as date, COUNT(*) as count")
                ->where('created_at', '>=', $startDate)
                ->groupByRaw('DATE(created_at)')
                ->pluck('count', 'date');

            $comments = Comment::selectRaw("DATE(created_at) as date, COUNT(*) as count")
                ->where('created_at', '>=', $startDate)
                ->groupByRaw('DATE(created_at)')
                ->pluck('count', 'date');

            $data = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i)->format('Y-m-d');
                $data[] = [
                    'label' => Carbon::parse($date)->format('M d'),
                    'posts' => $posts[$date] ?? 0,
                    'comments' => $comments[$date] ?? 0,
                ];
            }
            return $data;
        });

        // Recent admin actions
        $recentActions = AdminLog::with('admin.user')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn($log) => [
                'action' => $log->action,
                'target' => $log->metadata['target'] ?? '—',
                'admin' => $log->admin?->user?->name ?? 'System',
                'time' => $log->created_at->diffForHumans(),
            ]);

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

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'dau' => $dauThisWeek,
                'newRegistrations' => $newRegsWeek,
                'regsChange' => $regsChange,
                'postsToday' => $postsToday,
                'totalPosts' => $totalPosts,
                'pendingReports' => $pendingReports,
                'totalUsers' => $totalUsers,
            ],
            'engagementData' => $engagementData,
            'recentActions' => $recentActions,
            'alerts' => $alerts,
            'moderationStats' => $moderationStats,
            'myActions' => $myActions,
        ]);
    }
}

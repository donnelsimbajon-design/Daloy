<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\AdminLog;
use App\Models\Comment;
use App\Models\ModerationAction;
use App\Models\Post;
use App\Models\Report;
use App\Models\School;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    // ─── DASHBOARD ───────────────────────────────────────────
    public function dashboard()
    {
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subWeek();
        $monthAgo = Carbon::now()->subMonth();
        $prevWeek = Carbon::now()->subWeeks(2);

        $dauThisWeek = User::where('updated_at', '>=', $today)->count();
        $newRegsToday = User::whereDate('created_at', $today)->count();
        $newRegsWeek = User::where('created_at', '>=', $weekAgo)->count();
        $prevRegsWeek = User::whereBetween('created_at', [$prevWeek, $weekAgo])->count();
        $regsChange = $prevRegsWeek > 0 ? round((($newRegsWeek - $prevRegsWeek) / $prevRegsWeek) * 100, 1) : 0;

        $postsToday = Post::whereDate('created_at', $today)->count();
        $pendingReports = Report::where('status', 'pending')->count();

        $totalUsers = User::count();
        $totalPosts = Post::count();

        // Engagement data (last 30 days, grouped by day)
        $engagementData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $engagementData[] = [
                'label' => $date->format('M d'),
                'posts' => Post::whereDate('created_at', $date)->count(),
                'comments' => Comment::whereDate('created_at', $date)->count(),
            ];
        }

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

        // Active alerts (pending reports with critical reasons)
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
        ]);
    }

    // ─── USERS ───────────────────────────────────────────────
    public function users(Request $request)
    {
        $query = User::query()->withCount(['posts', 'comments']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'banned') {
                $query->whereHas('admin', function ($q) {
                    // placeholder: currently no status column on users
                });
            }
        }

        $users = $query->latest()->paginate(15)->through(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'profile_picture' => $user->profile_picture,
            'status' => $this->getUserStatus($user),
            'verified' => $user->email_verified_at !== null,
            'joined' => $user->created_at->format('M d, Y'),
            'posts_count' => $user->posts_count,
            'comments_count' => $user->comments_count,
        ]);

        $totalUsers = User::count();
        $activeConnections = User::where('updated_at', '>=', Carbon::now()->subHours(24))->count();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'totalUsers' => $totalUsers,
            'activeConnections' => $activeConnections,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function userAction(Request $request, User $user)
    {
        $request->validate([
            'action' => 'required|in:suspend,ban,activate,reset_password,verify,revoke_verify',
            'reason' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;
        $action = $request->action;

        switch ($action) {
            case 'suspend':
            case 'ban':
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => "{$action}_user",
                    'target_type' => 'user',
                    'target_id' => $user->id,
                    'reason' => $request->reason,
                ]);
                break;
            case 'activate':
                // Remove suspension/ban moderation actions
                ModerationAction::where('target_type', 'user')
                    ->where('target_id', $user->id)
                    ->whereIn('action_type', ['suspend_user', 'ban_user'])
                    ->delete();
                break;
            case 'reset_password':
                // In production: send reset link
                break;
            case 'verify':
                $user->update(['email_verified_at' => now()]);
                break;
            case 'revoke_verify':
                $user->update(['email_verified_at' => null]);
                break;
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => ucwords(str_replace('_', ' ', $action)),
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => "@{$user->username}" ?? $user->email,
                'target_id' => $user->id,
                'reason' => $request->reason,
            ],
        ]);

        return back()->with('success', "Action '{$action}' applied to {$user->name}.");
    }

    // ─── MODERATION ──────────────────────────────────────────
    public function moderation(Request $request)
    {
        $tab = $request->input('tab', 'posts');

        $posts = Post::with(['user', 'reports'])
            ->withCount(['reports', 'comments'])
            ->latest()
            ->paginate(10, ['*'], 'posts_page')
            ->through(fn($post) => [
                'id' => $post->id,
                'type' => 'Post',
                'author' => $post->user->name,
                'username' => '@' . $post->user->username,
                'content' => \Illuminate\Support\Str::limit($post->content, 200),
                'full_content' => $post->content,
                'media_urls' => $post->media_urls,
                'reports_count' => $post->reports_count,
                'comments_count' => $post->comments_count,
                'flagged' => $post->reports_count > 0,
                'location' => $post->location_tag,
                'date' => $post->created_at->diffForHumans(),
                'created_at' => $post->created_at->toISOString(),
            ]);

        $comments = Comment::with(['user', 'post'])
            ->withCount('reports')
            ->latest()
            ->paginate(10, ['*'], 'comments_page')
            ->through(fn($c) => [
                'id' => $c->id,
                'type' => 'Comment',
                'author' => $c->user->name,
                'username' => '@' . $c->user->username,
                'content' => $c->content,
                'post_id' => $c->post_id,
                'reports_count' => $c->reports_count,
                'flagged' => $c->reports_count > 0,
                'date' => $c->created_at->diffForHumans(),
            ]);

        // Moderation logs
        $modLogs = ModerationAction::with('admin.user')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'admin' => $m->admin?->user?->name ?? 'System',
                'action' => ucwords(str_replace('_', ' ', $m->action_type)),
                'target' => ucfirst($m->target_type) . ' #' . $m->target_id,
                'reason' => $m->reason,
                'time' => $m->created_at->diffForHumans(),
            ]);

        // Today's moderation stats
        $today = Carbon::today();
        $scannedToday = Post::whereDate('created_at', $today)->count() + Comment::whereDate('created_at', $today)->count();
        $removedToday = ModerationAction::whereDate('created_at', $today)
            ->whereIn('action_type', ['delete_post', 'delete_comment', 'hide_post'])
            ->count();

        return Inertia::render('Admin/Moderation', [
            'posts' => $posts,
            'comments' => $comments,
            'modLogs' => $modLogs,
            'todayStats' => [
                'scanned' => $scannedToday,
                'removed' => $removedToday,
            ],
            'tab' => $tab,
        ]);
    }

    public function moderateContent(Request $request)
    {
        $request->validate([
            'content_type' => 'required|in:post,comment',
            'content_id' => 'required|integer',
            'action' => 'required|in:delete,hide,flag',
            'reason' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;

        if ($request->content_type === 'post') {
            $post = Post::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $post->delete();
            }
        } else {
            $comment = Comment::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $comment->delete();
            }
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => "{$request->action}_{$request->content_type}",
            'target_type' => $request->content_type,
            'target_id' => $request->content_id,
            'reason' => $request->reason,
        ]);

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => ucfirst($request->action) . ' ' . ucfirst($request->content_type),
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => ucfirst($request->content_type) . ' #' . $request->content_id,
                'reason' => $request->reason,
            ],
        ]);

        return back()->with('success', 'Content moderated successfully.');
    }

    // ─── REPORTS ─────────────────────────────────────────────
    public function reports(Request $request)
    {
        $status = $request->input('status', 'all');

        $query = Report::with(['reporter', 'resolver.user']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $reports = $query->latest()->paginate(10)->through(fn($r) => [
            'id' => $r->id,
            'type' => class_basename($r->reportable_type ?? 'Unknown'),
            'reporter' => $r->reporter?->name ?? 'Deleted User',
            'reporter_username' => '@' . ($r->reporter?->username ?? 'unknown'),
            'target' => ucfirst(class_basename($r->reportable_type ?? '')) . ' #' . $r->reportable_id,
            'target_id' => $r->reportable_id,
            'target_type' => $r->reportable_type,
            'reason' => $r->reason,
            'status' => $r->status,
            'admin_notes' => $r->admin_notes,
            'resolver' => $r->resolver?->user?->name,
            'date' => $r->created_at->format('M d, Y H:i'),
            'time_ago' => $r->created_at->diffForHumans(),
        ]);

        $counts = [
            'all' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'dismissed' => Report::where('status', 'dismissed')->count(),
        ];

        return Inertia::render('Admin/Reports', [
            'reports' => $reports,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    public function reportAction(Request $request, Report $report)
    {
        $request->validate([
            'action' => 'required|in:dismiss,warn,remove_content,suspend,ban',
            'admin_notes' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;

        switch ($request->action) {
            case 'dismiss':
                $report->update([
                    'status' => 'dismissed',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                break;
            case 'remove_content':
                if ($report->reportable_type === 'App\\Models\\Post') {
                    Post::find($report->reportable_id)?->delete();
                } elseif ($report->reportable_type === 'App\\Models\\Comment') {
                    Comment::find($report->reportable_id)?->delete();
                }
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => 'remove_content',
                    'target_type' => class_basename($report->reportable_type ?? ''),
                    'target_id' => $report->reportable_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
            case 'warn':
            case 'suspend':
            case 'ban':
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => "{$request->action}_user",
                    'target_type' => 'user',
                    'target_id' => $report->reporter_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => 'Report ' . ucfirst($request->action),
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => 'Report #' . $report->id,
                'action' => $request->action,
                'notes' => $request->admin_notes,
            ],
        ]);

        return back()->with('success', 'Report action applied.');
    }

    // ─── GROUPS ──────────────────────────────────────────────
    public function groups()
    {
        $groups = School::withCount('members')
            ->latest()
            ->paginate(15)
            ->through(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'description' => $g->description,
                'profile_image' => $g->profile_image,
                'members_count' => $g->members_count,
                'created' => $g->created_at->format('M d, Y'),
                'status' => 'active',
            ]);

        return Inertia::render('Admin/Groups', [
            'groups' => $groups,
        ]);
    }

    public function groupAction(Request $request, School $school)
    {
        $request->validate([
            'action' => 'required|in:delete,suspend,activate',
        ]);

        $admin = $request->user()->admin;

        if ($request->action === 'delete') {
            $school->delete();
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => ucfirst($request->action) . ' Group',
            'ip_address' => $request->ip(),
            'metadata' => ['target' => $school->name, 'target_id' => $school->id],
        ]);

        return back()->with('success', 'Group action applied.');
    }

    // ─── MESSAGES ────────────────────────────────────────────
    public function messages()
    {
        // Only show reported conversations
        $reportedConversations = Report::where('reportable_type', 'App\\Models\\Message')
            ->orWhere('reportable_type', 'App\\Models\\Conversation')
            ->with('reporter')
            ->latest()
            ->paginate(15)
            ->through(fn($r) => [
                'id' => $r->id,
                'reporter' => $r->reporter?->name ?? 'Unknown',
                'reason' => $r->reason,
                'status' => $r->status,
                'date' => $r->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Admin/Messages', [
            'reportedConversations' => $reportedConversations,
        ]);
    }

    // ─── ANALYTICS ───────────────────────────────────────────
    public function analytics()
    {
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subWeek();
        $monthAgo = Carbon::now()->subMonth();

        $dau = User::where('updated_at', '>=', $today)->count();
        $mau = User::where('updated_at', '>=', $monthAgo)->count();
        $postsToday = Post::whereDate('created_at', $today)->count();
        $commentsToday = Comment::whereDate('created_at', $today)->count();
        $totalUsers = User::count();
        $totalPosts = Post::count();

        // Monthly user growth (last 12 months)
        $userGrowth = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $userGrowth[] = [
                'label' => $date->format('M'),
                'count' => User::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }

        // Report trends (last 12 months)
        $reportTrends = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $reportTrends[] = [
                'label' => $date->format('M'),
                'total' => Report::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'resolved' => Report::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->where('status', 'resolved')
                    ->count(),
            ];
        }

        return Inertia::render('Admin/Analytics', [
            'metrics' => [
                'dau' => $dau,
                'mau' => $mau,
                'postsToday' => $postsToday,
                'commentsToday' => $commentsToday,
                'totalUsers' => $totalUsers,
                'totalPosts' => $totalPosts,
            ],
            'userGrowth' => $userGrowth,
            'reportTrends' => $reportTrends,
        ]);
    }

    // ─── SETTINGS ────────────────────────────────────────────
    public function settings()
    {
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

    public function updateSettings(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $admin = $request->user()->admin;

        foreach ($request->settings as $key => $value) {
            SystemSetting::set($key, is_bool($value) ? ($value ? '1' : '0') : (string)$value, $admin->id);
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => 'Settings Updated',
            'ip_address' => $request->ip(),
            'metadata' => ['changes' => array_keys($request->settings)],
        ]);

        return back()->with('success', 'Settings saved.');
    }

    // ─── AUDIT LOGS ──────────────────────────────────────────
    public function logs(Request $request)
    {
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

    // ─── HELPER ──────────────────────────────────────────────
    private function getUserStatus(User $user): string
    {
        $ban = ModerationAction::where('target_type', 'user')
            ->where('target_id', $user->id)
            ->whereIn('action_type', ['ban_user'])
            ->exists();
        if ($ban) return 'banned';

        $suspend = ModerationAction::where('target_type', 'user')
            ->where('target_id', $user->id)
            ->whereIn('action_type', ['suspend_user'])
            ->exists();
        if ($suspend) return 'suspended';

        return 'active';
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\AdminLog;
use App\Models\Comment;
use App\Models\ModerationAction;
use App\Models\Post;
use App\Models\Report;
use App\Models\Ripple;
use App\Models\School;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    private function authorizeAdmin(Request $request, string $permissionKey): void
    {
        $admin = $request->user()->admin;
        if (!$admin || !$admin->can($permissionKey)) {
            abort(403, 'Unauthorized access to this administrative module.');
        }
    }

    // ─── DASHBOARD ───────────────────────────────────────────
    public function dashboard(Request $request)
    {
        // Dashboard is accessible to all admins
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

        // Engagement data (last 30 days) — 2 queries instead of 60
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

        // ── Moderation-specific stats (for moderator dashboard) ──
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

        // My recent actions (for the logged-in admin)
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

    // ─── USERS ───────────────────────────────────────────────
    public function users(Request $request)
    {
        $this->authorizeAdmin($request, 'users');
        $query = User::query()->withCount(['posts', 'comments'])->with('admin');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'banned') {
                $query->whereIn('id', ModerationAction::where('target_type', 'user')
                    ->where('action_type', 'ban_user')->pluck('target_id'));
            } elseif ($status === 'suspended') {
                $query->whereIn('id', ModerationAction::where('target_type', 'user')
                    ->where('action_type', 'suspend_user')->pluck('target_id'));
            }
        }

        // Batch-load statuses: 2 queries total instead of 2 per user
        $bannedIds = ModerationAction::where('target_type', 'user')
            ->where('action_type', 'ban_user')
            ->pluck('target_id')->toArray();

        $suspendedIds = ModerationAction::where('target_type', 'user')
            ->where('action_type', 'suspend_user')
            ->pluck('target_id')->toArray();

        $users = $query->latest()->paginate(15)->through(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'profile_picture' => $user->profile_picture,
            'status' => in_array($user->id, $bannedIds) ? 'banned'
                      : (in_array($user->id, $suspendedIds) ? 'suspended' : 'active'),
            'role' => $user->admin
                ? ($user->admin->role === 'super_admin' ? 'admin' : $user->admin->role)
                : 'user',
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
            'reason' => 'nullable|string|max:500',
        ]);

        $admin = $request->user()->admin;
        $adminName = $request->user()->name;

        if ($request->action === 'delete') {
            // Collect member IDs before deletion
            $memberIds = $school->members()->pluck('users.id')->toArray();
            $schoolName = $school->name;
            $reason = $request->reason ?? 'No reason provided';

            // Create ripple notification for every member
            $now = now();
            $rippleRecords = array_map(fn($userId) => [
                'user_id' => $userId,
                'sender_id' => null,
                'type' => 'group_deleted',
                'notifiable_type' => 'App\\Models\\School',
                'notifiable_id' => $school->id,
                'data' => json_encode([
                    'group_name' => $schoolName,
                    'reason' => $reason,
                    'admin_name' => $adminName,
                    'deleted_at' => $now->toIso8601String(),
                ]),
                'read_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ], $memberIds);

            // Batch insert ripples (max 500 at a time)
            foreach (array_chunk($rippleRecords, 500) as $chunk) {
                Ripple::insert($chunk);
            }

            // Delete the school
            $school->delete();

            // Create moderation action
            ModerationAction::create([
                'admin_id' => $admin->id,
                'action_type' => 'delete_group',
                'target_type' => 'school',
                'target_id' => $school->id,
                'reason' => $reason,
            ]);
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => ucfirst($request->action) . ' Group',
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => $school->name,
                'target_id' => $school->id,
                'reason' => $request->reason,
                'members_notified' => isset($memberIds) ? count($memberIds) : 0,
            ],
        ]);

        return back()->with('success', 'Group action applied.');
    }

    // ─── MESSAGES ────────────────────────────────────────────
    public function messages(Request $request)
    {
        $status = $request->input('status', 'all');

        // Only show reported conversations
        $query = Report::where(function ($q) {
                $q->where('reportable_type', 'App\\Models\\Message')
                  ->orWhere('reportable_type', 'App\\Models\\Conversation');
            });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $reportedConversations = $query
            ->with(['reporter:id,name,username,profile_picture'])
            ->latest()
            ->paginate(15)
            ->through(function ($r) {
                $data = [
                    'id' => $r->id,
                    'reporter' => $r->reporter?->name ?? 'Unknown',
                    'reporter_username' => '@' . ($r->reporter?->username ?? 'unknown'),
                    'reporter_avatar' => $r->reporter?->profile_picture,
                    'reason' => $r->reason,
                    'status' => $r->status,
                    'date' => $r->created_at->format('M d, Y'),
                    'time_ago' => $r->created_at->diffForHumans(),
                    'reportable_type' => class_basename($r->reportable_type ?? ''),
                    'reportable_id' => $r->reportable_id,
                    'conversation' => null,
                    'message_previews' => [],
                    'participants' => [],
                ];

                // Load conversation details
                if ($r->reportable_type === 'App\\Models\\Conversation') {
                    $convo = \App\Models\Conversation::with('participants:id,name,username,profile_picture')
                        ->find($r->reportable_id);
                    if ($convo) {
                        $data['conversation'] = [
                            'id' => $convo->id,
                            'type' => $convo->type,
                            'name' => $convo->name,
                        ];
                        $data['participants'] = $convo->participants->map(fn($p) => [
                            'id' => $p->id,
                            'name' => $p->name,
                            'username' => $p->username,
                            'profile_picture' => $p->profile_picture,
                        ])->toArray();

                        // Get last 5 messages for preview
                        $data['message_previews'] = $convo->messages()
                            ->with('user:id,name')
                            ->latest()
                            ->take(5)
                            ->get()
                            ->reverse()
                            ->values()
                            ->map(fn($m) => [
                                'id' => $m->id,
                                'sender' => $m->user?->name ?? 'Deleted',
                                'content' => \Illuminate\Support\Str::limit($m->content, 120),
                                'time' => $m->created_at->format('H:i'),
                            ])->toArray();
                    }
                }

                return $data;
            });

        $counts = [
            'total' => Report::where(function ($q) {
                $q->where('reportable_type', 'App\\Models\\Message')
                  ->orWhere('reportable_type', 'App\\Models\\Conversation');
            })->count(),
            'pending' => Report::where(function ($q) {
                $q->where('reportable_type', 'App\\Models\\Message')
                  ->orWhere('reportable_type', 'App\\Models\\Conversation');
            })->where('status', 'pending')->count(),
            'resolved' => Report::where(function ($q) {
                $q->where('reportable_type', 'App\\Models\\Message')
                  ->orWhere('reportable_type', 'App\\Models\\Conversation');
            })->where('status', 'resolved')->count(),
            'dismissed' => Report::where(function ($q) {
                $q->where('reportable_type', 'App\\Models\\Message')
                  ->orWhere('reportable_type', 'App\\Models\\Conversation');
            })->where('status', 'dismissed')->count(),
        ];

        return Inertia::render('Admin/Messages', [
            'reportedConversations' => $reportedConversations,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Take action on a reported conversation.
     */
    public function messageReportAction(Request $request, Report $report)
    {
        $request->validate([
            'action' => 'required|in:dismiss,resolve,warn,delete_conversation',
            'admin_notes' => 'nullable|string|max:1000',
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

            case 'resolve':
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                break;

            case 'delete_conversation':
                if ($report->reportable_type === 'App\\Models\\Conversation') {
                    \App\Models\Conversation::find($report->reportable_id)?->delete();
                }
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes ?? 'Conversation deleted by admin.',
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => 'delete_conversation',
                    'target_type' => 'conversation',
                    'target_id' => $report->reportable_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
        }

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => 'Message Report ' . ucfirst($request->action),
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => 'Report #' . $report->id,
                'conversation_id' => $report->reportable_id,
                'action' => $request->action,
                'notes' => $request->admin_notes,
            ],
        ]);

        return back()->with('success', 'Report action applied.');
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

        // Monthly user growth (last 12 months) — 1 query instead of 12
        $userGrowth = \Illuminate\Support\Facades\Cache::remember('admin:user_growth:12m', 900, function () {
            $startDate = Carbon::now()->subMonths(11)->startOfMonth();

            $monthly = User::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
                ->where('created_at', '>=', $startDate)
                ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
                ->pluck('count', 'month');

            $data = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $key = $date->format('Y-m');
                $data[] = [
                    'label' => $date->format('M'),
                    'count' => $monthly[$key] ?? 0,
                ];
            }
            return $data;
        });

        // Report trends (last 12 months) — 2 queries instead of 24
        $reportTrends = \Illuminate\Support\Facades\Cache::remember('admin:report_trends:12m', 900, function () {
            $startDate = Carbon::now()->subMonths(11)->startOfMonth();

            $totalByMonth = Report::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
                ->where('created_at', '>=', $startDate)
                ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
                ->pluck('count', 'month');

            $resolvedByMonth = Report::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
                ->where('created_at', '>=', $startDate)
                ->where('status', 'resolved')
                ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
                ->pluck('count', 'month');

            $data = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $key = $date->format('Y-m');
                $data[] = [
                    'label' => $date->format('M'),
                    'total' => $totalByMonth[$key] ?? 0,
                    'resolved' => $resolvedByMonth[$key] ?? 0,
                ];
            }
            return $data;
        });

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

    // ─── ADMIN USER MANAGEMENT ──────────────────────────────
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:user,moderator,admin',
        ]);

        $admin = $request->user()->admin;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(), // Admin-created users are auto-verified
        ]);

        // If role is admin, create admin record
        if ($request->role === 'admin' || $request->role === 'moderator') {
            Admin::create([
                'user_id' => $user->id,
                'role' => $request->role === 'admin' ? 'super_admin' : 'moderator',
            ]);
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => 'create_user',
            'target_type' => 'user',
            'target_id' => $user->id,
            'reason' => 'Admin-created account',
        ]);

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => 'Create User',
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => "@{$user->username}",
                'target_id' => $user->id,
                'role' => $request->role ?? 'user',
            ],
        ]);

        return back()->with('success', "User {$user->name} created successfully.");
    }

    public function changeUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,moderator,admin',
        ]);

        $admin = $request->user()->admin;
        $newRole = $request->role;
        $oldRole = $user->admin ? ($user->admin->role === 'super_admin' ? 'admin' : $user->admin->role) : 'user';

        if ($newRole === 'user') {
            // Remove admin record if exists
            Admin::where('user_id', $user->id)->delete();
        } else {
            // Create or update admin record
            $adminRecord = Admin::firstOrCreate(
                ['user_id' => $user->id],
                ['role' => $newRole === 'admin' ? 'super_admin' : 'moderator']
            );
            $adminRecord->update(['role' => $newRole === 'admin' ? 'super_admin' : 'moderator']);
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => 'change_role',
            'target_type' => 'user',
            'target_id' => $user->id,
            'reason' => "Role changed from {$oldRole} to {$newRole}",
        ]);

        AdminLog::create([
            'admin_id' => $admin->id,
            'action' => 'Change User Role',
            'ip_address' => $request->ip(),
            'metadata' => [
                'target' => "@{$user->username}",
                'target_id' => $user->id,
                'old_role' => $oldRole,
                'new_role' => $newRole,
            ],
        ]);

        return back()->with('success', "{$user->name}'s role changed to {$newRole}.");
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

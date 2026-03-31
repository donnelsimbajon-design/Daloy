<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Models\UserActivityLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    // ─── Activity Index ──────────────────────────────────────────
    public function index(Request $request)
    {
        $today    = Carbon::today();
        $monthAgo = Carbon::now()->subMonth();

        // Summary stats
        $totalToday = UserActivityLog::whereDate('created_at', $today)->count();
        $totalMonth = UserActivityLog::where('created_at', '>=', $monthAgo)->count();

        // Most active voyager today
        $topUser = UserActivityLog::whereDate('created_at', $today)
            ->selectRaw('user_id, count(*) as cnt')
            ->groupBy('user_id')
            ->orderByDesc('cnt')
            ->with('user:id,name,username,profile_picture')
            ->first();

        // Most common action today
        $topAction = UserActivityLog::whereDate('created_at', $today)
            ->selectRaw('action_type, count(*) as cnt')
            ->groupBy('action_type')
            ->orderByDesc('cnt')
            ->first();

        // Build query
        $query = UserActivityLog::with('user:id,name,username,profile_picture')
            ->latest('created_at');

        if ($search = $request->input('user')) {
            $query->whereHas('user', fn($q) =>
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
            );
        }

        if ($category = $request->input('category')) {
            $query->where('action_category', $category);
        }

        if ($actionType = $request->input('action_type')) {
            $query->where('action_type', $actionType);
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->paginate(20)->through(fn($log) => [
            'id'              => $log->id,
            'user_id'         => $log->user_id,
            'username'        => $log->user?->username ?? 'deleted',
            'name'            => $log->user?->name ?? 'Deleted User',
            'profile_picture' => $log->user?->profile_picture,
            'action_type'     => $log->action_type,
            'action_category' => $log->action_category,
            'target_type'     => $log->target_type,
            'target_id'       => $log->target_id,
            'metadata'        => $log->metadata,
            'ip_address'      => $log->ip_address,
            'created_at'      => $log->created_at->format('Y-m-d H:i:s'),
            'time_ago'        => $log->created_at->diffForHumans(),
        ]);

        // Available action types for filter dropdown
        $actionTypes = UserActivityLog::selectRaw('action_type')
            ->distinct()
            ->orderBy('action_type')
            ->pluck('action_type');

        return Inertia::render('Admin/Activity', [
            'stats' => [
                'totalToday'  => $totalToday,
                'totalMonth'  => $totalMonth,
                'topUser'     => $topUser ? [
                    'name'     => $topUser->user?->name ?? 'Unknown',
                    'username' => $topUser->user?->username ?? '',
                    'count'    => $topUser->cnt,
                ] : null,
                'topAction'   => $topAction ? [
                    'type'  => $topAction->action_type,
                    'count' => $topAction->cnt,
                ] : null,
            ],
            'logs'        => $logs,
            'actionTypes' => $actionTypes,
            'filters'     => $request->only(['user', 'category', 'action_type', 'from', 'to']),
        ]);
    }

    // ─── Per-User Activity Timeline ──────────────────────────────
    public function userActivity(Request $request, User $user)
    {
        $logs = UserActivityLog::where('user_id', $user->id)
            ->latest('created_at')
            ->paginate(30)
            ->through(fn($log) => [
                'id'              => $log->id,
                'action_type'     => $log->action_type,
                'action_category' => $log->action_category,
                'target_type'     => $log->target_type,
                'target_id'       => $log->target_id,
                'metadata'        => $log->metadata,
                'ip_address'      => $log->ip_address,
                'created_at'      => $log->created_at->format('Y-m-d H:i:s'),
                'time_ago'        => $log->created_at->diffForHumans(),
            ]);

        $totalActions = UserActivityLog::where('user_id', $user->id)->count();

        $categoryBreakdown = UserActivityLog::where('user_id', $user->id)
            ->selectRaw('action_category, count(*) as cnt')
            ->groupBy('action_category')
            ->pluck('cnt', 'action_category');

        return Inertia::render('Admin/UserActivity', [
            'user' => [
                'id'              => $user->id,
                'name'            => $user->name,
                'username'        => $user->username,
                'email'           => $user->email,
                'profile_picture' => $user->profile_picture,
                'joined'          => $user->created_at->format('M d, Y'),
            ],
            'logs'              => $logs,
            'totalActions'      => $totalActions,
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }

    // ─── Export CSV ──────────────────────────────────────────────
    public function exportCsv(Request $request)
    {
        $query = UserActivityLog::with('user:id,name,username')
            ->latest('created_at');

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }
        if ($category = $request->input('category')) {
            $query->where('action_category', $category);
        }

        $filename = 'activity_logs_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'User', 'Username', 'Action Type', 'Category',
                              'Target Type', 'Target ID', 'IP', 'Timestamp']);

            $query->chunk(500, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->user?->name ?? 'Deleted',
                        $log->user?->username ?? '',
                        $log->action_type,
                        $log->action_category,
                        $log->target_type ?? '',
                        $log->target_id ?? '',
                        $log->ip_address ?? '',
                        $log->created_at->format('Y-m-d H:i:s'),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}

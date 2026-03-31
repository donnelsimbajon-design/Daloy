<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Post;
use App\Models\Report;
use App\Models\Story;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class LiveMonitorController extends Controller
{
    // ─── Index (Inertia page) ────────────────────────────────────
    public function index()
    {
        return Inertia::render('Admin/LiveMonitor', [
            'initialMetrics' => $this->buildMetrics(),
        ]);
    }

    // ─── SSE Stream ──────────────────────────────────────────────
    public function stream()
    {
        return response()->stream(function () {
            while (true) {
                if (connection_aborted()) break;

                $data = json_encode($this->buildMetrics());
                echo "data: {$data}\n\n";

                ob_flush();
                flush();
                sleep(5);
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }

    // ─── Toggle Maintenance ──────────────────────────────────────
    public function toggleMaintenance(Request $request)
    {
        $admin   = $request->user()->admin;
        $current = SystemSetting::get('maintenance_mode', '0');
        $newVal  = $current === '1' ? '0' : '1';

        SystemSetting::set('maintenance_mode', $newVal, $admin->id);

        \App\Models\AdminLog::create([
            'admin_id'   => $admin->id,
            'action'     => 'Toggle Maintenance Mode',
            'ip_address' => $request->ip(),
            'metadata'   => ['state' => $newVal === '1' ? 'enabled' : 'disabled'],
        ]);

        return back()->with('success', 'Maintenance mode ' . ($newVal === '1' ? 'enabled' : 'disabled') . '.');
    }

    // ─── Clear Cache ─────────────────────────────────────────────
    public function clearCache(Request $request)
    {
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
        \Illuminate\Support\Facades\Artisan::call('view:clear');
        \Illuminate\Support\Facades\Artisan::call('route:clear');

        $admin = $request->user()->admin;
        \App\Models\AdminLog::create([
            'admin_id'   => $admin->id,
            'action'     => 'Clear Application Cache',
            'ip_address' => $request->ip(),
            'metadata'   => ['cleared' => ['cache', 'views', 'routes']],
        ]);

        return back()->with('success', 'Cache cleared successfully.');
    }

    // ─── Build Metrics Snapshot ──────────────────────────────────
    private function buildMetrics(): array
    {
        $now       = Carbon::now();
        $fiveMin   = $now->copy()->subMinutes(5);
        $oneHour   = $now->copy()->subHour();
        $oneMin    = $now->copy()->subMinute();
        $tenMin    = $now->copy()->subMinutes(10);

        $onlineNow       = User::where('updated_at', '>=', $fiveMin)->count();
        $postsPerMin     = Post::where('created_at', '>=', $oneMin)->count();
        $messagesPerMin  = Message::where('created_at', '>=', $oneMin)->count();
        $newSignups1hr   = User::where('created_at', '>=', $oneHour)->count();
        $pendingReports  = Report::where('status', 'pending')->count();
        $activeStories   = Story::where('expires_at', '>', $now)->count();
        $activeConvos    = Conversation::whereHas('messages', fn($q) =>
            $q->where('created_at', '>=', $tenMin)
        )->count();

        // Location breakdown (group by location string from users)
        $locationMap = User::where('updated_at', '>=', $fiveMin)
            ->whereNotNull('location')
            ->selectRaw('location, count(*) as cnt')
            ->groupBy('location')
            ->orderByDesc('cnt')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['location' => $r->location, 'count' => $r->cnt]);

        // Recent activity feed (last 20 events across the platform)
        $recentPosts = Post::with('user:id,name,username')
            ->latest()->limit(5)->get()
            ->map(fn($p) => [
                'type' => 'post', 'category' => 'post',
                'actor' => $p->user?->username ?? 'unknown',
                'description' => 'Created a post',
                'time' => $p->created_at->diffForHumans(),
            ]);

        $recentUsers = User::latest()->limit(5)->get()
            ->map(fn($u) => [
                'type' => 'signup', 'category' => 'account',
                'actor' => $u->username,
                'description' => 'Joined Daloy',
                'time' => $u->created_at->diffForHumans(),
            ]);

        $feed = $recentPosts->merge($recentUsers)
            ->sortByDesc(fn($item) => $item['time'])
            ->values()
            ->take(20)
            ->all();

        $maintenanceMode = SystemSetting::get('maintenance_mode', '0') === '1';

        return [
            'onlineNow'      => $onlineNow,
            'postsPerMin'    => $postsPerMin,
            'messagesPerMin' => $messagesPerMin,
            'newSignups1hr'  => $newSignups1hr,
            'pendingReports' => $pendingReports,
            'activeStories'  => $activeStories,
            'activeConvos'   => $activeConvos,
            'locationMap'    => $locationMap,
            'feed'           => $feed,
            'maintenanceMode'=> $maintenanceMode,
            'health' => [
                'memoryUsage'  => round(memory_get_usage(true) / 1048576, 1),
                'memoryPeak'   => round(memory_get_peak_usage(true) / 1048576, 1),
                'memoryLimit'  => ini_get('memory_limit'),
            ],
            'timestamp' => $now->toISOString(),
        ];
    }
}

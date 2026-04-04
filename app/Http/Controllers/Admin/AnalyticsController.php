<?php

namespace App\Http\Controllers\Admin;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends BaseAdminController
{
    public function __invoke(Request $request)
    {
        $this->authorizeAdmin($request, 'analytics');

        $today = Carbon::today();
        $monthAgo = Carbon::now()->subMonth();

        $dau = User::where('updated_at', '>=', $today)->count();
        $mau = User::where('updated_at', '>=', $monthAgo)->count();
        $postsToday = Post::whereDate('created_at', $today)->count();
        $commentsToday = Comment::whereDate('created_at', $today)->count();
        $totalUsers = User::count();
        $totalPosts = Post::count();

        // Monthly user growth (last 12 months) — cached
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

        // Report trends (last 12 months) — cached
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
}

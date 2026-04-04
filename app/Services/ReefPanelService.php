<?php

namespace App\Services;

use App\Models\Hashtag;
use App\Models\School;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReefPanelService
{
    /**
     * Get trending hashtags — ordered by post_count descending.
     * Cached for 15 minutes.
     */
    public static function getTrendingHashtags(): array
    {
        return Cache::remember('reef:trending_hashtags', 900, function () {
            return Hashtag::where('post_count', '>', 0)
                ->orderByDesc('post_count')
                ->take(12)
                ->get(['id', 'name', 'post_count'])
                ->map(fn($h) => [
                    'id'    => $h->id,
                    'name'  => '#' . $h->name,
                    'posts' => $h->post_count,
                ])
                ->toArray();
        });
    }

    /**
     * Get suggested groups the current user has NOT joined.
     * Falls back to popular public groups for guests.
     * Cached per-user for 10 minutes.
     */
    public static function getSuggestedGroups(?int $userId = null): array
    {
        $cacheKey = $userId ? "reef:suggested_groups:{$userId}" : 'reef:suggested_groups:guest';

        return Cache::remember($cacheKey, 600, function () use ($userId) {
            $query = School::withCount('members')
                ->where('privacy', 'public')
                ->orderByDesc('members_count')
                ->take(6);

            // Exclude groups the user already joined
            if ($userId) {
                $query->whereDoesntHave('members', fn($q) => $q->where('user_id', $userId));
            }

            return $query->get(['id', 'name', 'description', 'profile_image'])
                ->map(fn($g) => [
                    'id'            => $g->id,
                    'name'          => $g->name,
                    'description'   => $g->description,
                    'profile_image' => $g->profile_image,
                    'members'       => $g->members_count,
                    'initial'       => strtoupper(substr($g->name, 0, 1)),
                ])
                ->toArray();
        });
    }

    /**
     * Get top 3 trending hashtags for the "Popular Today" section.
     * Uses a shorter cache (5 minutes).
     */
    public static function getPopularToday(): array
    {
        return Cache::remember('reef:popular_today', 300, function () {
            return Hashtag::where('post_count', '>', 0)
                ->orderByDesc('post_count')
                ->take(3)
                ->get(['id', 'name', 'post_count'])
                ->map(fn($h) => [
                    'id'    => $h->id,
                    'name'  => '#' . $h->name,
                    'posts' => $h->post_count,
                ])
                ->toArray();
        });
    }

    /**
     * Bust caches when groups or hashtags change.
     */
    public static function bustGroupsCache(?int $userId = null): void
    {
        if ($userId) {
            Cache::forget("reef:suggested_groups:{$userId}");
        }
        Cache::forget('reef:suggested_groups:guest');
    }

    public static function bustHashtagsCache(): void
    {
        Cache::forget('reef:trending_hashtags');
        Cache::forget('reef:popular_today');
    }
}

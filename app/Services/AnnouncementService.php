<?php

namespace App\Services;

use App\Models\Announcement;
use Illuminate\Support\Facades\Cache;

class AnnouncementService
{
    /**
     * Cache key for active user-facing announcements.
     */
    private const CACHE_KEY = 'announcements:active';
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Get active announcements for the user-facing side.
     * Cached for 5 minutes, busted on any CRUD operation.
     */
    public static function getActiveForUser(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return Announcement::where('is_active', true)
                ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->where(fn($q) => $q->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now()))
                ->orderByDesc('created_at')
                ->take(5)
                ->get(['id', 'title', 'message', 'type', 'display_location'])
                ->toArray();
        });
    }

    /**
     * Bust the cache when announcements are created, updated, or deactivated.
     */
    public static function bustCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}

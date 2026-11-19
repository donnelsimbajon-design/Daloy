<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementInteractionController extends Controller
{
    public function live(Request $request)
    {
        $user = $request->user();

        // Find the latest active announcement that the user hasn't dismissed yet
        // and that has been sent (sent_count > 0).
        $announcement = Announcement::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                      ->orWhere('scheduled_at', '<=', now());
            })
            ->where(function ($q) {
                // Ignore expired ones
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->whereNotExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                      ->from('announcement_interactions')
                      ->whereColumn('announcement_interactions.announcement_id', 'announcements.id')
                      ->where('announcement_interactions.user_id', $user->id)
                      ->where('announcement_interactions.dismissed', true);
            })
            // Compare the authenticated user's timestamps in PHP instead of
            // MySQL-only DATE_SUB/NOW expressions. Works with SQLite, MySQL
            // and PostgreSQL and leaves the audience rules unchanged.
            ->where(function ($q) use ($user) {
                $q->where('target_audience', 'all');

                if ($user->created_at && $user->created_at->greaterThanOrEqualTo(now()->subDays(30))) {
                    $q->orWhere('target_audience', 'new_users');
                }

                if ($user->updated_at && $user->updated_at->greaterThanOrEqualTo(now()->subDays(7))) {
                    $q->orWhere('target_audience', 'active_users');
                }

                $q->orWhere(function ($schoolQuery) use ($user) {
                    $schoolQuery->where('target_audience', 'specific_school')
                        ->whereExists(function ($memberQuery) use ($user) {
                            $memberQuery->select(DB::raw(1))
                                ->from('school_members')
                                ->whereColumn('school_members.school_id', 'announcements.school_id')
                                ->where('school_members.user_id', $user->id);
                        });
                });
            })
            ->latest()
            ->first();

        // Increment read count via some track reading if it's the first time we see it?
        // We'll increment read count on the first interaction if needed, or right here globally.
        // Actually best done when user opens/interacts.

        return response()->json([
            'announcement' => $announcement
        ]);
    }

    public function interact(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'vote' => 'nullable|in:upvote,downvote,none',
            'feedback' => 'nullable|string|max:500',
            'dismissed' => 'required|boolean'
        ]);

        $announcement->interactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'vote' => $data['vote'] ?? 'none',
                'feedback' => $data['feedback'] ?? null,
                'dismissed' => $data['dismissed'] ?? true,
            ]
        );

        // If this is their first interaction, we can bump the read count safely.
        // For now, we'll just increment it simply if they dismissed it.
        if ($data['dismissed']) {
            // Using a simple atomic increment
            $announcement->increment('read_count');
        }

        return response()->json(['success' => true]);
    }
}

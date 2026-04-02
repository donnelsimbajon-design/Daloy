<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\StoryView;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $friendIds    = $user->friends()->pluck('users.id');
        $followingIds = $user->following()->pluck('users.id');

        $eligibleUserIds = $friendIds->merge($followingIds)->push($user->id)->unique();

        // Block filter
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id');
        $blockedMeIds   = $user->blockedBy()->pluck('users.id');
        $allBlockedIds  = $blockedByMeIds->merge($blockedMeIds)->unique();

        // Close friends who include me
        $closeFriendOfIds = $user->closeFriendOf()->pluck('users.id');

        $stories = Story::with('user:id,name,username,profile_picture')
            ->where('expires_at', '>', now())
            ->whereIn('user_id', $eligibleUserIds)
            ->whereNotIn('user_id', $allBlockedIds)
            ->where(function ($query) use ($user, $friendIds, $closeFriendOfIds) {
                // Own stories
                $query->where('user_id', $user->id)
                // Public stories
                      ->orWhere('visibility', 'public')
                // Friends-only stories from actual friends
                      ->orWhere(function ($q) use ($friendIds) {
                          $q->where('visibility', 'friends')
                            ->whereIn('user_id', $friendIds);
                      })
                // Close friends stories
                      ->orWhere(function ($q) use ($closeFriendOfIds) {
                          $q->where('visibility', 'close_friends')
                            ->whereIn('user_id', $closeFriendOfIds);
                      });
            })
            ->latest()
            ->get();

        $formatted = $stories->map(function ($story) use ($user) {
            $timeAgo = str_replace(
                [' seconds', ' second', ' minutes', ' minute', ' hours', ' hour', ' days', ' day'],
                ['s', 's', 'm', 'm', 'h', 'h', 'd', 'd'],
                $story->created_at->diffForHumans(null, true)
            );

            $isOwner = $story->user_id === $user->id;
            $viewCount = $isOwner ? StoryView::where('story_id', $story->id)->count() : null;

            return [
                'id' => $story->id,
                'user' => $story->user,
                'time' => $timeAgo . ' ago',
                'content' => $story->content,
                'image' => $story->media_url,
                'type' => $story->type,
                'is_owner' => $isOwner,
                'view_count' => $viewCount,
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $request->validate([
            'media' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:51200',
            'content' => 'nullable|string|max:255',
            'visibility' => 'required|in:public,friends,private,close_friends',
        ]);

        $path = $request->file('media')->store('stories', 'public');
        $url = '/storage/' . $path;

        $extension = strtolower($request->file('media')->getClientOriginalExtension());
        $type = in_array($extension, ['mp4', 'mov']) ? 'video' : 'image';

        Story::create([
            'user_id' => Auth::id(),
            'media_url' => $url,
            'type' => $type,
            'content' => $request->content,
            'visibility' => $request->visibility,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json(['message' => 'Story uploaded successfully']);
    }

    /**
     * Record a story view.
     */
    public function recordView(Story $story): JsonResponse
    {
        $user = Auth::user();

        // Don't record if owner views own story
        if ($story->user_id === $user->id) {
            return response()->json(['ok' => true]);
        }

        StoryView::firstOrCreate([
            'story_id' => $story->id,
            'viewer_id' => $user->id,
        ], [
            'viewed_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Get viewers of a story (owner only).
     */
    public function viewers(Story $story): JsonResponse
    {
        $user = Auth::user();

        if ($story->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $viewers = StoryView::where('story_id', $story->id)
            ->with('viewer:id,name,username,profile_picture')
            ->orderByDesc('viewed_at')
            ->get();

        return response()->json($viewers);
    }
}

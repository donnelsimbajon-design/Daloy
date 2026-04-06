<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

use App\Models\Story;
use App\Models\StoryView;
use App\Models\Reaction;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\Ripple;
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

        $blockedByMeIds = $user->blockedUsers()->pluck('users.id');
        $blockedMeIds   = $user->blockedBy()->pluck('users.id');
        $allBlockedIds  = $blockedByMeIds->merge($blockedMeIds)->unique();

        $closeFriendOfIds = $user->closeFriendOf()->pluck('users.id');

        $stories = Story::with(['user:id,name,username,profile_picture', 'reactions'])
            ->where('expires_at', '>', now())
            ->whereIn('user_id', $eligibleUserIds)
            ->whereNotIn('user_id', $allBlockedIds)
            ->where(function ($query) use ($user, $friendIds, $closeFriendOfIds) {
                $query->where('user_id', $user->id)
                      ->orWhere('visibility', 'public')
                      ->orWhere(function ($q) use ($friendIds) {
                          $q->where('visibility', 'friends')->whereIn('user_id', $friendIds);
                      })
                      ->orWhere(function ($q) use ($closeFriendOfIds) {
                          $q->where('visibility', 'close_friends')->whereIn('user_id', $closeFriendOfIds);
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

            $isOwner   = $story->user_id === $user->id;
            $viewCount = $isOwner ? StoryView::where('story_id', $story->id)->count() : null;
            $liked     = $story->reactions->where('user_id', $user->id)->where('type', 'like')->isNotEmpty();

            return [
                'id'         => $story->id,
                'user'       => $story->user,
                'time'       => $timeAgo . ' ago',
                'content'    => $story->content,
                'image'      => $story->media_url,
                'type'       => $story->type,
                'is_owner'   => $isOwner,
                'view_count' => $viewCount,
                'is_liked'   => $liked,
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $request->validate([
            'media'      => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:51200',
            'content'    => 'nullable|string|max:255',
            'visibility' => 'required|in:public,friends,private,close_friends',
        ]);

        $path      = $request->file('media')->store('stories');
        $url       = Storage::url($path);
        $extension = strtolower($request->file('media')->getClientOriginalExtension());
        $type      = in_array($extension, ['mp4', 'mov']) ? 'video' : 'image';

        Story::create([
            'user_id'    => Auth::id(),
            'media_url'  => $url,
            'type'       => $type,
            'content'    => $request->input('content'),
            'visibility' => $request->visibility,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json(['message' => 'Story uploaded successfully']);
    }

    /**
     * Record a story view (idempotent).
     */
    public function recordView(Story $story): JsonResponse
    {
        $user = Auth::user();

        if ($story->user_id === $user->id) {
            return response()->json(['ok' => true]);
        }

        StoryView::firstOrCreate(
            ['story_id' => $story->id, 'viewer_id' => $user->id],
            ['viewed_at' => now()]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Viewers list — owner only. Each entry includes whether that viewer liked the story.
     */
    public function viewers(Story $story): JsonResponse
    {
        $user = Auth::user();

        if ($story->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $views = StoryView::where('story_id', $story->id)
            ->with('viewer:id,name,username,profile_picture')
            ->orderByDesc('viewed_at')
            ->get();

        // Build a map of user_ids who liked
        $likerIds = $story->reactions()
            ->where('type', 'like')
            ->pluck('user_id')
            ->flip();

        $result = $views->map(fn($view) => [
            'id'        => $view->id,
            'viewer'    => $view->viewer,
            'viewed_at' => $view->viewed_at,
            'liked'     => isset($likerIds[$view->viewer_id]),
        ]);

        return response()->json($result);
    }

    /**
     * Live state — owner polls this every ~5s to get real-time view count and likers.
     */
    public function liveState(Story $story): JsonResponse
    {
        $user = Auth::user();

        if ($story->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $viewCount = StoryView::where('story_id', $story->id)->count();

        $likers = $story->reactions()
            ->where('type', 'like')
            ->with('user:id,name,profile_picture')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($r) => [
                'id'              => $r->user_id,
                'name'            => $r->user?->name,
                'profile_picture' => $r->user?->profile_picture,
            ]);

        return response()->json([
            'view_count' => $viewCount,
            'likers'     => $likers,
        ]);
    }

    /**
     * Toggle like — notifies story owner via Ripple notification.
     */
    public function react(Story $story): JsonResponse
    {
        $user = Auth::user();

        $existing = $story->reactions()
            ->where('user_id', $user->id)
            ->where('type', 'like')
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['liked' => false]);
        }

        $story->reactions()->create(['user_id' => $user->id, 'type' => 'like']);

        // Ensure a view is recorded when a user likes
        \App\Models\StoryView::firstOrCreate(
            ['story_id' => $story->id, 'viewer_id' => $user->id],
            ['viewed_at' => now()]
        );

        // Send Ripple notification to story owner (skip self-like)
        if ($story->user_id !== $user->id) {
            Ripple::create([
                'user_id'         => $story->user_id,
                'sender_id'       => $user->id,
                'type'            => 'story_like',
                'notifiable_type' => Story::class,
                'notifiable_id'   => $story->id,
                'data'            => [
                    'message'     => $user->name . ' liked your story.',
                    'sender_name' => $user->name,
                    'story_id'    => $story->id,
                    'story_image' => $story->type !== 'video' ? $story->media_url : null,
                ],
            ]);
        }

        return response()->json(['liked' => true]);
    }

    /**
     * Reply to a story — finds or creates a DM conversation using the
     * conversation_participants pivot, then attaches the story_id to the message.
     * Also notifies story owner via Ripple.
     */
    public function reply(Story $story, Request $request): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:1000']);

        $sender     = Auth::user();
        $receiverId = $story->user_id;

        if ($sender->id === $receiverId) {
            return response()->json(['message' => 'Cannot reply to your own story.'], 400);
        }

        // Find existing direct conversation using participants pivot (NOT user1_id/user2_id)
        $conversation = Conversation::where('type', 'direct')
            ->whereHas('participants', fn($q) => $q->where('user_id', $sender->id))
            ->whereHas('participants', fn($q) => $q->where('user_id', $receiverId))
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create(['type' => 'direct']);
            $conversation->participants()->attach([$sender->id, $receiverId]);
        }

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id'         => $sender->id,
            'content'         => $request->input('content'),
            'story_id'        => $story->id,
        ]);

        $conversation->touch();

        // Ensure a view is recorded when a user replies
        \App\Models\StoryView::firstOrCreate(
            ['story_id' => $story->id, 'viewer_id' => $sender->id],
            ['viewed_at' => now()]
        );

        // Notify story owner
        if ($story->user_id !== $sender->id) {
            Ripple::create([
                'user_id'         => $story->user_id,
                'sender_id'       => $sender->id,
                'type'            => 'story_reply',
                'notifiable_type' => Story::class,
                'notifiable_id'   => $story->id,
                'data'            => [
                    'message'         => $sender->name . ' replied to your story.',
                    'sender_name'     => $sender->name,
                    'story_id'        => $story->id,
                    'story_image'     => $story->type !== 'video' ? $story->media_url : null,
                    'conversation_id' => $conversation->id,
                ],
            ]);
        }

        return response()->json(['message' => 'Reply sent successfully.']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookmarkController extends Controller
{
    /**
     * Toggle bookmark on a post.
     */
    public function toggle(Post $post): JsonResponse
    {
        $user = Auth::user();

        $existing = Bookmark::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['bookmarked' => false]);
        }

        Bookmark::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        return response()->json(['bookmarked' => true]);
    }

    /**
     * Show all bookmarked posts.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        $bookmarks = Bookmark::where('user_id', $user->id)
            ->with(['post' => function ($q) use ($allBlockedIds) {
                $q->whereNotIn('user_id', $allBlockedIds)
                  ->with([
                      'user:id,name,username,profile_picture',
                      'media',
                      'school:id,name,cover_image,profile_image',
                      'poll.options',
                      'reactions',
                      'repostOf.user:id,name,username,profile_picture',
                      'repostOf.media',
                  ])
                  ->withCount(['comments', 'reactions']);
            }])
            ->orderByDesc('created_at')
            ->paginate(15);

        // Attach user-specific reaction data to each post
        $bookmarks->getCollection()->transform(function ($bookmark) use ($user) {
            if ($bookmark->post) {
                $post = $bookmark->post;
                $userReaction = $post->reactions->where('user_id', $user->id)->first();
                $post->user_reaction = $userReaction ? $userReaction->type : null;
                $post->liked_by_user = $userReaction !== null;
                $post->reaction_counts = $post->reactions
                    ->groupBy('type')
                    ->map->count()
                    ->toArray();
                $post->is_bookmarked = true; // Always true since it's in bookmarks
            }
            return $bookmark;
        });

        // Filter out bookmarks where the post was deleted or from blocked users
        $bookmarks->setCollection(
            $bookmarks->getCollection()->filter(fn($b) => $b->post !== null)
        );

        return Inertia::render('SavedPosts', [
            'bookmarks' => $bookmarks,
        ]);
    }
}

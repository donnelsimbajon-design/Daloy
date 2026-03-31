<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Traits\LogsUserActivity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    use LogsUserActivity;
    /**
     * Toggle like on a post. Returns updated liked state + count.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user      = Auth::user();
        $postOwner = $post->user;

        // Block check: no reactions across blocked parties
        if ($postOwner && $postOwner->id !== $user->id) {
            $isBlockedByOwner = $postOwner->blockedUsers()
                ->where('blocked_user_id', $user->id)->exists();
            $hasBlockedOwner  = $user->blockedUsers()
                ->where('blocked_user_id', $postOwner->id)->exists();

            if ($isBlockedByOwner || $hasBlockedOwner) {
                return response()->json(['message' => 'You cannot react to this post.'], 403);
            }
        }

        $existing = $post->reactions()
            ->where('user_id', $user->id)
            ->where('type', 'like')
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
            $this->logActivity('unliked', 'reaction', 'Post', $post->id);
        } else {
            $post->reactions()->create([
                'user_id' => $user->id,
                'type'    => 'like',
            ]);
            $liked = true;
            $this->logActivity('liked', 'reaction', 'Post', $post->id);
        }

        $count = $post->reactions()->where('type', 'like')->count();

        return response()->json([
            'liked' => $liked,
            'count' => $count,
        ]);
    }
}

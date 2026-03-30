<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Fetch top-level comments for a post (with replies eager-loaded).
     */
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with([
                'user:id,name,username,profile_picture',
                'replies.user:id,name,username,profile_picture',
            ])
            ->whereNull('parent_id')
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    /**
     * Store a new comment or reply.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        $authUser = Auth::user();
        $postOwner = $post->user;

        // Block check: neither party can comment on the other's posts
        if ($postOwner && $postOwner->id !== $authUser->id) {
            $isBlockedByOwner = $postOwner->blockedUsers()
                ->where('blocked_user_id', $authUser->id)->exists();
            $hasBlockedOwner  = $authUser->blockedUsers()
                ->where('blocked_user_id', $postOwner->id)->exists();

            if ($isBlockedByOwner || $hasBlockedOwner) {
                return response()->json(['message' => 'You cannot comment on this post.'], 403);
            }
        }

        $validated = $request->validate([
            'content'   => 'required|string|max:1000',
            'parent_id' => 'nullable|integer|exists:comments,id',
        ]);

        $comment = $post->comments()->create([
            'user_id'   => $authUser->id,
            'content'   => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $comment->load('user:id,name,username,profile_picture');

        return response()->json($comment, 201);
    }

    /**
     * Delete a comment (owner or admin only).
     */
    public function destroy(Comment $comment): JsonResponse
    {
        $user = Auth::user();

        if ($comment->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}

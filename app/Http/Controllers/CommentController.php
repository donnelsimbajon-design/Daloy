<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Mention;
use App\Models\Ripple;
use App\Models\User;
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
        $user = Auth::user();
        abort_unless($post->isVisibleTo($user), 404);

        // Get IDs of users restricted by the post author
        $restrictedByAuthor = [];
        if ($post->user) {
            $restrictedByAuthor = $post->user->restrictedUsers()
                ->pluck('users.id')->toArray();
        }

        $comments = $post->comments()
            ->with([
                'user:id,name,username,profile_picture',
                'replies.user:id,name,username,profile_picture',
            ])
            ->whereNull('parent_id')
            // Hide comments from users restricted by the post author
            // (unless the commenter is viewing their own comments)
            ->where(function ($q) use ($restrictedByAuthor, $user) {
                $q->whereNotIn('user_id', $restrictedByAuthor)
                  ->orWhere('user_id', $user->id);
            })
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
        abort_unless($post->isVisibleTo($authUser), 404);
        $postOwner = $post->user;

        // Block check
        if ($postOwner && $postOwner->id !== $authUser->id) {
            if ($postOwner->isBlockedWith($authUser)) {
                return response()->json(['message' => 'You cannot comment on this post.'], 403);
            }
        }

        // Comment permission check
        if ($post->comment_permission === 'nobody' && $post->user_id !== $authUser->id) {
            return response()->json(['message' => 'Comments are disabled on this post.'], 403);
        }

        if ($post->comment_permission === 'friends' && $post->user_id !== $authUser->id) {
            if (!$authUser->isFriend($postOwner)) {
                return response()->json(['message' => 'Only friends can comment on this post.'], 403);
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

        // Parse mentions in comment
        preg_match_all('/@(\w+)/', $validated['content'], $mentionMatches);
        if (!empty($mentionMatches[1])) {
            foreach ($mentionMatches[1] as $username) {
                $mentionedUser = User::where('username', $username)->first();
                if ($mentionedUser && $mentionedUser->id !== $authUser->id) {
                    Mention::create([
                        'comment_id' => $comment->id,
                        'mentioned_user_id' => $mentionedUser->id,
                    ]);

                    Ripple::create([
                        'user_id' => $mentionedUser->id,
                        'sender_id' => $authUser->id,
                        'type' => 'mention',
                        'notifiable_type' => 'App\\Models\\Comment',
                        'notifiable_id' => $comment->id,
                        'data' => [
                            'post_id' => $post->id,
                            'comment_id' => $comment->id,
                            'message' => $authUser->name . " mentioned you in a comment",
                        ],
                    ]);
                }
            }
        }

        // Ripple notification for comment
        if ($postOwner && $postOwner->id !== $authUser->id) {
            Ripple::create([
                'user_id' => $postOwner->id,
                'sender_id' => $authUser->id,
                'type' => 'comment',
                'notifiable_type' => 'App\\Models\\Post',
                'notifiable_id' => $post->id,
                'data' => [
                    'post_id' => $post->id,
                    'comment_id' => $comment->id,
                    'message' => $authUser->name . " commented on your post",
                ],
            ]);
        }

        $comment->load('user:id,name,username,profile_picture');

        return response()->json($comment, 201);
    }

    /**
     * Delete a comment (owner or admin only).
     */
    public function destroy(Comment $comment): JsonResponse
    {
        $user = Auth::user();

        // The commenter and the author of the containing post may delete comments.
        $comment->loadMissing('post');
        if ($comment->user_id !== $user->id && $comment->post?->user_id !== $user->id) {
            abort(403, 'You cannot remove this comment.');
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}

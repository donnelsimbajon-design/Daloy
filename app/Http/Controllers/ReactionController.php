<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Ripple;
use App\Traits\LogsUserActivity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    use LogsUserActivity;

    /**
     * Toggle a reaction on a post. Supports multiple reaction types:
     * wave, fire, haha, sad, wow (and legacy 'like')
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $request->validate([
            'type' => 'sometimes|string|in:wave,fire,haha,sad,wow,like',
        ]);

        $user      = Auth::user();
        $postOwner = $post->user;
        $type      = $request->input('type', 'wave');

        // Block check
        if ($postOwner && $postOwner->id !== $user->id) {
            if ($postOwner->isBlockedWith($user)) {
                return response()->json(['message' => 'You cannot react to this post.'], 403);
            }
        }

        // Check if user already has this type of reaction
        $existing = $post->reactions()
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->first();

        if ($existing) {
            // Toggle off
            $existing->delete();
            $this->logActivity('unreacted', 'reaction', 'Post', $post->id);

            return response()->json([
                'reacted' => false,
                'type' => $type,
                'reaction_counts' => $this->getReactionCounts($post),
                'user_reaction' => $this->getUserReaction($post, $user->id),
            ]);
        }

        // Remove any existing reaction of different type from this user
        $post->reactions()
            ->where('user_id', $user->id)
            ->delete();

        // Create new reaction
        $post->reactions()->create([
            'user_id' => $user->id,
            'type'    => $type,
        ]);

        $this->logActivity('reacted', 'reaction', 'Post', $post->id);

        // Send Ripple notification to post owner
        if ($postOwner && $postOwner->id !== $user->id) {
            Ripple::create([
                'user_id' => $postOwner->id,
                'sender_id' => $user->id,
                'type' => 'reaction',
                'notifiable_type' => 'App\\Models\\Post',
                'notifiable_id' => $post->id,
                'data' => [
                    'reaction_type' => $type,
                    'post_id' => $post->id,
                    'message' => "{$user->name} reacted to your post",
                ],
            ]);
        }

        return response()->json([
            'reacted' => true,
            'type' => $type,
            'reaction_counts' => $this->getReactionCounts($post),
            'user_reaction' => $this->getUserReaction($post, $user->id),
        ]);
    }

    private function getReactionCounts(Post $post): array
    {
        $counts = $post->reactions()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $total = array_sum($counts);

        return [
            'wave' => $counts['wave'] ?? 0,
            'fire' => $counts['fire'] ?? 0,
            'haha' => $counts['haha'] ?? 0,
            'sad' => $counts['sad'] ?? 0,
            'wow' => $counts['wow'] ?? 0,
            'total' => $total,
        ];
    }

    private function getUserReaction(Post $post, int $userId): ?string
    {
        $reaction = $post->reactions()
            ->where('user_id', $userId)
            ->first();

        return $reaction ? $reaction->type : null;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    /**
     * Toggle like on a post. Returns updated liked state + count.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user = Auth::user();

        $existing = $post->reactions()
            ->where('user_id', $user->id)
            ->where('type', 'like')
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            $post->reactions()->create([
                'user_id' => $user->id,
                'type' => 'like',
            ]);
            $liked = true;
        }

        $count = $post->reactions()->where('type', 'like')->count();

        return response()->json([
            'liked'  => $liked,
            'count'  => $count,
        ]);
    }
}

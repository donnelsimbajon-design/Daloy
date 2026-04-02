<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InterestTag;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CloseFriendController extends Controller
{
    /**
     * Get close friends list.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $closeFriends = $user->closeFriends()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->get();

        return response()->json($closeFriends);
    }

    /**
     * Add a friend to close friends.
     */
    public function add(Request $request): JsonResponse
    {
        $request->validate(['friend_id' => 'required|exists:users,id']);

        $user = Auth::user();
        $friendId = $request->friend_id;

        // Must be friends first
        if (!$user->isFriend(User::find($friendId))) {
            return response()->json(['message' => 'You must be friends first.'], 422);
        }

        $user->closeFriends()->syncWithoutDetaching([$friendId]);

        return response()->json(['added' => true]);
    }

    /**
     * Remove a friend from close friends.
     */
    public function remove(Request $request): JsonResponse
    {
        $request->validate(['friend_id' => 'required|exists:users,id']);

        Auth::user()->closeFriends()->detach($request->friend_id);

        return response()->json(['removed' => true]);
    }
}

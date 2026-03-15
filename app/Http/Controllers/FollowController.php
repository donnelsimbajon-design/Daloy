<?php

namespace App\Http\Controllers;

use App\Models\FollowRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FollowController extends Controller
{
    public function follow(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $targetUser = User::find($request->user_id);
        $currentUser = Auth::user();

        if ($currentUser->id === $targetUser->id) {
            return response()->json(['message' => 'Cannot follow yourself.'], 400);
        }

        if ($currentUser->isFollowing($targetUser)) {
            return response()->json(['message' => 'Already following.'], 400);
        }

        if ($targetUser->privacy_setting === 'private') {
            // Check if request already exists
            $existingRequest = FollowRequest::where('follower_id', $currentUser->id)
                ->where('following_id', $targetUser->id)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json(['message' => 'Follow request already sent.']);
            }

            FollowRequest::create([
                'follower_id' => $currentUser->id,
                'following_id' => $targetUser->id,
                'status' => 'pending'
            ]);

            return response()->json(['message' => 'Follow request sent.']);
        } else {
            // Public account, follow immediately
            $currentUser->following()->attach($targetUser->id);
            return response()->json(['message' => 'Followed successfully.']);
        }
    }

    public function unfollow(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        Auth::user()->following()->detach($request->user_id);
        
        // Also remove pending request if any
        FollowRequest::where('follower_id', Auth::id())
            ->where('following_id', $request->user_id)
            ->where('status', 'pending')
            ->delete();

        return response()->json(['message' => 'Unfollowed successfully.']);
    }

    public function acceptRequest(Request $request)
    {
        $request->validate(['request_id' => 'required|exists:follow_requests,id']);
        $followRequest = FollowRequest::find($request->request_id);

        if ($followRequest->following_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $followRequest->update(['status' => 'accepted']);
        
        // Create follow relationship
        // The FOLLOWER is following ME (Auth::user)
        // So: User(follower_id)->following()->attach(Auth::id())
        User::find($followRequest->follower_id)->following()->attach(Auth::id());

        return response()->json(['message' => 'Follow request accepted.']);
    }

    public function rejectRequest(Request $request)
    {
        $request->validate(['request_id' => 'required|exists:follow_requests,id']);
        $followRequest = FollowRequest::find($request->request_id);

        if ($followRequest->following_id !== Auth::id()) {
             return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $followRequest->status = 'rejected';
        $followRequest->save();

        return response()->json(['message' => 'Follow request rejected.']);
    }
}

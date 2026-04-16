<?php

namespace App\Http\Controllers;

use App\Models\FollowRequest;
use App\Models\User;
use App\Traits\LogsUserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FollowController extends Controller
{
    use LogsUserActivity;
    public function follow(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $targetUser  = User::find($request->user_id);
        $currentUser = Auth::user();

        if ($currentUser->id === $targetUser->id) {
            return response()->json(['message' => 'Cannot follow yourself.'], 400);
        }

        // Block check: neither party can follow the other if blocked
        $isBlockedByTarget = $targetUser->blockedUsers()
            ->where('blocked_user_id', $currentUser->id)->exists();
        $hasBlockedTarget  = $currentUser->blockedUsers()
            ->where('blocked_user_id', $targetUser->id)->exists();

        if ($isBlockedByTarget || $hasBlockedTarget) {
            return response()->json(['message' => 'You cannot follow this user.'], 403);
        }

        // 48h cooldown after unblocking
        $recentUnblock = \Illuminate\Support\Facades\DB::table('blocked_users')
            ->where(function ($q) use ($currentUser, $targetUser) {
                $q->where('user_id', $currentUser->id)->where('blocked_user_id', $targetUser->id);
            })
            ->orWhere(function ($q) use ($currentUser, $targetUser) {
                $q->where('user_id', $targetUser->id)->where('blocked_user_id', $currentUser->id);
            })
            ->whereNotNull('unblocked_at')
            ->where('unblocked_at', '>=', now()->subHours(48))
            ->exists();

        if ($recentUnblock) {
            return response()->json([
                'message' => 'You cannot follow this person yet. Please wait 48 hours after unblocking.',
            ], 403);
        }

        if ($currentUser->isFollowing($targetUser)) {
            // Bust cache just in case we hit out-of-sync state
            \Illuminate\Support\Facades\Cache::forget("reef:suggested_friends:{$currentUser->id}");
            return response()->json(['message' => 'Already following.']);
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

            $followReq = FollowRequest::create([
                'follower_id'  => $currentUser->id,
                'following_id' => $targetUser->id,
                'status'       => 'pending'
            ]);

            \App\Models\Ripple::create([
                'user_id' => $targetUser->id,
                'sender_id' => $currentUser->id,
                'type' => 'follow_request',
                'notifiable_type' => 'App\\Models\\FollowRequest',
                'notifiable_id' => $followReq->id,
                'data' => [
                    'message' => "{$currentUser->name} wants to follow you",
                ]
            ]);

            \Illuminate\Support\Facades\Cache::forget("reef:suggested_friends:{$currentUser->id}");
            return response()->json(['message' => 'Follow request sent.']);
        } else {
            // Public account, follow immediately
            $currentUser->following()->attach($targetUser->id);
            $this->logActivity('followed', 'social', 'User', $targetUser->id);
            
            \App\Models\Ripple::create([
                'user_id' => $targetUser->id,
                'sender_id' => $currentUser->id,
                'type' => 'follow',
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id' => $currentUser->id,
                'data' => [
                    'message' => "{$currentUser->name} started following you",
                ]
            ]);

            \Illuminate\Support\Facades\Cache::forget("reef:suggested_friends:{$currentUser->id}");
            return response()->json(['message' => 'Followed successfully.']);
        }
    }

    public function unfollow(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        Auth::user()->following()->detach($request->user_id);
        $this->logActivity('unfollowed', 'social', 'User', $request->user_id);
        
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

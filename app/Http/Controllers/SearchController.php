<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = trim($request->input('q', ''));
        $type  = $request->input('type', 'all'); // all | friends | following

        $user = Auth::user();

        // Block filter: exclude users in any blocking relationship
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        // Base: always exclude self and blocked/blocking users
        $baseQuery = User::select(['id', 'name', 'username', 'profile_picture', 'bio', 'location', 'privacy_setting', 'background_picture'])
            ->where('id', '!=', $user->id)
            ->whereNotIn('id', $allBlockedIds);

        if ($query !== '') {
            $baseQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('username', 'like', "%{$query}%");
            });
        }

        // Apply relationship filter
        if ($type === 'friends') {
            $friendIds = $user->friends()->pluck('users.id');
            $baseQuery->whereIn('id', $friendIds);
        } elseif ($type === 'following') {
            $followingIds = $user->following()->pluck('users.id');
            $baseQuery->whereIn('id', $followingIds);
        } elseif ($type === 'suggested') {
            $friendIds = $user->friends()->pluck('users.id');
            $baseQuery->whereNotIn('id', $friendIds);
        }

        $results = $baseQuery->paginate(20);

        // Append relationship status to each result
        $results->getCollection()->transform(function ($userItem) use ($user) {
            // Follow status
            $userItem->is_following = $user->isFollowing($userItem);

            // Friend status
            $userItem->is_friend = $user->isFriend($userItem);

            $sentRequest = $user->sentFriendRequests()
                ->where('receiver_id', $userItem->id)
                ->whereIn('status', ['pending', 'rejected', 'cancelled'])
                ->orderByDesc('created_at')
                ->first();

            $receivedRequest = $user->receivedFriendRequests()
                ->where('sender_id', $userItem->id)
                ->where('status', 'pending')
                ->first();

            if ($userItem->is_friend) {
                $userItem->friendship_status = 'friends';
            } elseif ($sentRequest && $sentRequest->status === 'pending') {
                $userItem->friendship_status = 'sent';
                $userItem->friend_request_id = $sentRequest->id;
            } elseif ($receivedRequest) {
                $userItem->friendship_status = 'received';
                $userItem->friend_request_id = $receivedRequest->id;
            } else {
                $userItem->friendship_status = 'none';
            }

            // Follow request status
            $sentFollow = $user->sentFollowRequests()
                ->where('following_id', $userItem->id)
                ->where('status', 'pending')
                ->exists();
            $userItem->follow_request_sent = $sentFollow;

            return $userItem;
        });

        return response()->json($results);
    }
}

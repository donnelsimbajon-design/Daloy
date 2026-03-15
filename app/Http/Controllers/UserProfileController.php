<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    public function show(User $user)
    {
        $authUser = Auth::user();

        // Determine relationship status
        $isSelf     = $authUser->id === $user->id;
        $isFriend   = !$isSelf && $authUser->isFriend($user);
        $isFollowing = !$isSelf && $authUser->isFollowing($user);
        $isBlocked  = !$isSelf && $authUser->blockedUsers()->where('blocked_user_id', $user->id)->exists();
        $isBlockedBy = !$isSelf && $user->blockedUsers()->where('blocked_user_id', $authUser->id)->exists();

        // If blocked by this user, show restricted view
        if ($isBlockedBy) {
            return Inertia::render('UserProfile', [
                'profileUser' => $user->only(['id', 'name', 'username', 'profile_picture']),
                'isSelf' => false, 'isFollowing' => false, 'followRequestSent' => false,
                'friendshipStatus' => 'none', 'friendRequestId' => null,
                'canViewProfile' => false, 'isBlocked' => false, 'isBlockedBy' => true,
                'posts' => [], 'friends' => [],
            ]);
        }

        $sentFriendRequest    = null;
        $receivedFriendRequest = null;

        if (!$isSelf) {
            $sentFriendRequest = $authUser->sentFriendRequests()
                ->where('receiver_id', $user->id)
                ->where('status', 'pending')
                ->first();

            $receivedFriendRequest = $authUser->receivedFriendRequests()
                ->where('sender_id', $user->id)
                ->where('status', 'pending')
                ->first();
        }

        $friendshipStatus = 'none';
        $friendRequestId  = null;

        if ($isFriend) {
            $friendshipStatus = 'friends';
        } elseif ($sentFriendRequest) {
            $friendshipStatus = 'sent';
            $friendRequestId  = $sentFriendRequest->id;
        } elseif ($receivedFriendRequest) {
            $friendshipStatus = 'received';
            $friendRequestId  = $receivedFriendRequest->id;
        }

        // Determine if private account is viewable
        $canViewProfile = $user->privacy_setting !== 'private'
            || $isSelf
            || $isFriend;

        // Counts
        $friendCount    = $user->friends()->count();
        $followerCount  = $user->followers()->count();
        $followingCount = $user->following()->count();
        $postCount      = $user->posts()->count();

        // Posts visible only if profile is viewable
        $posts = [];
        if ($canViewProfile) {
            $posts = $user->posts()
                ->with(['user', 'media', 'reactions'])
                ->withCount('reactions', 'comments')
                ->latest()
                ->take(20)
                ->get()
                ->map(function ($post) use ($authUser) {
                    $post->liked_by_user = $post->reactions
                        ->where('user_id', $authUser->id)
                        ->isNotEmpty();
                    return $post;
                });
        }

        // Friends preview (up to 9 for sidebar grid)
        $friends = $user->friends()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->limit(9)
            ->get();

        return Inertia::render('UserProfile', [
            'profileUser' => array_merge($user->only([
                'id', 'name', 'username', 'bio', 'about', 'profile_picture',
                'background_picture', 'location', 'privacy_setting', 'created_at',
            ]), [
                'friend_count'    => $friendCount,
                'follower_count'  => $followerCount,
                'following_count' => $followingCount,
                'post_count'      => $postCount,
            ]),
            'isSelf'           => $isSelf,
            'isFollowing'      => $isFollowing,
            'followRequestSent' => $authUser->sentFollowRequests()
                ->where('following_id', $user->id)
                ->where('status', 'pending')
                ->exists(),
            'friendshipStatus' => $friendshipStatus,
            'friendRequestId'  => $friendRequestId,
            'canViewProfile'   => $canViewProfile,
            'isBlocked'        => $isBlocked,
            'isBlockedBy'      => false,
            'posts'            => $posts,
            'friends'          => $friends,
        ]);
    }

    /**
     * Block a user.
     */
    public function block(User $user)
    {
        $authUser = Auth::user();

        if ($authUser->id === $user->id) {
            return back()->with('error', 'You cannot block yourself.');
        }

        // Block the user
        $authUser->blockedUsers()->syncWithoutDetaching([$user->id]);

        // Remove friendship if exists
        $authUser->friends()->detach($user->id);
        $user->friends()->detach($authUser->id);

        // Remove follow relationships
        $authUser->following()->detach($user->id);
        $authUser->followers()->detach($user->id);
        $user->following()->detach($authUser->id);
        $user->followers()->detach($authUser->id);

        // Cancel pending requests
        $authUser->sentFriendRequests()->where('receiver_id', $user->id)->delete();
        $authUser->receivedFriendRequests()->where('sender_id', $user->id)->delete();
        $authUser->sentFollowRequests()->where('following_id', $user->id)->delete();
        $authUser->receivedFollowRequests()->where('follower_id', $user->id)->delete();

        return back()->with('status', 'user-blocked');
    }

    /**
     * Unblock a user.
     */
    public function unblock(User $user)
    {
        Auth::user()->blockedUsers()->detach($user->id);

        return back()->with('status', 'user-unblocked');
    }
}

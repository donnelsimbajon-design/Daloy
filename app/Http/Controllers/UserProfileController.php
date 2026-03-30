<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BlockedUser;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        // Groups/Schools joined
        $schools = $user->schools()
            ->withCount('members')
            ->withPivot('role')
            ->limit(6)
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
            // Hide friends/schools list from blocked viewers
            'posts'            => $posts,
            'friends'          => $isBlocked ? [] : $friends,
            'schools'          => $isBlocked ? [] : $schools,
        ]);
    }

    /**
     * Block a user — mutual, complete, and silent.
     */
    public function block(User $user)
    {
        $authUser = Auth::user();

        if ($authUser->id === $user->id) {
            return back()->with('error', 'You cannot block yourself.');
        }

        DB::transaction(function () use ($authUser, $user) {
            // Block the user (idempotent)
            $authUser->blockedUsers()->syncWithoutDetaching([$user->id]);

            // Remove friendship in both directions
            $authUser->friends()->detach($user->id);
            $user->friends()->detach($authUser->id);

            // Remove all follow relationships
            $authUser->following()->detach($user->id);
            $authUser->followers()->detach($user->id);
            $user->following()->detach($authUser->id);
            $user->followers()->detach($authUser->id);

            // Cancel pending friend & follow requests (both directions)
            $authUser->sentFriendRequests()->where('receiver_id', $user->id)->delete();
            $authUser->receivedFriendRequests()->where('sender_id', $user->id)->delete();
            $authUser->sentFollowRequests()->where('following_id', $user->id)->delete();
            $authUser->receivedFollowRequests()->where('follower_id', $user->id)->delete();

            // Private confirmation notification for the BLOCKER only
            // The blocked user is NEVER notified — block is silent
            if (class_exists('App\\Models\\Notification')) {
                \App\Models\Notification::create([
                    'user_id'  => $authUser->id,
                    'type'     => 'block_confirmation',
                    'data'     => json_encode([
                        'message' => 'You have blocked this user. They can no longer interact with you.',
                    ]),
                    'read_at'  => null,
                ]);
            }
        });

        return back()->with('status', 'user-blocked');
    }

    /**
     * Unblock a user — records unblocked_at for 48h cooldown enforcement.
     */
    public function unblock(User $user)
    {
        $authUser = Auth::user();

        // Record unblocked_at so we can enforce the 48h cooldown
        DB::table('blocked_users')
            ->where('user_id', $authUser->id)
            ->where('blocked_user_id', $user->id)
            ->update(['unblocked_at' => now()]);

        // Wait until cooldown passes, then actually remove the row
        // For now we remove immediately but keep unblocked_at for downstream checks
        $authUser->blockedUsers()->detach($user->id);

        // Re-insert as a cooldown-only record so we can check 48h window
        DB::table('blocked_users')->insert([
            'user_id'         => $authUser->id,
            'blocked_user_id' => $user->id,
            'created_at'      => now(),
            'updated_at'      => now(),
            'unblocked_at'    => now(),
        ]);

        return back()->with('status', 'user-unblocked');
    }
}

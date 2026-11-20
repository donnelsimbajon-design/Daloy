<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\BlockedUser;
use App\Models\ProfileVisit;
use App\Models\Ripple;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
        $isRestricted = !$isSelf && $authUser->hasRestricted($user);
        $isCloseFriend = !$isSelf && $authUser->isCloseFriend($user);

        // If blocked by this user, show restricted view
        if ($isBlockedBy) {
            return Inertia::render('UserProfile', [
                'profileUser' => $user->only(['id', 'name', 'username', 'profile_picture']),
                'isSelf' => false, 'isFollowing' => false, 'followRequestSent' => false,
                'friendshipStatus' => 'none', 'friendRequestId' => null,
                'canViewProfile' => false, 'isBlocked' => false, 'isBlockedBy' => true,
                'isRestricted' => false, 'isCloseFriend' => false,
                'posts' => [], 'friends' => [], 'schools' => [],
                'mutualFriends' => [], 'mutualFriendsCount' => 0,
                'badges' => [], 'profileCompletion' => null,
                'profileVisitsThisWeek' => 0, 'featuredPost' => null,
                'tideScore' => 0, 'activityStatus' => 'hidden',
            ]);
        }

        // Record profile visit
        if (!$isSelf) {
            ProfileVisit::create([
                'visited_user_id' => $user->id,
                'visitor_user_id' => $authUser->id,
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

        $canViewProfile = $user->privacy_setting !== 'private'
            || $isSelf
            || $isFriend;

        // Counts
        $friendCount    = $user->friends()->count();
        $followerCount  = $user->followers()->count();
        $followingCount = $user->following()->count();
        $postCount      = $user->posts()->count();

        // A public profile is not permission to view every post on it.
        // Filter the SQL query before serializing post contents to Inertia.
        $posts = [];
        if ($canViewProfile) {
            $postsQuery = $user->posts();
            if (!$isSelf) {
                $allowedVisibilities = ['public'];
                if ($isFollowing || $isFriend) {
                    $allowedVisibilities[] = 'followers';
                    $allowedVisibilities[] = 'friends';
                }
                if ($isCloseFriend) {
                    $allowedVisibilities[] = 'close_friends';
                }
                $joinedSchoolIds = $authUser->schools()->pluck('schools.id')->toArray();
                $postsQuery->where(function ($query) use ($allowedVisibilities, $joinedSchoolIds) {
                    $query->whereIn('visibility', $allowedVisibilities);
                    if (!empty($joinedSchoolIds)) {
                        $query->orWhereIn('school_id', $joinedSchoolIds);
                    }
                });
            }
            $posts = $postsQuery
                ->with(['user', 'media', 'reactions', 'poll.options', 'repostOf.user:id,name,username,profile_picture', 'repostOf.media'])
                ->withCount(['reactions', 'comments', 'reposts'])
                ->withExists(['reposts as is_reposted' => fn ($query) => $query->where('user_id', $authUser->id)])
                ->orderByDesc('is_pinned')
                ->latest()
                ->take(50)
                ->get()
                ->filter(fn($post) => $post->isVisibleTo($authUser))
                ->take(20)
                ->values()
                ->map(function ($post) use ($authUser) {
                    if ($post->repostOf && ($post->repostOf->visibility !== 'public'
                        || $post->repostOf->school_id || !$post->repostOf->isVisibleTo($authUser))) {
                        $post->unsetRelation('repostOf');
                    }
                    $userReaction = $post->reactions->where('user_id', $authUser->id)->first();
                    $post->user_reaction = $userReaction ? $userReaction->type : null;
                    $post->liked_by_user = $userReaction !== null;
                    $post->reaction_counts = $post->reactions
                        ->groupBy('type')
                        ->map->count()
                        ->toArray();
                    $post->is_bookmarked = $post->bookmarks()->where('user_id', $authUser->id)->exists();

                    // Poll — serialize as plain array
                    if ($post->poll) {
                        $vote = $post->poll->votes()->where('user_id', $authUser->id)->first();
                        $totalVotes = $post->poll->options->sum('votes_count');
                        $post->poll = [
                            'id'                   => $post->poll->id,
                            'question'             => $post->poll->question,
                            'expires_at'           => $post->poll->expires_at,
                            'user_voted'           => $vote !== null,
                            'user_voted_option_id' => $vote?->option_id,
                            'total_votes'          => $totalVotes,
                            'options'              => $post->poll->options->map(function ($opt) use ($totalVotes) {
                                return [
                                    'id'          => $opt->id,
                                    'label'       => $opt->label,
                                    'votes_count' => $opt->votes_count,
                                    'percentage'  => $totalVotes > 0 ? round(($opt->votes_count / $totalVotes) * 100) : 0,
                                ];
                            })->values()->all(),
                        ];
                    }

                    return $post;
                });
        }

        // Mutual friends
        $mutualFriends = [];
        $mutualFriendsCount = 0;
        if (!$isSelf) {
            $authFriendIds = $authUser->friends()->pluck('users.id');
            $profileFriendIds = $user->friends()->pluck('users.id');
            $mutualIds = $authFriendIds->intersect($profileFriendIds);
            $mutualFriendsCount = $mutualIds->count();
            $mutualFriends = User::whereIn('id', $mutualIds->take(3))
                ->select('id', 'name', 'username', 'profile_picture')
                ->get();
        }

        // Friends preview
        $friends = $user->friends()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->limit(9)
            ->get();

        // Schools joined
        $schools = $user->schools()
            ->withCount('members')
            ->withPivot('role')
            ->limit(6)
            ->get();

        // Badges
        $badges = $user->badges()->get();

        // Profile completion (own profile only)
        $profileCompletion = $isSelf ? $user->getProfileCompletionScore() : null;

        // Profile visits this week (own profile only)
        $profileVisitsThisWeek = 0;
        if ($isSelf) {
            $profileVisitsThisWeek = ProfileVisit::where('visited_user_id', $user->id)
                ->where('visited_at', '>=', now()->subWeek())
                ->count();
        }

        // Featured post
        $featuredPost = null;
        if ($user->featured_post_id) {
            $featuredPost = Post::with(['user', 'media'])
                ->withCount('reactions', 'comments')
                ->find($user->featured_post_id);
            // Pinned/featured content must pass the same audience policy as the
            // regular profile feed (including private-school membership).
            if ($featuredPost && ($featuredPost->user_id !== $user->id ||
                !$featuredPost->isVisibleTo($authUser))) {
                $featuredPost = null;
            }
        }

        // Tide Score
        $tideScore = $user->tideScore?->score ?? 0;

        // Activity Status
        $activityStatus = 'hidden';
        if ($user->show_activity_status && ($isSelf || !$isBlocked)) {
            $activityStatus = $user->getActivityStatus();
        }

        // Interest tags
        $userInterests = $user->interestTags()->get();

        // Check if user has an active story viewable by auth user
        $hasActiveStory = false;
        if (!$isBlocked) {
            $hasActiveStory = \App\Models\Story::where('user_id', $user->id)
                ->where('expires_at', '>', now())
                ->whereNull('archived_at')
                ->where(function ($query) use ($isSelf, $isFriend, $isCloseFriend) {
                    $query->where('visibility', 'public');
                    if ($isSelf) {
                        $query->orWhereIn('visibility', ['friends', 'private', 'close_friends']);
                    } else {
                        if ($isFriend) {
                            $query->orWhere('visibility', 'friends');
                        }
                        if ($isCloseFriend) {
                            $query->orWhere('visibility', 'close_friends');
                        }
                    }
                })
                ->exists();
        }

        return Inertia::render('UserProfile', [
            'profileUser' => array_merge($user->only([
                'id', 'name', 'username', 'bio', 'about', 'profile_picture',
                'background_picture', 'location', 'privacy_setting', 'created_at',
                'pronouns', 'profile_accent',
            ]), [
                'friend_count'    => $friendCount,
                'follower_count'  => $followerCount,
                'following_count' => $followingCount,
                'post_count'      => $postCount,
                'has_active_story'=> $hasActiveStory,
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
            'isRestricted'     => $isRestricted,
            'isCloseFriend'    => $isCloseFriend,
            'posts'            => $posts,
            'friends'          => $isBlocked ? [] : $friends,
            'schools'          => $isBlocked ? [] : $schools,
            'mutualFriends'    => $mutualFriends,
            'mutualFriendsCount' => $mutualFriendsCount,
            'badges'           => $badges,
            'profileCompletion' => $profileCompletion,
            'profileVisitsThisWeek' => $profileVisitsThisWeek,
            'featuredPost'     => $featuredPost,
            'tideScore'        => $tideScore,
            'activityStatus'   => $activityStatus,
            'userInterests'    => $userInterests,
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

        DB::transaction(function () use ($authUser, $user) {
            $authUser->blockedUsers()->syncWithoutDetaching([$user->id]);
            $authUser->friends()->detach($user->id);
            $user->friends()->detach($authUser->id);
            $authUser->following()->detach($user->id);
            $authUser->followers()->detach($user->id);
            $user->following()->detach($authUser->id);
            $user->followers()->detach($authUser->id);
            $authUser->sentFriendRequests()->where('receiver_id', $user->id)->delete();
            $authUser->receivedFriendRequests()->where('sender_id', $user->id)->delete();
            $authUser->sentFollowRequests()->where('following_id', $user->id)->delete();
            $authUser->receivedFollowRequests()->where('follower_id', $user->id)->delete();
            // Also remove close friends
            $authUser->closeFriends()->detach($user->id);
            $user->closeFriends()->detach($authUser->id);
        });

        return back()->with('status', 'user-blocked');
    }

    /**
     * Unblock a user.
     */
    public function unblock(User $user)
    {
        $authUser = Auth::user();

        DB::table('blocked_users')
            ->where('user_id', $authUser->id)
            ->where('blocked_user_id', $user->id)
            ->update(['unblocked_at' => now()]);

        $authUser->blockedUsers()->detach($user->id);

        DB::table('blocked_users')->insert([
            'user_id' => $authUser->id,
            'blocked_user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
            'unblocked_at' => now(),
        ]);

        return back()->with('status', 'user-unblocked');
    }

    /**
     * Restrict a user.
     */
    public function restrict(User $user): JsonResponse
    {
        $authUser = Auth::user();

        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'You cannot restrict yourself.'], 422);
        }

        $authUser->restrictedUsers()->syncWithoutDetaching([$user->id]);

        return response()->json(['restricted' => true]);
    }

    /**
     * Unrestrict a user.
     */
    public function unrestrict(User $user): JsonResponse
    {
        Auth::user()->restrictedUsers()->detach($user->id);

        return response()->json(['unrestricted' => true]);
    }
}

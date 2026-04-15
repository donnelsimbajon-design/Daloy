<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\FriendRequest;
use App\Models\FollowRequest;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            // ── Always loaded (cheap, no DB queries) ──
            'auth' => [
                'user' => $user ? $user->only([
                    'id', 'name', 'username', 'email', 'profile_picture', 'background_picture',
                    'bio', 'location', 'privacy_setting', 'created_at',
                    'font_size', 'reduce_motion', 'high_contrast', 'notification_preferences', 'dark_mode',
                    'pronouns', 'show_activity_status', 'profile_accent', 'notifications_snoozed_until',
                ]) : null,
            ],
            'status' => session('status'),

            // ── Deferred: only resolved when the frontend reads these props ──
            'social' => $user ? fn () => [
                'unread_messages'        => $this->getUnreadMessageCount($user),
                'unread_notifications'   => $this->getUnreadNotificationCount($user),
                'pending_friend_requests' => $user->receivedFriendRequests()
                    ->where('status', 'pending')->count(),
                'pending_follow_requests' => $user->receivedFollowRequests()
                    ->where('status', 'pending')->count(),
                'recent_conversations'   => $this->getRecentConversations($user),
                'recent_notifications'   => $this->getRecentNotifications($user),
            ] : null,

            'announcements' => fn () => \App\Services\AnnouncementService::getActiveForUser(),

            'reef' => fn () => [
                'trending_hashtags' => \App\Services\ReefPanelService::getTrendingHashtags(),
                'popular_today'     => \App\Services\ReefPanelService::getPopularToday(),
                'suggested_groups'  => \App\Services\ReefPanelService::getSuggestedGroups($user?->id),
                'suggested_friends' => \App\Services\ReefPanelService::getSuggestedFriends($user?->id),
                'my_groups'         => \App\Services\ReefPanelService::getMyGroups($user?->id),
            ],

            'admin_context' => $user && $user->isAdmin() ? fn () => $this->getAdminContext($user) : null,
        ];
    }

    private function getAdminContext($user): array
    {
        $admin = $user->admin;
        if (!$admin) return [];

        $admin->load('adminRole.permissions');

        $isSuperAdmin = $admin->isSuperAdmin();
        $permissionKeys = $isSuperAdmin
            ? ['*'] // Super admin has all permissions
            : ($admin->adminRole?->permissions?->pluck('key')->toArray() ?? []);

        return [
            'role' => $admin->adminRole?->display_name ?? ucfirst($admin->role),
            'role_color' => $admin->adminRole?->color ?? '#111',
            'is_super_admin' => $isSuperAdmin,
            'permissions' => $permissionKeys,
        ];
    }

    private function getUnreadNotificationCount($user): int
    {
        return \App\Models\Ripple::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    private function getUnreadMessageCount($user): int
    {
        return Message::whereHas('conversation', function ($q) use ($user) {
            $q->whereHas('participants', fn($p) => $p->where('user_id', $user->id));
        })
        ->where('user_id', '!=', $user->id)
        ->whereNull('read_at')
        ->count();
    }

    private function getRecentConversations($user): array
    {
        $conversations = $user->conversations()
            ->with(['participants:id,name,username,profile_picture', 'latestMessage.user:id,name'])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest()
                    ->take(1)
            )
            ->take(5)
            ->get();

        return $conversations->map(function ($convo) use ($user) {
            $otherParticipants = $convo->participants->where('id', '!=', $user->id);
            $other = $otherParticipants->first();
            $latestMsg = $convo->latestMessage;

            // Count unread for this conversation
            $unread = $convo->messages()
                ->where('user_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count() > 0;

            $isGroup = $convo->type === 'group';

            return [
                'id'        => $convo->id,
                'type'      => $convo->type,
                'user_id'   => $isGroup ? null : $other?->id,
                'name'      => $isGroup ? ($convo->name ?? 'Group Chat') : ($other?->name ?? 'Unknown'),
                'username'  => $isGroup ? '' : ($other?->username ?? ''),
                'avatar'    => $isGroup ? $convo->avatar_url : ($other?->profile_picture ?? null),
                'initial'   => strtoupper(substr($isGroup ? ($convo->name ?? 'Group Chat') : ($other?->name ?? '?'), 0, 1)),
                'message'   => $latestMsg?->content ?? 'No messages yet',
                'time'      => $latestMsg ? $latestMsg->created_at->diffForHumans(null, true) . ' ago' : '',
                'unread'    => $unread,
            ];
        })->toArray();
    }

    private function getRecentNotifications($user): array
    {
        $notifications = [];

        // Pending friend requests received
        $friendRequests = FriendRequest::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with('sender:id,name,username,profile_picture')
            ->latest()
            ->take(5)
            ->get();

        foreach ($friendRequests as $fr) {
            $notifications[] = [
                'id'       => 'fr_' . $fr->id,
                'user_id'  => $fr->sender_id,
                'user'     => $fr->sender->name ?? 'Unknown',
                'avatar'   => $fr->sender->profile_picture ?? null,
                'action'   => 'sent you a friend request',
                'type'     => 'friend',
                'is_unread'=> true,
                'time'     => $fr->created_at->diffForHumans(null, true) . ' ago',
                'raw_time' => $fr->created_at,
            ];
        }

        // Pending follow requests received
        $followRequests = FollowRequest::where('following_id', $user->id)
            ->where('status', 'pending')
            ->with('follower:id,name,username,profile_picture')
            ->latest()
            ->take(5)
            ->get();

        foreach ($followRequests as $flr) {
            $notifications[] = [
                'id'       => 'flr_' . $flr->id,
                'user_id'  => $flr->follower_id,
                'user'     => $flr->follower->name ?? 'Unknown',
                'avatar'   => $flr->follower->profile_picture ?? null,
                'action'   => 'wants to follow you',
                'type'     => 'follow',
                'is_unread'=> true,
                'time'     => $flr->created_at->diffForHumans(null, true) . ' ago',
                'raw_time' => $flr->created_at,
            ];
        }

        // Recent Ripples (likes, comments, group_deleted, etc.)
        $ripples = \App\Models\Ripple::where('user_id', $user->id)
            ->with('sender:id,name,username,profile_picture')
            ->latest()
            ->take(10)
            ->get();

        $typeActions = [
            'like'          => 'liked your post',
            'comment'       => 'commented on your post',
            'mention'       => 'mentioned you',
            'follow'        => 'started following you',
            'group_deleted' => 'A school you were in was removed',
            'reaction'      => 'reacted to your post',
            'story_like'    => 'liked your story',
            'story_reply'   => 'replied to your story',
        ];

        foreach ($ripples as $r) {
            $action = $typeActions[$r->type] ?? $r->type;
            // For group_deleted, use data for the message
            if ($r->type === 'group_deleted' && isset($r->data['group_name'])) {
                $action = "School \"{$r->data['group_name']}\" was removed by an admin";
            }

            $notifications[] = [
                'id'       => 'rpl_' . $r->id,
                'user_id'  => $r->sender_id,
                'user'     => $r->sender->name ?? 'System',
                'avatar'   => $r->sender->profile_picture ?? null,
                'action'   => $action,
                'type'     => $r->type,
                'data'     => $r->data,
                'is_unread'=> null === $r->read_at,
                'time'     => $r->created_at->diffForHumans(null, true) . ' ago',
                'raw_time' => $r->created_at,
            ];
        }

        // Sort by time (most recent first) and limit
        usort($notifications, fn($a, $b) => $b['raw_time'] <=> $a['raw_time']);

        // Remove raw_time from output
        return array_map(function ($n) {
            unset($n['raw_time']);
            return $n;
        }, array_slice($notifications, 0, 10));
    }
}


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
            'auth' => [
                'user' => $user ? $user->only([
                    'id', 'name', 'username', 'email', 'profile_picture', 'background_picture',
                    'bio', 'location', 'privacy_setting', 'created_at',
                    'font_size', 'reduce_motion', 'high_contrast', 'notification_preferences', 'dark_mode',
                    'pronouns', 'show_activity_status', 'profile_accent', 'notifications_snoozed_until',
                ]) : null,
            ],
            'status' => session('status'),
            'social' => $user ? [
                'unread_messages'        => $this->getUnreadMessageCount($user),
                'pending_friend_requests' => $user->receivedFriendRequests()
                    ->where('status', 'pending')->count(),
                'pending_follow_requests' => $user->receivedFollowRequests()
                    ->where('status', 'pending')->count(),
                'recent_conversations'   => $this->getRecentConversations($user),
                'recent_notifications'   => $this->getRecentNotifications($user),
            ] : null,
        ];
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

            return [
                'id'        => $convo->id,
                'name'      => $other?->name ?? 'Unknown',
                'username'  => $other?->username ?? '',
                'avatar'    => $other?->profile_picture ?? null,
                'initial'   => strtoupper(substr($other?->name ?? '?', 0, 1)),
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
                'time'     => $flr->created_at->diffForHumans(null, true) . ' ago',
                'raw_time' => $flr->created_at,
            ];
        }

        // Sort by time (most recent first) and limit
        usort($notifications, fn($a, $b) => $b['raw_time'] <=> $a['raw_time']);

        // Remove raw_time from output
        return array_map(function ($n) {
            unset($n['raw_time']);
            return $n;
        }, array_slice($notifications, 0, 8));
    }
}


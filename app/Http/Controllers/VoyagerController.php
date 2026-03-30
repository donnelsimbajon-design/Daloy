<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VoyagerController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $tab = $request->query('tab', 'suggested');

        // Build block exclusion list (users I blocked OR who blocked me)
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        // Pending friend requests received — HIDE senders who are blocked
        $pendingRequests = FriendRequest::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->whereNotIn('sender_id', $allBlockedIds)
            ->with('sender:id,name,username,profile_picture,bio,location')
            ->latest()
            ->get()
            ->map(function ($req) {
                $sender = $req->sender;
                $sender->friend_request_id = $req->id;
                $sender->friendship_status = 'received';
                return $sender;
            });

        // All friends (exclude blocked — shouldn't exist but belt+suspenders)
        $friends = $user->friends()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture', 'users.bio', 'users.location')
            ->whereNotIn('users.id', $allBlockedIds)
            ->get()
            ->map(function ($friend) {
                $friend->friendship_status = 'friends';
                return $friend;
            });

        // Suggested: non-friends, non-self, NOT blocked by or blocking me
        $friendIds = $user->friends()->pluck('users.id')->toArray();
        $sentIds   = $user->sentFriendRequests()->where('status', 'pending')->pluck('receiver_id')->toArray();
        $excludeIds = array_unique(array_merge([$user->id], $friendIds, $allBlockedIds));

        $suggested = User::whereNotIn('id', $excludeIds)
            ->select('id', 'name', 'username', 'profile_picture', 'bio', 'location')
            ->inRandomOrder()
            ->limit(20)
            ->get()
            ->map(function ($u) use ($sentIds) {
                $u->friendship_status = in_array($u->id, $sentIds) ? 'sent' : 'none';
                return $u;
            });

        return Inertia::render('Voyagers', [
            'tab'            => $tab,
            'pendingRequests' => $pendingRequests,
            'allFriends'     => $friends,
            'suggestedUsers' => $suggested,
            'pendingCount'   => $pendingRequests->count(),
            'friendCount'    => $friends->count(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FriendRequestController extends Controller
{
    public function index()
    {
        $friends = Auth::user()->friends()->select(['users.id', 'users.name', 'users.username', 'users.profile_picture'])->get();
        $friends->transform(function ($friend) {
            $friend->friendship_status = 'friends';
            // Also is_following check
            $friend->is_following = Auth::user()->isFollowing($friend);
            return $friend;
        });
        return response()->json($friends);
    }

    public function send(Request $request)
    {
        $request->validate(['receiver_id' => 'required|exists:users,id']);

        $receiverId = $request->receiver_id;
        $sender = Auth::user();

        if ($sender->id == $receiverId) {
            return response()->json(['message' => 'Cannot send friend request to yourself.'], 400);
        }

        if ($sender->isFriend(User::find($receiverId))) {
            return response()->json(['message' => 'You are already friends.'], 400);
        }

        $existingRequest = FriendRequest::where('sender_id', $sender->id)
            ->where('receiver_id', $receiverId)
            ->first();

        if ($existingRequest) {
            if ($existingRequest->status === 'pending') {
                 return response()->json(['message' => 'Friend request already sent.'], 400);
            }
             // Could re-open if rejected? For now just create new one or update
            if ($existingRequest->status === 'rejected' || $existingRequest->status === 'cancelled') {
                $existingRequest->update(['status' => 'pending']);
                return response()->json(['message' => 'Friend request sent successfully.', 'request' => $existingRequest]);
            }
        }
        
        // Check for reverse request
        $reverseRequest = FriendRequest::where('sender_id', $receiverId)
            ->where('receiver_id', $sender->id)
            ->where('status', 'pending')
            ->first();

        if ($reverseRequest) {
             // Implicitly accept? Or just tell them to accept
             return response()->json(['message' => 'This user has already sent you a friend request. Please accept it.'], 400);
        }

        $friendRequest = FriendRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiverId,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Friend request sent successfully.', 'request' => $friendRequest]);
    }

    public function accept(Request $request)
    {
        $request->validate(['request_id' => 'required|exists:friend_requests,id']);
        
        $friendRequest = FriendRequest::find($request->request_id);

        if ($friendRequest->receiver_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($friendRequest->status !== 'pending') {
             return response()->json(['message' => 'Request already processed.'], 400);
        }

        DB::transaction(function () use ($friendRequest) {
            $friendRequest->update(['status' => 'accepted']);

            Auth::user()->friends()->attach($friendRequest->sender_id);
            User::find($friendRequest->sender_id)->friends()->attach(Auth::id());
        });

        return response()->json(['message' => 'Friend request accepted.']);
    }

    public function reject(Request $request)
    {
        $request->validate(['request_id' => 'required|exists:friend_requests,id']);
        $friendRequest = FriendRequest::find($request->request_id);

        if ($friendRequest->receiver_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $friendRequest->update(['status' => 'rejected']);
        return response()->json(['message' => 'Friend request rejected.']);
    }

    public function cancel(Request $request)
    {
         $request->validate(['request_id' => 'required|exists:friend_requests,id']);
         $friendRequest = FriendRequest::find($request->request_id);

         if ($friendRequest->sender_id !== Auth::id()) {
             return response()->json(['message' => 'Unauthorized.'], 403);
         }

         $friendRequest->update(['status' => 'cancelled']);
         // Or delete? Prompt says "Cancel pending requests", usually delete or update status.
         // Usually delete is cleaner to allow re-send easily. But keeping record is good.
         // I'll delete to keep it simple as user might want to resend later without "rejected" history blocking logic above.
         // Actually prompt schema has 'cancelled' status. So I update.
         
         return response()->json(['message' => 'Friend request cancelled.']);
    }

    public function removeFriend(Request $request)
    {
        $request->validate(['friend_id' => 'required|exists:users,id']);
        $friendId = $request->friend_id;
        
        DB::transaction(function () use ($friendId) {
            Auth::user()->friends()->detach($friendId);
            User::find($friendId)->friends()->detach(Auth::id());
            
            // Also update request status? Probably not necessary but good for history.
        });

        return response()->json(['message' => 'Friend removed.']);
    }
}

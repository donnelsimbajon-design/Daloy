<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\Report;
use App\Models\Ripple;
use App\Models\TypingIndicator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessagingController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $blockedByMeIds = $user->blockedUsers()->pluck('users.id');
        $blockedMeIds   = $user->blockedBy()->pluck('users.id');
        $allBlockedIds  = $blockedByMeIds->merge($blockedMeIds)->unique()->toArray();

        // Restricted users who can't DM me
        $restrictedMeIds = $user->restrictedBy()->pluck('users.id')->toArray();

        $conversations = $user->conversations()
            ->with(['participants:id,name,username,profile_picture', 'latestMessage'])
            ->whereDoesntHave('participants', function ($q) use ($user, $allBlockedIds) {
                $q->where('user_id', '!=', $user->id)
                  ->whereIn('user_id', $allBlockedIds);
            })
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest()
                    ->take(1)
            )
            ->get();

        // Add unread count per conversation
        $conversations->transform(function ($convo) use ($user) {
            $convo->unread_count = $convo->messages()
                ->where('user_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count();
            return $convo;
        });

        return response()->json($conversations);
    }

    public function start(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $targetUserId = $request->user_id;
        $currentUser  = Auth::user();
        $targetUser   = User::find($targetUserId);

        // Block check
        if ($targetUser && $targetUser->isBlockedWith($currentUser)) {
            return response()->json(['message' => 'You cannot message this user.'], 403);
        }

        // Restricted check - restricted users cannot initiate DMs
        if ($targetUser && $targetUser->hasRestricted($currentUser)) {
            return response()->json(['message' => 'You cannot message this user.'], 403);
        }

        $conversation = Conversation::where('type', 'direct')
            ->whereHas('participants', fn($q) => $q->where('user_id', $currentUser->id))
            ->whereHas('participants', fn($q) => $q->where('user_id', $targetUserId))
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create(['type' => 'direct']);
            $conversation->participants()->attach([$currentUser->id, $targetUserId]);
        }

        $conversation->load(['participants:id,name,username,profile_picture', 'latestMessage']);

        return response()->json($conversation);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required_without:file|string|nullable',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,mp4,mov,webm,pdf,doc,docx,txt,zip|max:51200',
            'reply_to_id' => 'nullable|integer|exists:messages,id',
        ]);

        $user = Auth::user();
        $conversation = Conversation::findOrFail($request->conversation_id);

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Block/restrict checks for direct messages
        if ($conversation->type === 'direct') {
            $otherParticipant = $conversation->participants()->where('user_id', '!=', $user->id)->first();
            if ($otherParticipant) {
                if ($otherParticipant->isBlockedWith($user)) {
                    return response()->json(['message' => 'You are unable to send a message to this person.'], 403);
                }
                if ($otherParticipant->hasRestricted($user)) {
                    return response()->json(['message' => 'You cannot message this user.'], 403);
                }

                $isFriend = $user->isFriend($otherParticipant);
                $isMutualFollow = $user->isFollowing($otherParticipant) && $otherParticipant->isFollowing($user);
                if (!$isFriend && !$isMutualFollow && $otherParticipant->privacy_setting === 'private') {
                    return response()->json(['message' => 'You cannot message this user due to their privacy settings.'], 403);
                }
            }
        }

        $mediaUrl = null;
        if ($request->hasFile('file')) {
            $mediaUrl = Storage::url($request->file('file')->store('message_attachments'));
        } elseif ($request->filled('media_url')) {
            $mediaUrl = $request->input('media_url');
        }

        $message = $conversation->messages()->create([
            'user_id' => $user->id,
            'content' => $request->input('content'),
            'media_url' => $mediaUrl,
            'reply_to_id' => $request->input('reply_to_id'),
        ]);

        $message->load('user:id,name,username,profile_picture');

        if ($request->reply_to_id) {
            $message->load('replyTo:id,content,user_id');
            if ($message->replyTo) {
                $message->replyTo->load('user:id,name');
            }
        }

        return response()->json($message);
    }

    public function messages(Conversation $conversation)
    {
        $user = Auth::user();

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Mark messages as read
        $conversation->messages()
            ->where('user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Update last_read_at on pivot
        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        $messages = $conversation->messages()
            ->with([
                'user:id,name,username,profile_picture',
                'replyTo:id,content,user_id',
                'replyTo.user:id,name',
                'messageReactions.user:id,name,profile_picture',
                'story',
                'story.user:id,name',
            ])
            ->latest()
            ->paginate(30);

        // Mark deleted-for-everyone messages
        $messages->getCollection()->transform(function ($msg) {
            if ($msg->isDeletedForEveryone()) {
                $msg->content = null;
                $msg->media_url = null;
                $msg->is_deleted = true;
            } else {
                $msg->is_deleted = false;
            }
            // Group reactions by emoji
            $msg->grouped_reactions = $msg->messageReactions->groupBy('emoji')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'users' => $group->pluck('user')->take(3),
                ];
            });
            return $msg;
        });

        return response()->json($messages);
    }

    /**
     * React to a message.
     */
    public function reactToMessage(Request $request, Message $message): JsonResponse
    {
        $request->validate(['emoji' => 'required|string|max:10']);

        $user = Auth::user();

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->emoji === $request->emoji) {
                $existing->delete();
                return response()->json(['removed' => true]);
            }
            $existing->update(['emoji' => $request->emoji]);
        } else {
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $request->emoji,
            ]);
        }

        // Return updated reactions
        $reactions = $message->messageReactions()
            ->with('user:id,name')
            ->get()
            ->groupBy('emoji')
            ->map(fn($g) => ['count' => $g->count(), 'users' => $g->pluck('user')->take(3)]);

        return response()->json(['reactions' => $reactions]);
    }

    /**
     * Delete a message for everyone.
     */
    public function deleteMessage(Request $request, Message $message): JsonResponse
    {
        $user = Auth::user();

        if ($message->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $scope = $request->input('scope', 'me');

        if ($scope === 'everyone') {
            // Only within 5 minutes
            if ($message->created_at->diffInMinutes(now()) > 5) {
                return response()->json(['message' => 'You can only delete messages within 5 minutes.'], 422);
            }
            $message->update(['deleted_for_everyone_at' => now()]);
        } else {
            $message->delete(); // soft delete for me
        }

        return response()->json(['deleted' => true]);
    }

    /**
     * Record typing indicator.
     */
    public function typing(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        TypingIndicator::updateOrCreate(
            ['conversation_id' => $conversation->id, 'user_id' => $user->id],
            ['updated_at' => now()]
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Get who's typing.
     */
    public function getTyping(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        $typingUsers = TypingIndicator::where('conversation_id', $conversation->id)
            ->where('user_id', '!=', $user->id)
            ->where('updated_at', '>=', now()->subSeconds(3))
            ->with('user:id,name,username')
            ->get()
            ->pluck('user');

        return response()->json($typingUsers);
    }

    /**
     * Create a group chat.
     */
    public function createGroup(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'member_ids' => 'required|array|min:1|max:9', // max 9 + creator = 10
            'member_ids.*' => 'exists:users,id',
            'avatar' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $user = Auth::user();

        // Block check: filter out blocked users
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        $validMemberIds = collect($request->member_ids)
            ->filter(fn($id) => $id != $user->id && !in_array($id, $allBlockedIds))
            ->values()
            ->toArray();

        if (empty($validMemberIds)) {
            return response()->json(['message' => 'No valid members to add.'], 422);
        }

        // Handle group avatar
        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $avatarUrl = Storage::url($request->file('avatar')->store('group_avatars'));
        }

        $conversation = Conversation::create([
            'type' => 'group',
            'name' => $request->name,
            'avatar_url' => $avatarUrl,
            'max_members' => 10,
        ]);

        // Add creator as admin
        $conversation->participants()->attach($user->id, ['role' => 'admin']);

        // Add members and send notifications
        foreach ($validMemberIds as $memberId) {
            $conversation->participants()->attach($memberId, ['role' => 'member']);

            // Send Ripple notification
            Ripple::create([
                'user_id' => $memberId,
                'sender_id' => $user->id,
                'type' => 'group_invite',
                'message' => $user->name . ' added you to the group "' . $request->name . '"',
                'url' => '/conversations',
            ]);
        }

        // Post a system message
        $conversation->messages()->create([
            'user_id' => $user->id,
            'content' => 'SYSTEM_GROUP_CREATED',
        ]);

        $conversation->load('participants:id,name,username,profile_picture');

        return response()->json($conversation);
    }

    /**
     * Add member to group.
     */
    public function addMember(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $user = Auth::user();

        // Check if requester is admin
        $pivot = $conversation->participants()->where('user_id', $user->id)->first();
        if (!$pivot || $pivot->pivot->role !== 'admin') {
            return response()->json(['message' => 'Only admins can add members.'], 403);
        }

        $conversation->participants()->syncWithoutDetaching([
            $request->user_id => ['role' => 'member']
        ]);

        return response()->json(['added' => true]);
    }

    /**
     * Remove member from group.
     */
    public function removeMember(Conversation $conversation, User $user): JsonResponse
    {
        $authUser = Auth::user();

        $pivot = $conversation->participants()->where('user_id', $authUser->id)->first();
        if (!$pivot || $pivot->pivot->role !== 'admin') {
            return response()->json(['message' => 'Only admins can remove members.'], 403);
        }

        $conversation->participants()->detach($user->id);

        return response()->json(['removed' => true]);
    }

    /**
     * Update group name.
     */
    public function updateGroupName(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:100']);

        $conversation->update(['name' => $request->name]);

        return response()->json(['updated' => true]);
    }

    /**
     * Search messages in a conversation.
     */
    public function searchMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $q = $request->input('q', '');

        $messages = $conversation->messages()
            ->with('user:id,name,username,profile_picture')
            ->where('content', 'LIKE', "%{$q}%")
            ->whereNull('deleted_for_everyone_at')
            ->latest()
            ->take(20)
            ->get();

        return response()->json($messages);
    }

    /**
     * Get shared media for a conversation.
     */
    public function getMedia(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $media = $conversation->messages()
            ->whereNotNull('media_url')
            ->whereNull('deleted_for_everyone_at')
            ->latest()
            ->get(['id', 'media_url', 'created_at']);

        return response()->json($media);
    }

    /**
     * Report a conversation (harassment, spam, etc.)
     */
    public function reportConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|in:harassment,spam,inappropriate,hate_speech,threats,other',
            'details' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        // Must be a participant
        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Prevent duplicate pending reports
        $existing = Report::where('reporter_id', $user->id)
            ->where('reportable_type', 'App\\Models\\Conversation')
            ->where('reportable_id', $conversation->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reported this conversation.'], 422);
        }

        $reasonText = $request->reason;
        if ($request->details) {
            $reasonText .= ': ' . $request->details;
        }

        Report::create([
            'reporter_id' => $user->id,
            'reportable_type' => 'App\\Models\\Conversation',
            'reportable_id' => $conversation->id,
            'reason' => $reasonText,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Conversation reported successfully. An admin will review it.']);
    }
}

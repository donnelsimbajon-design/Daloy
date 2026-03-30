<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\MessageSent; // Will create this event next

class MessagingController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Collect all blocked/blocking user IDs so we can hide their conversations
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id');
        $blockedMeIds   = $user->blockedBy()->pluck('users.id');
        $allBlockedIds  = $blockedByMeIds->merge($blockedMeIds)->unique()->toArray();

        // Get conversations, excluding any that involve a blocked/blocking participant
        $conversations = $user->conversations()
            ->with(['participants:id,name,username,profile_picture', 'latestMessage'])
            // Exclude conversations where any other participant is blocked
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

        return response()->json($conversations);
    }

    public function start(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $targetUserId = $request->user_id;
        $currentUser  = Auth::user();
        $targetUser   = User::find($targetUserId);

        // Block check: cannot start conversations with blocked/blocking users
        if ($targetUser) {
            $isBlockedByTarget = $targetUser->blockedUsers()->where('blocked_user_id', $currentUser->id)->exists();
            $hasBlockedTarget  = $currentUser->blockedUsers()->where('blocked_user_id', $targetUserId)->exists();

            if ($isBlockedByTarget || $hasBlockedTarget) {
                return response()->json(['message' => 'You cannot message this user.'], 403);
            }
        }

        // Check if conversation already exists between these two users (direct)
        $conversation = Conversation::where('type', 'direct')
            ->whereHas('participants', function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id);
            })
            ->whereHas('participants', function ($q) use ($targetUserId) {
                $q->where('user_id', $targetUserId);
            })
            ->first();

        if (!$conversation) {
            // Create new conversation
            $conversation = Conversation::create(['type' => 'direct']);
            $conversation->participants()->attach([$currentUser->id, $targetUserId]);
        }

        // Always load relationships so the frontend gets a consistent structure
        $conversation->load(['participants:id,name,username,profile_picture', 'latestMessage']);

        return response()->json($conversation);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required_without:media_url|string',
            'media_url' => 'nullable|string'
        ]);

        $user = Auth::user();
        $conversation = Conversation::findOrFail($request->conversation_id);

        // Check if user is participant
        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Check messaging permissions (Friends, Mutual Follow, or Public allow)
        // Need to check specific participants depending on type.
        // Simple check: Is the OTHER user allowed to receive messages from me?
        // Prompt says: "Messaging must be allowed only if: Users are friends OR Users mutually follow each other OR Receiver allows public messages"
        // Blocked users cannot send messages.
        
        // For direct message, find the other participant
        $otherParticipant = $conversation->participants()->where('user_id', '!=', $user->id)->first();
        if ($otherParticipant) {
             // Check blocked status — neutral message, no information leakage
             if ($otherParticipant->blockedUsers()->where('blocked_user_id', $user->id)->exists() ||
                 $user->blockedUsers()->where('blocked_user_id', $otherParticipant->id)->exists()) {
                 return response()->json(['message' => 'You are unable to send a message to this person.'], 403);
             }

             // Check permissions
             $isFriend = $user->isFriend($otherParticipant);
             $isMutualFollow = $user->isFollowing($otherParticipant) && $otherParticipant->isFollowing($user);
             $allowsPublic = $otherParticipant->privacy_setting !== 'private'; // Or a separate setting for messages? Prompt says "Receiver allows public messages". Assuming privacy_setting covers it or true by default if public?
             // Prompt implies explicit rule. I will assume privacy_setting 'public' implies public messages unless another setting exists. But "Receiver allows public messages" suggests a specific setting.
             // Since I don't see a `message_privacy` column, I'll rely on friendship/mutual follow.
             // If I need to be strict, I'd say: if not friend and not mutual follow, forbid for now unless we add a setting.
             // But prompt says "OR Receiver allows public messages". I'll assume if their profile is public, they accept messages.
             
             if (!$isFriend && !$isMutualFollow && $otherParticipant->privacy_setting === 'private') {
                  return response()->json(['message' => 'You cannot message this user due to their privacy settings.'], 403);
             }
        }

        $message = $conversation->messages()->create([
            'user_id' => $user->id, // Existing schema uses user_id
            'content' => $request->content,
            'media_url' => $request->media_url,
        ]);

        // Load user so the frontend can display sender info
        $message->load('user:id,name,username,profile_picture');

        // Broadcast event
        // broadcast(new MessageSent($message))->toOthers(); 

        return response()->json($message);
    }

    public function messages(Conversation $conversation)
    {
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($conversation->messages()->with('user:id,name,username,profile_picture')->latest()->paginate(20));
    }
}

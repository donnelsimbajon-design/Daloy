<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\GroupCall;
use App\Models\GroupCallParticipant;
use App\Models\GroupCallMessage;
use App\Models\Ripple;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use CyberDeep\LaravelAgoraTokenGenerator\Services\Agora;

class GroupCallController extends Controller
{
    /**
     * Start a group call in a conversation.
     */
    public function startGroupCall(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Must be group conversation
        if ($conversation->type !== 'group') {
            return response()->json(['error' => 'Group calls are only available in group conversations.'], 422);
        }

        // Only admins can start a group call (per user request: "per admin can create 1 room for it")
        $participant = $conversation->participants()->where('user_id', $user->id)->first();
        if (!$participant || $participant->pivot->role !== 'admin') {
            return response()->json(['error' => 'Only group admins can start a call.'], 403);
        }

        // Check if there's already an active call
        $existingCall = $conversation->activeGroupCall;
        if ($existingCall) {
            return response()->json(['error' => 'A call is already active in this group.'], 422);
        }

        $channelName = "group_call_{$conversation->id}_" . time();

        // Use main AGORA_APP_ID (not the message one)
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (!$appId || !$appCertificate) {
            return response()->json(['error' => 'Group calls are not available right now. Please try again later.'], 503);
        }

        // Generate a real token BEFORE creating call records and notifications.
        try {
            config([
                'services.agora.app_id' => $appId,
                'services.agora.app_certificate' => $appCertificate,
            ]);
            $token = Agora::make((string) $user->id)
                ->channel($channelName)
                ->join(false)
                ->token();
        } catch (\Exception $e) {
            Log::error("Failed to generate Agora group call token: " . $e->getMessage());
            return response()->json(['error' => 'Cannot start this call right now. Please try again later.'], 503);
        }

        // Create the group call record
        $groupCall = GroupCall::create([
            'conversation_id' => $conversation->id,
            'channel_name' => $channelName,
            'started_by' => $user->id,
            'started_at' => now(),
        ]);

        // Add host as participant
        GroupCallParticipant::create([
            'group_call_id' => $groupCall->id,
            'user_id' => $user->id,
            'joined_at' => now(),
            'role' => 'host',
        ]);

        // Send Ripple notification to all group members
        $memberIds = $conversation->participants()
            ->where('user_id', '!=', $user->id)
            ->pluck('users.id');

        foreach ($memberIds as $memberId) {
            \Illuminate\Support\Facades\Cache::put("incoming_call_{$memberId}", [
                'caller_id' => $user->id,
                'caller_name' => $user->name,
                'caller_avatar' => $user->profile_picture,
                'type' => 'video',
                'channel_name' => $channelName,
                'conversation_id' => $conversation->id,
                'conversation_name' => $conversation->name,
                'is_group_call' => true,
            ], now()->addSeconds(60));

            Ripple::create([
                'user_id' => $memberId,
                'sender_id' => $user->id,
                'type' => 'group_call',
                'notifiable_type' => \App\Models\GroupCall::class,
                'notifiable_id' => $groupCall->id,
                'data' => [
                    'message' => $user->name . ' started a group call in ' . ($conversation->name ?? 'the group'),
                    'url' => '/conversations?call=' . $groupCall->id,
                ]
            ]);
        }

        // Post a system message in the conversation
        $conversation->messages()->create([
            'user_id' => $user->id,
            'content' => 'SYSTEM_GROUP_CALL_STARTED',
        ]);

        return response()->json([
            'group_call_id' => $groupCall->id,
            'token' => $token,
            'app_id' => $appId,
            'channel_name' => $channelName,
            'uid' => $user->id,
        ]);
    }

    /**
     * Join an existing group call.
     */
    public function joinGroupCall(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        $mode = $request->input('mode', 'speaker'); // 'speaker' or 'listener' (chat-only)

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'Not a member of this group.'], 403);
        }

        $groupCall = $conversation->activeGroupCall;
        if (!$groupCall) {
            return response()->json(['error' => 'No active call in this group.'], 404);
        }

        if (!config('services.agora.app_id') || !config('services.agora.app_certificate')) {
            return response()->json(['error' => 'Group calls are not available right now. Please try again later.'], 503);
        }

        // Check if already in the call
        $existing = GroupCallParticipant::where('group_call_id', $groupCall->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();

        if ($existing) {
            // Already in call, just return token
            $appId = config('services.agora.app_id');
            try {
                config([
                    'services.agora.app_id' => $appId,
                    'services.agora.app_certificate' => config('services.agora.app_certificate'),
                ]);
                $token = Agora::make((string) $user->id)
                    ->channel($groupCall->channel_name)
                    ->join(false)
                    ->token();
            } catch (\Exception $e) {
                Log::error("Failed to generate Agora token: " . $e->getMessage());
                return response()->json(['error' => 'Cannot join this call right now. Please try again later.'], 503);
            }

            return response()->json([
                'group_call_id' => $groupCall->id,
                'token' => $token,
                'app_id' => $appId,
                'channel_name' => $groupCall->channel_name,
                'uid' => $user->id,
                'role' => $existing->role,
            ]);
        }

        // Check max participants (10)
        $activeCount = $groupCall->activeParticipants()->count();
        if ($activeCount >= 10) {
            return response()->json(['error' => 'Call is full (max 10 participants).'], 422);
        }

        $role = $mode === 'listener' ? 'listener' : 'speaker';
        
        // If they join as listener, they are auto-muted
        $isHostMuted = ($role === 'listener');

        // Generate token
        $appId = config('services.agora.app_id');
        try {
            config([
                'services.agora.app_id' => $appId,
                'services.agora.app_certificate' => config('services.agora.app_certificate'),
            ]);
            $agoraQuery = Agora::make((string) $user->id)
                ->channel($groupCall->channel_name)
                ->join(false);
            if ($role === 'listener') {
                $agoraQuery = $agoraQuery->audioOnly(true);
            }
            $token = $agoraQuery->token();
        } catch (\Exception $e) {
            Log::error("Failed to generate Agora token: " . $e->getMessage());
            return response()->json(['error' => 'Cannot join this call right now. Please try again later.'], 503);
        }

        // Add participant
        GroupCallParticipant::create([
            'group_call_id' => $groupCall->id,
            'user_id' => $user->id,
            'joined_at' => now(),
            'role' => $role,
            'is_muted_by_host' => $isHostMuted,
        ]);

        return response()->json([
            'group_call_id' => $groupCall->id,
            'token' => $token,
            'app_id' => $appId,
            'channel_name' => $groupCall->channel_name,
            'uid' => $user->id,
            'role' => $role,
        ]);
    }

    /**
     * Leave a group call.
     */
    public function leaveGroupCall(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['error' => 'No active call.'], 404);
        }

        $participant = GroupCallParticipant::where('group_call_id', $groupCall->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();

        if ($participant) {
            $participant->update(['left_at' => now()]);
        }

        // End the call if host leaves, or if participant count drops below 2
        $remainingCount = $groupCall->activeParticipants()->count();
        if ($remainingCount < 2 || ($participant && $participant->role === 'host')) {
            $this->endCallInternal($groupCall);
        }

        return response()->json(['left' => true]);
    }

    /**
     * End a group call (host only).
     */
    public function endGroupCall(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['error' => 'No active call.'], 404);
        }

        // Only host can end
        if ($groupCall->started_by !== $user->id) {
            return response()->json(['error' => 'Only the host can end the call.'], 403);
        }

        $this->endCallInternal($groupCall);

        return response()->json(['ended' => true]);
    }

    /**
     * Mute/unmute a participant (host only).
     */
    public function muteParticipant(Conversation $conversation, $userId, Request $request): JsonResponse
    {
        $user = Auth::user();
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['error' => 'No active call.'], 404);
        }

        if ($groupCall->started_by !== $user->id) {
            return response()->json(['error' => 'Only the host can mute participants.'], 403);
        }

        $participant = GroupCallParticipant::where('group_call_id', $groupCall->id)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->first();

        if (!$participant) {
            return response()->json(['error' => 'User not in call.'], 404);
        }

        $muted = $request->input('mute', true);
        $participant->update(['is_muted_by_host' => $muted]);

        return response()->json(['muted' => $muted, 'user_id' => (int) $userId]);
    }

    /**
     * Get active call info + participants.
     */
    public function getActiveCall(Conversation $conversation): JsonResponse
    {
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['active' => false]);
        }

        $participants = $groupCall->activeParticipants()
            ->with('user:id,name,username,profile_picture')
            ->get();

        return response()->json([
            'active' => true,
            'group_call_id' => $groupCall->id,
            'channel_name' => $groupCall->channel_name,
            'started_by' => $groupCall->started_by,
            'started_at' => $groupCall->started_at,
            'participants' => $participants->map(fn ($p) => [
                'user_id' => $p->user_id,
                'role' => $p->role,
                'is_muted_by_host' => (bool) $p->is_muted_by_host,
                'is_screen_sharing' => (bool) ($p->is_screen_sharing ?? false),
                'user' => $p->user,
            ]),
        ]);
    }

    /**
     * Kick a participant from the call (host only).
     */
    public function kickParticipant(Conversation $conversation, $userId): JsonResponse
    {
        $user = Auth::user();
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['error' => 'No active call.'], 404);
        }

        if ($groupCall->started_by !== $user->id) {
            return response()->json(['error' => 'Only the host can kick participants.'], 403);
        }

        $participant = GroupCallParticipant::where('group_call_id', $groupCall->id)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->first();

        if ($participant) {
            $participant->update(['left_at' => now()]);
        }

        return response()->json(['kicked' => true, 'user_id' => (int) $userId]);
    }

    /**
     * Send in-call chat message.
     */
    public function sendCallChat(Conversation $conversation, Request $request): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:500']);

        $user = Auth::user();
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['error' => 'No active call.'], 404);
        }

        // Must be in the call
        $inCall = GroupCallParticipant::where('group_call_id', $groupCall->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();

        if (!$inCall) {
            return response()->json(['error' => 'You must be in the call to send messages.'], 403);
        }

        $message = GroupCallMessage::create([
            'group_call_id' => $groupCall->id,
            'user_id' => $user->id,
            'content' => $request->input('content'),
        ]);

        $message->load('user:id,name,username,profile_picture');

        return response()->json($message);
    }

    /**
     * Get in-call chat messages.
     */
    public function getCallChat(Conversation $conversation, Request $request): JsonResponse
    {
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['messages' => []]);
        }

        $afterId = $request->input('after_id', 0);

        $messages = $groupCall->chatMessages()
            ->with('user:id,name,username,profile_picture')
            ->where('id', '>', $afterId)
            ->orderBy('created_at')
            ->take(50)
            ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Get mute status for all participants (polled by clients).
     */
    public function getMuteStatus(Conversation $conversation): JsonResponse
    {
        $groupCall = $conversation->activeGroupCall;

        if (!$groupCall) {
            return response()->json(['participants' => []]);
        }

        $participants = $groupCall->activeParticipants()
            ->select('user_id', 'is_muted_by_host', 'role', 'is_screen_sharing')
            ->get();

        return response()->json(['participants' => $participants]);
    }

    /**
     * Toggle the screen share status for the current user.
     */
    public function toggleScreenShareStatus(Conversation $conversation, Request $request): JsonResponse
    {
        $groupCall = $conversation->activeGroupCall;
        if (!$groupCall) {
            return response()->json(['error' => 'No active group call'], 422);
        }

        $participant = $groupCall->participants()
            ->where('user_id', Auth::id())
            ->whereNull('left_at')
            ->first();

        if ($participant) {
            $participant->update([
                'is_screen_sharing' => $request->boolean('is_screen_sharing', false)
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Internal: end a group call.
     */
    private function endCallInternal(GroupCall $groupCall): void
    {
        // Delete in-call chat messages (ephemeral — not saved after call ends)
        $groupCall->chatMessages()->delete();

        // Mark all participants as left + clear screen sharing
        $groupCall->activeParticipants()->update([
            'left_at' => now(),
            'is_screen_sharing' => false,
        ]);
        $groupCall->update(['ended_at' => now()]);

        // Post system message to the conversation feed
        $groupCall->conversation->messages()->create([
            'user_id' => $groupCall->started_by,
            'content' => 'SYSTEM_GROUP_CALL_ENDED',
        ]);
    }
}

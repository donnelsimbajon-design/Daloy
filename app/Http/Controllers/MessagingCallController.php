<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use CyberDeep\LaravelAgoraTokenGenerator\Services\Agora;

class MessagingCallController extends Controller
{
    /**
     * Start a direct message call.
     */
    public function startCall(Conversation $conversation, Request $request)
    {
        $user = Auth::user();

        // 1. Verify user is part of the conversation
        $isMember = $conversation->participants()->where('user_id', $user->id)->exists();
        if (!$isMember) {
            return response()->json(['error' => 'Not authorized to start a call in this conversation.'], 403);
        }

        if (!config('services.agora.message_app_id') || !config('services.agora.message_app_certificate')) {
            return response()->json(['error' => 'Voice and video calls are not available right now. Please try again later.'], 503);
        }

        $type = $request->input('type', 'video'); // audio or video
        $channelName = "dm_call_{$conversation->id}";

        // 2. Temporarily override Agora config using the specific MESSAGE keys
        config([
            'services.agora.app_id' => config('services.agora.message_app_id'),
            'services.agora.app_certificate' => config('services.agora.message_app_certificate'),
        ]);

        // 3. Generate token
        try {
            $agoraQuery = Agora::make((string) $user->id)->channel($channelName)->join(false);
            if ($type === 'audio') {
                $agoraQuery = $agoraQuery->audioOnly(true);
            }
            $token = $agoraQuery->token();
        } catch (\Exception $e) {
            Log::error("Failed to generate Agora DM token: " . $e->getMessage());
            return response()->json(['error' => 'Cannot connect the call right now. Please try again later.'], 503);
        }

        // Cache the incoming call for the OTHER participant to poll
        $otherParticipant = $conversation->participants()->where('user_id', '!=', $user->id)->first();
        if ($otherParticipant) {
            // Give 30 seconds for the ringing state
            Cache::put("incoming_call_{$otherParticipant->id}", [
                'caller_id' => $user->id,
                'caller_name' => $user->name,
                'caller_avatar' => $user->profile_picture,
                'type' => $type,
                'channel_name' => $channelName,
                'conversation_id' => $conversation->id,
                'token' => null // So receiver gets prompted, then they generate their own later!
            ], now()->addSeconds(30));
            
            // Set my status to ringing
            Cache::put("call_status_{$user->id}_{$channelName}", 'ringing', now()->addSeconds(30));
        }

        // Return token and connection info
        return response()->json([
            'token' => $token,
            'app_id' => config('services.agora.message_app_id'),
            'channel_name' => $channelName,
            'uid' => $user->id,
            'type' => $type
        ]);
    }

    /**
     * Polled by users every 3 seconds to check if anyone is calling them.
     */
    public function checkIncoming()
    {
        $userId = Auth::id();
        $incoming = Cache::get("incoming_call_{$userId}");
        return response()->json(['incoming' => $incoming]);
    }

    /**
     * Polled by the caller to see if the receiver accepted or rejected.
     */
    public function checkStatus(Request $request)
    {
        $channel = $request->input('channel_name');
        $status = Cache::get("call_status_{$request->user()->id}_{$channel}");
        return response()->json(['status' => $status]);
    }

    /**
     * Action to Answer, Reject, or Cancel
     */
    public function action(Request $request)
    {
        $action = $request->input('action'); // accept, reject, cancel
        
        if ($action === 'cancel') {
            // Caller cancels ringing
            $receiverId = $request->input('receiver_id');
            $channel = $request->input('channel_name');
            Cache::forget("incoming_call_{$receiverId}");
            Cache::put("call_status_{$request->user()->id}_{$channel}", 'canceled', now()->addSeconds(10));
            return response()->json(['success' => true]);
        }

        // It's the Receiver responding
        $callerId = $request->input('caller_id');
        $channel = $request->input('channel_name');

        if ($action === 'accept') {
            if (!config('services.agora.message_app_id') || !config('services.agora.message_app_certificate')) {
                return response()->json(['error' => 'Voice and video calls are not available right now.'], 503);
            }

            config([
                'services.agora.app_id' => config('services.agora.message_app_id'),
                'services.agora.app_certificate' => config('services.agora.message_app_certificate'),
            ]);

            try {
                $token = Agora::make((string) $request->user()->id)
                    ->channel($channel)
                    ->join(false)
                    ->token();
            } catch (\Exception $e) {
                Log::error('Could not generate Agora receiver token: '.$e->getMessage());
                return response()->json(['error' => 'Cannot connect the call right now. Please try again later.'], 503);
            }

            // Never mark a call accepted before a valid token is available.
            Cache::forget("incoming_call_{$request->user()->id}");
            Cache::put("call_status_{$callerId}_{$channel}", 'accepted', now()->addSeconds(30));

            return response()->json([
                'token' => $token,
                'app_id' => config('services.agora.message_app_id'),
                'uid' => $request->user()->id
            ]);
        }

        if ($action === 'reject') {
            Cache::forget("incoming_call_{$request->user()->id}");
            Cache::put("call_status_{$callerId}_{$channel}", 'rejected', now()->addSeconds(10));
            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Invalid action']);
    }
}

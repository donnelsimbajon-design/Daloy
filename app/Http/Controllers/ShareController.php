<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShareController extends Controller
{
    /**
     * Search for users to follow/message.
     */
    public function searchUsers(Request $request)
    {
        $query = $request->input('query');
        if (empty($query)) {
            return response()->json([]);
        }

        $users = User::where('id', '!=', Auth::id())
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('username', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'username', 'profile_picture']);

        return response()->json($users);
    }

    /**
     * Send a post to a user as a message.
     */
    public function sendToUser(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'post_url' => 'required|url',
            'message' => 'nullable|string|max:500',
        ]);

        $recipientId = $validated['recipient_id'];
        $authId = Auth::id();

        // 1. Find or create conversation
        // This is a simple 1-on-1 implementation
        $conversation = Conversation::whereHas('participants', function ($q) use ($authId) {
            $q->where('user_id', $authId);
        })->whereHas('participants', function ($q) use ($recipientId) {
            $q->where('user_id', $recipientId);
        })->where('type', 'private') // Assuming 'type' column exists for direct vs group
        ->first();

        if (!$conversation) {
            DB::transaction(function () use (&$conversation, $authId, $recipientId) {
                $conversation = Conversation::create(['type' => 'private']);
                $conversation->participants()->attach([$authId, $recipientId]);
            });
        }

        // 2. Create message
        $content = "Shared a post: " . $validated['post_url'];
        if (!empty($validated['message'])) {
            $content = $validated['message'] . "\n\n" . $content;
        }

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $authId,
            'content' => $content,
        ]);

        return response()->json(['message' => 'Sent successfully']);
    }
}

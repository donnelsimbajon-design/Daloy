<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Post;
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

        $authUser = Auth::user();

        // Exclude blocked/blocking users
        $blockedByMeIds = $authUser->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $authUser->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        $users = User::where('id', '!=', Auth::id())
            ->whereNotIn('id', $allBlockedIds)
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('username', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'username', 'profile_picture']);

        return response()->json($users);
    }

    /**
     * Send a post to a user as a rich message with preview card.
     */
    public function sendToUser(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'post_id'      => 'nullable|exists:posts,id',
            'post_url'     => 'required|string',
            'message'      => 'nullable|string|max:500',
        ]);

        $recipientId = $validated['recipient_id'];
        $authId      = Auth::id();
        $authUser    = Auth::user();
        $recipient   = User::find($recipientId);

        // Block check
        if ($recipient) {
            $isBlockedByRecipient = $recipient->blockedUsers()->where('blocked_user_id', $authId)->exists();
            $hasBlockedRecipient  = $authUser->blockedUsers()->where('blocked_user_id', $recipientId)->exists();
            if ($isBlockedByRecipient || $hasBlockedRecipient) {
                return response()->json(['message' => 'Cannot share with this user.'], 403);
            }
        }

        // Build rich post metadata snapshot
        $metadata = null;
        if (!empty($validated['post_id'])) {
            $post = Post::with(['user:id,name,username,profile_picture', 'media'])->find($validated['post_id']);
            if ($post) {
                // Get first media item (image or video)
                $firstMedia = $post->media->first();

                $metadata = [
                    'type'           => 'shared_post',
                    'post_id'        => $post->id,
                    'post_url'       => $validated['post_url'],
                    'content'        => $post->content ? mb_substr($post->content, 0, 200) : null,
                    'author_name'    => $post->user?->name,
                    'author_avatar'  => $post->user?->profile_picture,
                    'media_url'      => $firstMedia?->url ?? ($post->media_urls[0] ?? null),
                    'media_type'     => $firstMedia?->type ?? null,
                ];
            }
        }

        // Fallback simple metadata if no post_id
        if (!$metadata) {
            $metadata = [
                'type'     => 'shared_post',
                'post_url' => $validated['post_url'],
            ];
        }

        // Find or create 1-on-1 conversation
        $conversation = Conversation::whereHas('participants', function ($q) use ($authId) {
            $q->where('user_id', $authId);
        })->whereHas('participants', function ($q) use ($recipientId) {
            $q->where('user_id', $recipientId);
        })->where('type', 'direct')
        ->first();

        if (!$conversation) {
            DB::transaction(function () use (&$conversation, $authId, $recipientId) {
                $conversation = Conversation::create(['type' => 'direct']);
                $conversation->participants()->attach([$authId, $recipientId]);
            });
        }

        // Build content string (optional user note + link as fallback for older clients)
        $content = null;
        if (!empty($validated['message'])) {
            $content = $validated['message'];
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id'         => $authId,
            'content'         => $content,
            'metadata'        => $metadata,
        ]);

        return response()->json(['message' => 'Sent successfully', 'conversation_id' => $conversation->id]);
    }
}

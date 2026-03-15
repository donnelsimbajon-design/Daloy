<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        $friendIds = $user->friends()->pluck('users.id');
        $followingIds = $user->following()->pluck('users.id');
        
        $eligibleUserIds = $friendIds->merge($followingIds)->push($user->id)->unique();

        $stories = \App\Models\Story::with('user:id,name,username,profile_picture')
            ->where('expires_at', '>', now())
            ->whereIn('user_id', $eligibleUserIds)
            ->where(function ($query) use ($user, $friendIds) {
                // Own stories
                $query->where('user_id', $user->id)
                // Public stories from eligible users
                      ->orWhere('visibility', 'public')
                // Friends-only stories from actual friends
                      ->orWhere(function ($q) use ($friendIds) {
                          $q->where('visibility', 'friends')
                            ->whereIn('user_id', $friendIds);
                      });
            })
            ->latest()
            ->get();

        $formatted = $stories->map(function ($story) {
            $timeAgo = str_replace(
                [' seconds', ' second', ' minutes', ' minute', ' hours', ' hour', ' days', ' day'],
                ['s', 's', 'm', 'm', 'h', 'h', 'd', 'd'],
                $story->created_at->diffForHumans(null, true)
            );

            return [
                'id' => $story->id,
                'user' => $story->user,
                'time' => $timeAgo . ' ago',
                'content' => $story->content,
                'image' => $story->media_url,
                'type' => $story->type,
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $request->validate([
            'media' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:51200',
            'content' => 'nullable|string|max:255',
            'visibility' => 'required|in:public,friends,private',
        ]);

        $path = $request->file('media')->store('stories', 'public');
        $url = '/storage/' . $path;

        $extension = strtolower($request->file('media')->getClientOriginalExtension());
        $type = in_array($extension, ['mp4', 'mov']) ? 'video' : 'image';

        $story = \App\Models\Story::create([
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'media_url' => $url,
            'type' => $type,
            'content' => $request->content,
            'visibility' => $request->visibility,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json(['message' => 'Story uploaded successfully']);
    }
}

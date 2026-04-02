<?php

namespace App\Http\Controllers;

use App\Models\Hashtag;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HashtagController extends Controller
{
    /**
     * Show all posts tagged with a hashtag.
     */
    public function show(string $hashtag)
    {
        $user = Auth::user();

        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        $hashtagModel = Hashtag::where('name', $hashtag)->first();

        $posts = collect();
        if ($hashtagModel) {
            $posts = Post::with(['user:id,name,username,profile_picture', 'media', 'school:id,name,cover_image,profile_image'])
                ->whereHas('hashtags', function ($q) use ($hashtagModel) {
                    $q->where('hashtags.id', $hashtagModel->id);
                })
                ->whereNotIn('user_id', $allBlockedIds)
                ->where('visibility', 'public')
                ->withCount(['comments', 'reactions'])
                ->withExists(['reactions as liked_by_user' => function ($q) {
                    $q->where('user_id', Auth::id())->where('type', 'like');
                }])
                ->withExists(['bookmarks as is_bookmarked' => function ($q) {
                    $q->where('user_id', Auth::id());
                }])
                ->latest()
                ->paginate(15);
        }

        return Inertia::render('Hashtag', [
            'hashtag' => $hashtag,
            'posts' => $posts,
        ]);
    }
}

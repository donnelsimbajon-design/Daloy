<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PostController extends Controller
{
    /**
     * Display the feed / dashboard with paginated posts.
     * Feed includes: own posts, friends' posts, followed users' posts, and joined school posts.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Collect IDs for the feed
        $friendIds    = $user->friends()->pluck('users.id')->toArray();
        $followingIds = $user->following()->pluck('users.id')->toArray();
        $joinedSchoolIds = $user->schools()->pluck('schools.id')->toArray();

        // --- Block filter: exclude any user in a blocking relationship ---
        // Users I blocked
        $blockedByMeIds   = $user->blockedUsers()->pluck('users.id')->toArray();
        // Users who blocked me
        $blockedMeIds     = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds    = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        // Merge unique user IDs: self + friends + following (minus blocked)
        $feedUserIds = array_unique(array_merge([$user->id], $friendIds, $followingIds));
        // Remove blocked users from the feed source
        $feedUserIds = array_values(array_diff($feedUserIds, $allBlockedIds));

        $posts = Post::with(['user:id,name,username,profile_picture', 'media', 'school:id,name,cover_image,profile_image'])
            ->where(function ($query) use ($feedUserIds, $joinedSchoolIds, $user) {
                // Posts from feed users (public + followers visibility)
                $query->where(function ($q) use ($feedUserIds) {
                    $q->whereIn('user_id', $feedUserIds)
                      ->whereIn('visibility', ['public', 'followers']);
                });

                // Posts from joined schools
                if (!empty($joinedSchoolIds)) {
                    $query->orWhereIn('school_id', $joinedSchoolIds);
                }

                // Always include own posts regardless of visibility
                $query->orWhere('user_id', $user->id);
            })
            // Hard exclude any post authored by a blocked/blocking user
            ->whereNotIn('user_id', $allBlockedIds)
            ->withCount(['comments', 'reactions'])
            ->withExists(['reactions as liked_by_user' => function ($q) {
                $q->where('user_id', Auth::id())
                  ->where('type', 'like');
            }])
            ->latest()
            ->paginate(15);

        return Inertia::render('Dashboard', [
            'posts' => $posts,
        ]);
    }

    /**
     * Store a new post.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'visibility' => 'required|in:public,followers,private',
            'location_tag' => 'nullable|string|max:100',
            'flow_velocity' => 'nullable|in:high,steady,low',
            'media' => 'nullable|array|max:4',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm|max:51200',
        ]);

        // Require at least content or media
        if (empty($validated['content']) && empty($request->file('media'))) {
            return back()->withErrors(['content' => 'Please write something or attach media.']);
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'] ?? null,
            'visibility' => $validated['visibility'],
            'location_tag' => $validated['location_tag'] ?? null,
            'flow_velocity' => $validated['flow_velocity'] ?? 'steady',
        ]);

        // Handle file uploads
        if ($request->hasFile('media')) {
            $mediaUrls = [];
            foreach ($request->file('media') as $index => $file) {
                $path = $file->store('posts/' . $post->id, 'public');
                $url = '/storage/' . $path;

                $extension = strtolower($file->getClientOriginalExtension());
                $type = in_array($extension, ['mp4', 'mov', 'webm']) ? 'video' : 'image';

                Media::create([
                    'post_id' => $post->id,
                    'type' => $type,
                    'url' => $url,
                    'order' => $index,
                ]);

                $mediaUrls[] = $url;
            }

            // Also store in the json column for quick access
            $post->update(['media_urls' => $mediaUrls]);
        }

        return back()->with('status', 'post-created');
    }

    /**
     * Update an existing post.
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        // Authorization: only the owner can edit
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'visibility' => 'required|in:public,followers,private',
            'location_tag' => 'nullable|string|max:100',
            'flow_velocity' => 'nullable|in:high,steady,low',
        ]);

        $post->update($validated);

        return back()->with('status', 'post-updated');
    }

    /**
     * Delete a post (soft delete).
     */
    public function destroy(Post $post): RedirectResponse
    {
        // Authorization: only the owner can delete
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        // Delete media files from storage
        foreach ($post->media as $media) {
            $storagePath = str_replace('/storage/', '', $media->url);
            Storage::disk('public')->delete($storagePath);
        }

        $post->delete();

        return back()->with('status', 'post-deleted');
    }
}

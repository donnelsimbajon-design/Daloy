<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Post;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\Mention;
use App\Models\Hashtag;
use App\Models\Ripple;
use App\Models\User;
use App\Traits\LogsUserActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PostController extends Controller
{
    use LogsUserActivity;

    /**
     * Display the feed / dashboard with paginated posts.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $friendIds    = $user->friends()->pluck('users.id')->toArray();
        $followingIds = $user->following()->pluck('users.id')->toArray();
        $joinedSchoolIds = $user->schools()->pluck('schools.id')->toArray();

        // Block & restrict filter
        $blockedByMeIds   = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds     = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds    = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        // Restricted users - exclude their posts from my feed
        $restrictedIds = $user->restrictedUsers()->pluck('users.id')->toArray();
        $excludeFromFeed = array_unique(array_merge($allBlockedIds, $restrictedIds));

        // Muted keywords
        $mutedKeywords = $user->mutedKeywords()->pluck('keyword')->toArray();

        // Close friends who include me
        $closeFriendOfIds = $user->closeFriendOf()->pluck('users.id')->toArray();

        // Merge unique user IDs: self + friends + following (minus excluded)
        $feedUserIds = array_unique(array_merge([$user->id], $friendIds, $followingIds));
        $feedUserIds = array_values(array_diff($feedUserIds, $excludeFromFeed));

        $posts = Post::with([
            'user:id,name,username,profile_picture',
            'media',
            'school:id,name,cover_image,profile_image',
            'poll.options',
            'repostOf.user:id,name,username,profile_picture',
            'repostOf.media',
        ])
            ->where(function ($query) use ($feedUserIds, $joinedSchoolIds, $user, $friendIds, $closeFriendOfIds, $excludeFromFeed) {
                // All public posts from non-blocked users (global discovery)
                $query->where(function ($q) use ($excludeFromFeed) {
                    $q->where('visibility', 'public')
                      ->whereNotIn('user_id', $excludeFromFeed)
                      ->whereNull('school_id'); // exclude school-only posts from global feed
                });

                // Also show followers-only posts from people you follow/friend
                $query->orWhere(function ($q) use ($feedUserIds) {
                    $q->whereIn('user_id', $feedUserIds)
                      ->where('visibility', 'followers');
                });

                // Close friends visibility: only if I'm in their close friends
                if (!empty($closeFriendOfIds)) {
                    $query->orWhere(function ($q) use ($closeFriendOfIds) {
                        $q->whereIn('user_id', $closeFriendOfIds)
                          ->where('visibility', 'close_friends');
                    });
                }

                // Posts from joined schools
                if (!empty($joinedSchoolIds)) {
                    $query->orWhereIn('school_id', $joinedSchoolIds);
                }

                // Always include own posts regardless of visibility
                $query->orWhere('user_id', $user->id);
            })
            ->whereNotIn('user_id', $excludeFromFeed)
            // Filter muted keywords
            ->when(!empty($mutedKeywords), function ($q) use ($mutedKeywords) {
                foreach ($mutedKeywords as $keyword) {
                    $q->where('content', 'NOT LIKE', "%{$keyword}%");
                }
            })
            ->withCount(['comments', 'reactions', 'bookmarks'])
            ->withExists(['bookmarks as is_bookmarked' => function ($q) {
                $q->where('user_id', Auth::id());
            }])
            ->latest()
            ->paginate(15);

        // Add user's reaction type and reaction counts for each post
        $posts->getCollection()->transform(function ($post) {
            $userId = Auth::id();
            $userReaction = $post->reactions()->where('user_id', $userId)->first();
            $post->user_reaction = $userReaction ? $userReaction->type : null;
            $post->liked_by_user = $userReaction !== null;

            // Reaction counts grouped by type
            $post->reaction_counts = $this->getReactionCounts($post);

            // Poll vote status — serialize as a plain array so Inertia passes all fields
            if ($post->poll) {
                $vote = $post->poll->votes()->where('user_id', $userId)->first();
                $totalVotes = $post->poll->options->sum('votes_count');

                $post->poll = [
                    'id'                   => $post->poll->id,
                    'question'             => $post->poll->question,
                    'expires_at'           => $post->poll->expires_at,
                    'user_voted'           => $vote !== null,
                    'user_voted_option_id' => $vote?->option_id,
                    'total_votes'          => $totalVotes,
                    'options'              => $post->poll->options->map(function ($opt) use ($totalVotes) {
                        return [
                            'id'          => $opt->id,
                            'label'       => $opt->label,
                            'votes_count' => $opt->votes_count,
                            'percentage'  => $totalVotes > 0 ? round(($opt->votes_count / $totalVotes) * 100) : 0,
                        ];
                    })->values()->all(),
                ];
            }

            return $post;
        });


        return Inertia::render('Dashboard', [
            'posts' => $posts,
        ]);
    }

    /**
     * Display a specific post.
     */
    public function show(Post $post)
    {
        $post->load([
            'user:id,name,username,profile_picture',
            'media',
            'school:id,name,cover_image,profile_image',
            'poll.options',
            'repostOf.user:id,name,username,profile_picture',
            'repostOf.media',
        ]);
        $post->loadCount(['comments', 'reactions', 'bookmarks']);

        $userId = Auth::id();
        $userReaction = $post->reactions()->where('user_id', $userId)->first();
        $post->user_reaction = $userReaction ? $userReaction->type : null;
        $post->liked_by_user = $userReaction !== null;
        $post->reaction_counts = $this->getReactionCounts($post);

        // Check if bookmarked
        $post->is_bookmarked = $post->bookmarks()->where('user_id', $userId)->exists();

        if ($post->poll) {
            $vote = $post->poll->votes()->where('user_id', $userId)->first();
            $totalVotes = $post->poll->options->sum('votes_count');

            $post->poll = [
                'id'                   => $post->poll->id,
                'question'             => $post->poll->question,
                'expires_at'           => $post->poll->expires_at,
                'user_voted'           => $vote !== null,
                'user_voted_option_id' => $vote?->option_id,
                'total_votes'          => $totalVotes,
                'options'              => $post->poll->options->map(function ($opt) use ($totalVotes) {
                    return [
                        'id'          => $opt->id,
                        'label'       => $opt->label,
                        'votes_count' => $opt->votes_count,
                        'percentage'  => $totalVotes > 0 ? round(($opt->votes_count / $totalVotes) * 100) : 0,
                    ];
                })->values()->all(),
            ];
        }

        return Inertia::render('Post/Show', [
            'post' => $post,
        ]);
    }

    /**
     * Store a new post.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'visibility' => 'required|in:public,followers,private,close_friends',
            'location_tag' => 'nullable|string|max:100',
            'flow_velocity' => 'nullable|in:high,steady,low',
            'media' => 'nullable|array|max:4',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm|max:51200',
            // Repost
            'repost_of_id' => 'nullable|integer|exists:posts,id',
            // Poll
            'poll_question' => 'nullable|string|max:500',
            'poll_options' => 'nullable|array|min:2|max:4',
            'poll_options.*' => 'nullable|string|max:200',
            'poll_expires_at' => 'nullable|date|after:now',
            // Content Warning
            'has_content_warning' => 'nullable|boolean',
            'content_warning_label' => 'nullable|string|max:100',
            // Comment permission
            'comment_permission' => 'nullable|in:everyone,friends,nobody',
            // Announcement
            'is_announcement' => 'nullable|boolean',
            'school_id' => 'nullable|integer|exists:schools,id',
        ]);

        // Require at least content, media, poll, or repost
        if (empty($validated['content']) && empty($request->file('media'))
            && empty($validated['poll_question']) && empty($validated['repost_of_id'])) {
            return back()->withErrors(['content' => 'Please write something or attach media.']);
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'] ?? null,
            'visibility' => $validated['visibility'],
            'location_tag' => $validated['location_tag'] ?? null,
            'flow_velocity' => $validated['flow_velocity'] ?? 'steady',
            'repost_of_id' => $validated['repost_of_id'] ?? null,
            'has_content_warning' => $validated['has_content_warning'] ?? false,
            'content_warning_label' => $validated['content_warning_label'] ?? null,
            'comment_permission' => $validated['comment_permission'] ?? 'everyone',
            'is_announcement' => $validated['is_announcement'] ?? false,
            'school_id' => $validated['school_id'] ?? null,
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
            $post->update(['media_urls' => $mediaUrls]);
        }

        $hasPoll = false;
        // Create poll if provided
        if (!empty($validated['poll_options']) && is_array($validated['poll_options']) && count(array_filter($validated['poll_options'])) >= 2) {
            $poll = Poll::create([
                'post_id' => $post->id,
                'question' => !empty($validated['poll_question']) ? $validated['poll_question'] : 'Poll',
                'expires_at' => $validated['poll_expires_at'] ?? null,
            ]);

            foreach ($validated['poll_options'] as $label) {
                if (trim($label) !== '') {
                    PollOption::create([
                        'poll_id' => $poll->id,
                        'label' => trim($label),
                    ]);
                }
            }
            $hasPoll = true;
        }

        // Parse and store hashtags
        if (!empty($validated['content'])) {
            preg_match_all('/#(\w+)/', $validated['content'], $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $tag) {
                    $hashtag = Hashtag::firstOrCreate(['name' => strtolower($tag)]);
                    $post->hashtags()->syncWithoutDetaching([$hashtag->id]);
                }
            }

            // Parse and store mentions
            preg_match_all('/@(\w+)/', $validated['content'], $mentionMatches);
            if (!empty($mentionMatches[1])) {
                foreach ($mentionMatches[1] as $username) {
                    $mentionedUser = User::where('username', $username)->first();
                    if ($mentionedUser && $mentionedUser->id !== Auth::id()) {
                        Mention::create([
                            'post_id' => $post->id,
                            'mentioned_user_id' => $mentionedUser->id,
                        ]);

                        // Send ripple notification for mention
                        Ripple::create([
                            'user_id' => $mentionedUser->id,
                            'sender_id' => Auth::id(),
                            'type' => 'mention',
                            'notifiable_type' => 'App\\Models\\Post',
                            'notifiable_id' => $post->id,
                            'data' => [
                                'post_id' => $post->id,
                                'message' => Auth::user()->name . " mentioned you in a post",
                            ],
                        ]);
                    }
                }
            }
        }

        // Repost notification
        if (!empty($validated['repost_of_id'])) {
            $originalPost = Post::find($validated['repost_of_id']);
            if ($originalPost && $originalPost->user_id !== Auth::id()) {
                Ripple::create([
                    'user_id' => $originalPost->user_id,
                    'sender_id' => Auth::id(),
                    'type' => 'repost',
                    'notifiable_type' => 'App\\Models\\Post',
                    'notifiable_id' => $post->id,
                    'data' => [
                        'post_id' => $post->id,
                        'original_post_id' => $originalPost->id,
                        'message' => Auth::user()->name . " reposted your post",
                    ],
                ]);
            }
        }

        return redirect()->route('dashboard')->with('status', 'post-created');
    }

    /**
     * Update an existing post.
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'visibility' => 'required|in:public,followers,private,close_friends',
            'location_tag' => 'nullable|string|max:100',
            'flow_velocity' => 'nullable|in:high,steady,low',
        ]);

        $post->update($validated);

        return back()->with('status', 'post-updated');
    }

    /**
     * Pin/unpin a post.
     */
    public function pin(Post $post): JsonResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        // If already pinned, unpin it
        if ($post->is_pinned) {
            $post->update(['is_pinned' => false]);
            return response()->json(['pinned' => false]);
        }

        // Unpin any currently pinned post by this user
        Post::where('user_id', Auth::id())
            ->where('is_pinned', true)
            ->update(['is_pinned' => false]);

        // Pin this post
        $post->update(['is_pinned' => true]);

        return response()->json(['pinned' => true]);
    }

    /**
     * Delete a post (soft delete).
     */
    public function destroy(Post $post): RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        foreach ($post->media as $media) {
            $storagePath = $media->url;
            Storage::disk('public')->delete($storagePath);
        }

        $post->delete();

        return back()->with('status', 'post-deleted');
    }
    private function getReactionCounts(Post $post): array
    {
        $counts = $post->reactions()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        // Handle legacy 'like' type mapping
        if (isset($counts['like'])) {
            $counts['wave'] = ($counts['wave'] ?? 0) + $counts['like'];
            unset($counts['like']);
        }

        $total = array_sum($counts);

        return [
            'wave' => $counts['wave'] ?? 0,
            'fire' => $counts['fire'] ?? 0,
            'haha' => $counts['haha'] ?? 0,
            'sad' => $counts['sad'] ?? 0,
            'wow' => $counts['wow'] ?? 0,
            'total' => $total,
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\School;
use App\Models\Event;
use App\Models\Hashtag;
use App\Models\SearchHistory;
use App\Models\ExploreCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SearchController extends Controller
{
    /**
     * Render the Explore / Discovery page with server-side data.
     */
    public function explore()
    {
        $user = Auth::user();
        $allBlockedIds = array_unique(array_merge(
            $user->blockedUsers()->pluck('users.id')->toArray(),
            $user->blockedBy()->pluck('users.id')->toArray()
        ));

        // Featured posts — high-engagement public posts with media from the last 3 days
        $featuredPosts = Post::with(['user:id,name,username,profile_picture', 'media', 'school:id,name', 'hashtags:id,name'])
            ->where('visibility', 'public')
            ->whereNotIn('user_id', $allBlockedIds)
            ->where('created_at', '>=', now()->subDays(3))
            ->whereHas('media') // must have at least one image
            ->withCount(['reactions', 'comments'])
            ->orderByRaw('(reactions_count * 2) + comments_count DESC')
            ->limit(4)
            ->get();

        // If not enough featured posts with media, fill with any high-engagement posts
        if ($featuredPosts->count() < 3) {
            $moreIds = $featuredPosts->pluck('id')->toArray();
            $morePosts = Post::with(['user:id,name,username,profile_picture', 'media', 'school:id,name', 'hashtags:id,name'])
                ->where('visibility', 'public')
                ->whereNotIn('user_id', $allBlockedIds)
                ->whereNotIn('id', $moreIds)
                ->withCount(['reactions', 'comments'])
                ->orderByRaw('(reactions_count * 2) + comments_count DESC')
                ->limit(4 - $featuredPosts->count())
                ->get();
            $featuredPosts = $featuredPosts->merge($morePosts);
        }

        // Trending hashtags (last 24h)
        $trendingHashtags = Cache::remember('trending_hashtags_explore', 900, function () {
            return DB::table('post_hashtags')
                ->join('posts', 'post_hashtags.post_id', '=', 'posts.id')
                ->join('hashtags', 'post_hashtags.hashtag_id', '=', 'hashtags.id')
                ->where('posts.created_at', '>=', now()->subDay())
                ->whereNull('posts.deleted_at')
                ->select('hashtags.id', 'hashtags.name', DB::raw('COUNT(*) as post_count'))
                ->groupBy('hashtags.id', 'hashtags.name')
                ->orderByDesc('post_count')
                ->limit(8)
                ->get();
        });

        // Trending posts for the feed section
        $trendingPosts = Post::with(['user:id,name,username,profile_picture', 'media', 'school:id,name'])
            ->where('visibility', 'public')
            ->whereNotIn('user_id', $allBlockedIds)
            ->where('created_at', '>=', now()->subDays(2))
            ->withCount(['reactions', 'comments', 'bookmarks'])
            ->withExists(['bookmarks as is_bookmarked' => function ($q) {
                $q->where('user_id', Auth::id());
            }])
            ->orderByRaw('(reactions_count * 2) + comments_count DESC')
            ->limit(15)
            ->get();

        // Add user reaction to trending posts
        $trendingPosts->transform(function ($post) {
            $userId = Auth::id();
            $userReaction = $post->reactions()->where('user_id', $userId)->first();
            $post->user_reaction = $userReaction ? $userReaction->type : null;
            $counts = $post->reactions()
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();
            if (isset($counts['like'])) {
                $counts['wave'] = ($counts['wave'] ?? 0) + $counts['like'];
                unset($counts['like']);
            }
            $post->reaction_counts = [
                'wave' => $counts['wave'] ?? 0,
                'fire' => $counts['fire'] ?? 0,
                'haha' => $counts['haha'] ?? 0,
                'sad' => $counts['sad'] ?? 0,
                'wow' => $counts['wow'] ?? 0,
                'total' => array_sum($counts),
            ];
            return $post;
        });

        // Recommended schools
        $joinedSchoolIds = $user->schools()->pluck('schools.id')->toArray();
        $recommendedSchools = School::withCount('members')
            ->whereNotIn('id', $joinedSchoolIds)
            ->where('privacy', 'public')
            ->orderByDesc('members_count')
            ->limit(4)
            ->get();

        // Collections
        $collections = ExploreCollection::where('is_active', true)
            ->orderBy('display_order')
            ->limit(6)
            ->get();

        return Inertia::render('Explore', [
            'featuredPosts' => $featuredPosts,
            'trendingHashtags' => $trendingHashtags,
            'trendingPosts' => $trendingPosts,
            'recommendedSchools' => $recommendedSchools,
            'collections' => $collections,
        ]);
    }

    /**
     * Global search with type filter.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $type  = $request->input('type', 'all');
        $user  = Auth::user();

        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds   = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds  = array_unique(array_merge($blockedByMeIds, $blockedMeIds));

        // Save search history
        if ($query !== '' && $type !== 'all_inline') {
            SearchHistory::create([
                'user_id' => $user->id,
                'query' => $query,
            ]);
            // Keep only last 10
            $excess = SearchHistory::where('user_id', $user->id)
                ->orderByDesc('searched_at')
                ->skip(10)
                ->pluck('id');
            if ($excess->count() > 0) {
                SearchHistory::whereIn('id', $excess)->delete();
            }
        }

        $results = [];

        if (in_array($type, ['all', 'people'])) {
            $people = User::select('id', 'name', 'username', 'profile_picture', 'bio', 'location', 'privacy_setting', 'background_picture')
                ->where('id', '!=', $user->id)
                ->whereNotIn('id', $allBlockedIds)
                ->when($query, function ($q) use ($query) {
                    $q->where(function ($sub) use ($query) {
                        $sub->where('name', 'like', "%{$query}%")
                            ->orWhere('username', 'like', "%{$query}%");
                    });
                })
                ->limit(20)
                ->get();

            $people->transform(function ($u) use ($user) {
                $u->is_following = $user->isFollowing($u);
                $u->is_friend = $user->isFriend($u);
                $u->friendship_status = $u->is_friend ? 'friends' : 'none';
                return $u;
            });

            $results['people'] = $people;
        }

        if (in_array($type, ['all', 'posts'])) {
            $posts = Post::with(['user:id,name,username,profile_picture', 'media'])
                ->whereNotIn('user_id', $allBlockedIds)
                ->where('visibility', 'public')
                ->when($query, fn($q) => $q->where('content', 'like', "%{$query}%"))
                ->withCount(['comments', 'reactions'])
                ->latest()
                ->limit(20)
                ->get();

            $results['posts'] = $posts;
        }

        if (in_array($type, ['all', 'schools'])) {
            $schools = School::withCount('members')
                ->when($query, fn($q) => $q->where('name', 'like', "%{$query}%"))
                ->limit(20)
                ->get();

            $results['schools'] = $schools;
        }

        if (in_array($type, ['all', 'events'])) {
            $events = Event::with(['school:id,name', 'creator:id,name'])
                ->when($query, fn($q) => $q->where('title', 'like', "%{$query}%"))
                ->upcoming()
                ->limit(20)
                ->get();

            $results['events'] = $events;
        }

        if (in_array($type, ['all', 'hashtags'])) {
            $hashtags = Hashtag::when($query, fn($q) => $q->where('name', 'like', "%{$query}%"))
                ->withCount('posts')
                ->orderByDesc('posts_count')
                ->limit(20)
                ->get();

            $results['hashtags'] = $hashtags;
        }

        return response()->json($results);
    }

    /**
     * Trending hashtags (cached 15 min).
     */
    public function trendingHashtags(): JsonResponse
    {
        $trending = Cache::remember('trending_hashtags', 900, function () {
            return DB::table('post_hashtags')
                ->join('posts', 'post_hashtags.post_id', '=', 'posts.id')
                ->join('hashtags', 'post_hashtags.hashtag_id', '=', 'hashtags.id')
                ->where('posts.created_at', '>=', now()->subDay())
                ->whereNull('posts.deleted_at')
                ->select('hashtags.id', 'hashtags.name', DB::raw('COUNT(*) as post_count'))
                ->groupBy('hashtags.id', 'hashtags.name')
                ->orderByDesc('post_count')
                ->limit(10)
                ->get();
        });

        return response()->json($trending);
    }

    /**
     * Trending posts (cached 10 min).
     */
    public function trendingPosts(): JsonResponse
    {
        $user = Auth::user();
        $allBlockedIds = array_unique(array_merge(
            $user->blockedUsers()->pluck('users.id')->toArray(),
            $user->blockedBy()->pluck('users.id')->toArray()
        ));

        $posts = Cache::remember('trending_posts_' . $user->id, 600, function () use ($allBlockedIds) {
            return Post::with(['user:id,name,username,profile_picture', 'media'])
                ->where('created_at', '>=', now()->subDay())
                ->where('visibility', 'public')
                ->whereNotIn('user_id', $allBlockedIds)
                ->withCount(['reactions', 'comments'])
                ->orderByRaw('(reactions_count * 2) + comments_count DESC')
                ->limit(10)
                ->get();
        });

        return response()->json($posts);
    }

    /**
     * Nearby users based on location.
     */
    public function nearbyUsers(): JsonResponse
    {
        $user = Auth::user();

        if (!$user->location) {
            return response()->json([]);
        }

        $allBlockedIds = array_unique(array_merge(
            $user->blockedUsers()->pluck('users.id')->toArray(),
            $user->blockedBy()->pluck('users.id')->toArray()
        ));

        // Extract city (heuristic: last part or first part before comma)
        $city = trim(explode(',', $user->location)[0]);

        $nearby = User::select('id', 'name', 'username', 'profile_picture', 'location', 'bio')
            ->where('id', '!=', $user->id)
            ->whereNotIn('id', $allBlockedIds)
            ->where('location', 'LIKE', "%{$city}%")
            ->limit(12)
            ->get();

        $nearby->transform(function ($u) use ($user) {
            $u->is_following = $user->isFollowing($u);
            $u->is_friend = $user->isFriend($u);
            return $u;
        });

        return response()->json($nearby);
    }

    /**
     * Recommended schools.
     */
    public function recommendedSchools(): JsonResponse
    {
        $user = Auth::user();
        $joinedSchoolIds = $user->schools()->pluck('schools.id')->toArray();
        $friendIds = $user->friends()->pluck('users.id')->toArray();
        $interestIds = $user->interestTags()->pluck('interest_tags.id')->toArray();

        $schools = School::withCount('members')
            ->whereNotIn('id', $joinedSchoolIds)
            ->limit(30)
            ->get();

        $scored = [];
        foreach ($schools as $school) {
            $score = 0;

            // Friends who are members (3pts each)
            if (!empty($friendIds)) {
                $friendMembers = $school->members()->whereIn('users.id', $friendIds)->count();
                $score += $friendMembers * 3;
            }

            // Public school bonus (1pt)
            if ($school->privacy === 'public') {
                $score += 1;
            }

            // Same location (2pts)
            if ($user->location && $school->description && str_contains(strtolower($school->description), strtolower($user->location))) {
                $score += 2;
            }

            if ($score > 0) {
                $scored[] = ['school' => $school, 'score' => $score];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        $scored = array_slice($scored, 0, 6);

        return response()->json(array_map(fn($s) => $s['school'], $scored));
    }

    /**
     * Mention search for @ autocomplete.
     */
    public function mentionSearch(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        $user = Auth::user();

        $allBlockedIds = array_unique(array_merge(
            $user->blockedUsers()->pluck('users.id')->toArray(),
            $user->blockedBy()->pluck('users.id')->toArray()
        ));

        $users = User::select('id', 'name', 'username', 'profile_picture')
            ->where('id', '!=', $user->id)
            ->whereNotIn('id', $allBlockedIds)
            ->where(function ($sub) use ($q) {
                $sub->where('username', 'like', "{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get();

        return response()->json($users);
    }

    /**
     * Search history.
     */
    public function searchHistory(): JsonResponse
    {
        $history = SearchHistory::where('user_id', Auth::id())
            ->orderByDesc('searched_at')
            ->limit(10)
            ->get();

        return response()->json($history);
    }

    /**
     * Delete a search history entry.
     */
    public function deleteSearchHistory(int $id): JsonResponse
    {
        SearchHistory::where('id', $id)->where('user_id', Auth::id())->delete();
        return response()->json(['deleted' => true]);
    }

    /**
     * Clear all search history.
     */
    public function clearSearchHistory(): JsonResponse
    {
        SearchHistory::where('user_id', Auth::id())->delete();
        return response()->json(['cleared' => true]);
    }

    /**
     * Get explore collections.
     */
    public function collections(): JsonResponse
    {
        $collections = ExploreCollection::where('is_active', true)
            ->orderBy('display_order')
            ->get();

        return response()->json($collections);
    }

    /**
     * Get posts for a collection.
     */
    public function collectionPosts(ExploreCollection $collection): JsonResponse
    {
        $hashtagIds = $collection->hashtag_ids ?? [];

        if (empty($hashtagIds)) {
            // Fallback: search posts by collection name
            $posts = Post::with(['user:id,name,username,profile_picture', 'media'])
                ->where('visibility', 'public')
                ->where('content', 'LIKE', "%{$collection->name}%")
                ->withCount(['comments', 'reactions'])
                ->latest()
                ->paginate(15);
        } else {
            $posts = Post::with(['user:id,name,username,profile_picture', 'media'])
                ->whereHas('hashtags', fn($q) => $q->whereIn('hashtags.id', $hashtagIds))
                ->where('visibility', 'public')
                ->withCount(['comments', 'reactions'])
                ->latest()
                ->paginate(15);
        }

        return response()->json($posts);
    }
}

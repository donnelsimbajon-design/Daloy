<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InterestTag;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SuggestionController extends Controller
{
    /**
     * Get follow/friend suggestions based on weighted scoring.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $friendIds = $user->friends()->pluck('users.id')->toArray();
        $followingIds = $user->following()->pluck('users.id')->toArray();
        $blockedByMeIds = $user->blockedUsers()->pluck('users.id')->toArray();
        $blockedMeIds = $user->blockedBy()->pluck('users.id')->toArray();
        $allBlockedIds = array_unique(array_merge($blockedByMeIds, $blockedMeIds));
        $excludeIds = array_unique(array_merge($friendIds, $allBlockedIds, [$user->id]));

        $userSchoolIds = $user->schools()->pluck('schools.id')->toArray();
        $userInterestIds = $user->interestTags()->pluck('interest_tags.id')->toArray();

        // Candidates: exclude friends, blocked, self
        $candidates = User::whereNotIn('id', $excludeIds)
            ->select('id', 'name', 'username', 'profile_picture', 'location', 'bio')
            ->limit(100)
            ->get();

        $suggestions = [];

        foreach ($candidates as $candidate) {
            $score = 0;

            // Friend of friend (3pts)
            $candidateFriendIds = DB::table('friends')
                ->where('user_id', $candidate->id)
                ->pluck('friend_id')->toArray();
            $fofCount = count(array_intersect($candidateFriendIds, $friendIds));
            $score += $fofCount * 3;

            // Same school (2pts)
            $candidateSchoolIds = DB::table('school_members')
                ->where('user_id', $candidate->id)
                ->pluck('school_id')->toArray();
            $sameSchoolCount = count(array_intersect($candidateSchoolIds, $userSchoolIds));
            $score += $sameSchoolCount * 2;

            // Same location (1pt)
            if ($user->location && $candidate->location && str_contains(strtolower($candidate->location), strtolower($user->location))) {
                $score += 1;
            }

            // Same interests (2pts each)
            if (!empty($userInterestIds)) {
                $candidateInterestIds = DB::table('user_interest_tags')
                    ->where('user_id', $candidate->id)
                    ->pluck('tag_id')->toArray();
                $sharedInterests = count(array_intersect($candidateInterestIds, $userInterestIds));
                $score += $sharedInterests * 2;
            }

            // Mutual friends count
            $mutualCount = count(array_intersect($candidateFriendIds, $friendIds));

            if ($score > 0) {
                $suggestions[] = [
                    'user' => $candidate,
                    'score' => $score,
                    'mutual_friends' => $mutualCount,
                    'is_following' => in_array($candidate->id, $followingIds),
                ];
            }
        }

        // Sort by score descending, take top 10
        usort($suggestions, fn($a, $b) => $b['score'] <=> $a['score']);
        $suggestions = array_slice($suggestions, 0, 10);

        return response()->json($suggestions);
    }
}

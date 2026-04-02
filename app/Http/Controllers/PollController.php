<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Models\PollOption;
use App\Models\PollVote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PollController extends Controller
{
    /**
     * Vote on a poll option.
     */
    public function vote(Request $request, Poll $poll): JsonResponse
    {
        $request->validate([
            'option_id' => 'required|exists:poll_options,id',
        ]);

        $user = Auth::user();

        // Check if poll is expired
        if ($poll->isExpired()) {
            return response()->json(['message' => 'This poll has expired.'], 422);
        }

        // Check if user already voted
        $existingVote = PollVote::where('poll_id', $poll->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingVote) {
            return response()->json(['message' => 'You have already voted in this poll.'], 422);
        }

        // Verify option belongs to this poll
        $option = PollOption::where('id', $request->option_id)
            ->where('poll_id', $poll->id)
            ->firstOrFail();

        // Create vote
        PollVote::create([
            'poll_id' => $poll->id,
            'option_id' => $option->id,
            'user_id' => $user->id,
        ]);

        // Increment vote count
        $option->increment('votes_count');

        // Return updated poll data
        $poll->load('options');
        $totalVotes = $poll->options->sum('votes_count');

        $options = $poll->options->map(function ($opt) use ($totalVotes) {
            return [
                'id' => $opt->id,
                'label' => $opt->label,
                'votes_count' => $opt->votes_count,
                'percentage' => $totalVotes > 0 ? round(($opt->votes_count / $totalVotes) * 100) : 0,
            ];
        });

        return response()->json([
            'voted' => true,
            'voted_option_id' => $option->id,
            'options' => $options,
            'total_votes' => $totalVotes,
        ]);
    }
}

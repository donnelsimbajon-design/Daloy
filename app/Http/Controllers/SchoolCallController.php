<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolCurrent;
use App\Models\SchoolCurrentVote;
use App\Models\SchoolCurrentTrack;
use App\Models\SchoolCurrentParticipant;
use App\Models\SchoolCurrentMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use CyberDeep\LaravelAgoraTokenGenerator\Services\Agora;

class SchoolCallController extends Controller
{
    /**
     * Start a School Currents session (Admin/Moderator only).
     */
    public function start(School $school, Request $request)
    {
        $user = Auth::user();

        $isAuthorized = $school->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['admin', 'moderator'])
            ->exists();

        if (!$isAuthorized) {
            return response()->json(['error' => 'Not authorized to start a session.'], 403);
        }

        $trackUrl = $request->input('track_url');
        $sessionName = $request->input('session_name', 'Untitled Broadcast');
        $trackType = $this->detectTrackType($trackUrl);
        $trackTitle = $this->fetchTrackTitle($trackUrl, $trackType);

        $session = SchoolCurrent::updateOrCreate(
            ['school_id' => $school->id, 'is_active' => true],
            [
                'admin_id' => $user->id,
                'channel_name' => "school_current_{$school->id}_" . time(),
                'session_name' => $sessionName,
                'current_track_title' => $trackTitle,
                'track_url' => $trackUrl,
                'track_type' => $trackType,
                'is_active' => true
            ]
        );

        // Register admin as first participant
        SchoolCurrentParticipant::updateOrCreate(
            ['school_current_id' => $session->id, 'user_id' => $user->id],
            ['last_heartbeat' => now()]
        );

        return response()->json([
            'session' => $session->load('tracks.addedBy'),
            'token' => $this->generateAgoraToken($session->channel_name, $user->id),
            'app_id' => config('services.agora.app_id')
        ]);
    }

    /**
     * Join an active session.
     */
    public function join(School $school)
    {
        $session = SchoolCurrent::where('school_id', $school->id)
            ->where('is_active', true)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'No active session found.'], 404);
        }

        $user = Auth::user();

        // Register as participant
        SchoolCurrentParticipant::updateOrCreate(
            ['school_current_id' => $session->id, 'user_id' => $user->id],
            ['last_heartbeat' => now()]
        );

        $token = $this->generateAgoraToken($session->channel_name, $user->id);

        return response()->json([
            'session' => $session->load('tracks.addedBy'),
            'token' => $token,
            'app_id' => config('services.agora.app_id'),
            'blocked_ids' => $user->blockedUsers()->pluck('users.id')
                ->merge($user->blockedBy()->pluck('users.id'))
        ]);
    }

    /**
     * Leave the session. Handles host succession.
     */
    public function leave(School $school)
    {
        $session = SchoolCurrent::where('school_id', $school->id)
            ->where('is_active', true)
            ->first();

        if (!$session) {
            return response()->json(['status' => 'no_session']);
        }

        $userId = Auth::id();

        // Remove this participant
        SchoolCurrentParticipant::where('school_current_id', $session->id)
            ->where('user_id', $userId)
            ->delete();

        // If the leaving user is the host (admin), promote the next person
        if ($session->admin_id === $userId) {
            $nextHost = SchoolCurrentParticipant::where('school_current_id', $session->id)
                ->oldest('created_at')
                ->first();

            if ($nextHost) {
                $session->update(['admin_id' => $nextHost->user_id]);
                return response()->json([
                    'status' => 'left',
                    'host_transferred' => true,
                    'new_host_id' => $nextHost->user_id
                ]);
            } else {
                // No one left, end the session
                $session->update(['is_active' => false]);
                return response()->json(['status' => 'session_ended']);
            }
        }

        return response()->json(['status' => 'left']);
    }

    /**
     * Heartbeat + live state poll. Frontend calls this every 4 seconds.
     */
    public function liveState(School $school, Request $request)
    {
        $session = SchoolCurrent::where('school_id', $school->id)
            ->where('is_active', true)
            ->first();

        if (!$session) {
            return response()->json(['active' => false]);
        }

        $user = Auth::user();

        // Update heartbeat
        SchoolCurrentParticipant::updateOrCreate(
            ['school_current_id' => $session->id, 'user_id' => $user->id],
            ['last_heartbeat' => now()]
        );

        // Prune stale participants (no heartbeat in 20s)
        SchoolCurrentParticipant::where('school_current_id', $session->id)
            ->where('last_heartbeat', '<', now()->subSeconds(20))
            ->delete();

        // Get active participants with user info
        $participants = SchoolCurrentParticipant::where('school_current_id', $session->id)
            ->with('user:id,name,profile_picture')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->user->id,
                'name' => $p->user->name,
                'profile_picture' => $p->user->profile_picture,
                'is_host' => $p->user->id === $session->admin_id,
            ]);

        // Get votes
        $votes = SchoolCurrentVote::where('school_current_id', $session->id)
            ->with('user:id,name,profile_picture')
            ->get()
            ->groupBy('vote')
            ->map(fn ($group) => $group->map(fn ($v) => [
                'id' => $v->user->id,
                'name' => $v->user->name,
                'avatar' => $v->user->profile_picture,
            ])->values());

        // Get recent chat messages
        $afterId = $request->input('after_message_id', 0);
        $messages = SchoolCurrentMessage::where('school_current_id', $session->id)
            ->where('id', '>', $afterId)
            ->with('user:id,name,profile_picture')
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'user_name' => $m->user->name,
                'user_avatar' => $m->user->profile_picture,
                'message' => $m->message,
                'created_at' => $m->created_at->diffForHumans(),
            ]);

        return response()->json([
            'active' => true,
            'session' => $session->load('tracks.addedBy'),
            'participants' => $participants,
            'listener_count' => $participants->count(),
            'votes' => [
                'good' => $votes->get('good', collect())->toArray(),
                'bad' => $votes->get('bad', collect())->toArray(),
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a chat message.
     */
    public function sendMessage(School $school, Request $request)
    {
        $request->validate(['message' => 'required|string|max:500']);
        $session = SchoolCurrent::where('school_id', $school->id)->where('is_active', true)->firstOrFail();

        $m = SchoolCurrentMessage::create([
            'school_current_id' => $session->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
        ]);

        $m->load('user');

        return response()->json([
            'status' => 'sent',
            'message' => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'user_name' => $m->user->name,
                'user_avatar' => $m->user->profile_picture,
                'message' => $m->message,
                'created_at' => $m->created_at->diffForHumans(),
            ]
        ]);
    }

    /**
     * Add a track to playlist (host only).
     */
    public function addTrack(School $school, Request $request)
    {
        $session = SchoolCurrent::where('school_id', $school->id)->where('is_active', true)->firstOrFail();
        if ($session->admin_id !== Auth::id()) {
            return response()->json(['error' => 'Only the current DJ can add tracks.'], 403);
        }

        $trackUrl = $request->input('track_url');
        if (!$trackUrl) return response()->json(['error' => 'URL required'], 400);

        $trackType = $this->detectTrackType($trackUrl);
        $trackTitle = $this->fetchTrackTitle($trackUrl, $trackType);

        SchoolCurrentTrack::create([
            'school_current_id' => $session->id,
            'added_by' => Auth::id(),
            'track_title' => $trackTitle,
            'track_url' => $trackUrl,
            'track_type' => $trackType,
            'status' => 'pending'
        ]);

        return response()->json(['status' => 'added', 'session' => $session->load('tracks.addedBy')]);
    }

    /**
     * Play a specific track or next in queue (host only).
     */
    public function playNext(School $school, Request $request)
    {
        $session = SchoolCurrent::where('school_id', $school->id)->where('is_active', true)->firstOrFail();
        if ($session->admin_id !== Auth::id()) {
            return response()->json(['error' => 'Only the current DJ can control playback.'], 403);
        }

        $trackId = $request->input('track_id');
        $track = $trackId
            ? SchoolCurrentTrack::where('school_current_id', $session->id)->findOrFail($trackId)
            : SchoolCurrentTrack::where('school_current_id', $session->id)->where('status', 'pending')->oldest()->first();

        if (!$track) return response()->json(['error' => 'No tracks in queue'], 404);

        SchoolCurrentTrack::where('school_current_id', $session->id)->where('status', 'playing')->update(['status' => 'played']);
        $track->update(['status' => 'playing']);

        $session->update([
            'current_track_title' => $track->track_title,
            'track_url' => $track->track_url,
            'track_type' => $track->track_type,
        ]);

        // Clear votes for new track
        SchoolCurrentVote::where('school_current_id', $session->id)->delete();

        return response()->json(['status' => 'playing', 'session' => $session->load('tracks.addedBy')]);
    }

    /**
     * Vote on current track.
     */
    public function vote(School $school, Request $request)
    {
        $request->validate(['vote' => 'required|in:good,bad']);
        $session = SchoolCurrent::where('school_id', $school->id)->where('is_active', true)->firstOrFail();

        SchoolCurrentVote::updateOrCreate(
            ['school_current_id' => $session->id, 'user_id' => Auth::id()],
            ['vote' => $request->vote]
        );

        return response()->json(['status' => 'voted', 'vote' => $request->vote]);
    }

    /**
     * End the session (host only).
     */
    public function end(School $school)
    {
        $session = SchoolCurrent::where('school_id', $school->id)->where('is_active', true)->first();

        if ($session && ($session->admin_id === Auth::id())) {
            $session->update(['is_active' => false]);
            SchoolCurrentParticipant::where('school_current_id', $session->id)->delete();
            return response()->json(['status' => 'ended']);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    // ── Private Helpers ──────────────────────────────────────────────────

    private function detectTrackType(?string $url): ?string
    {
        if (!$url) return null;
        $lower = strtolower($url);
        if (str_contains($lower, 'youtube.com') || str_contains($lower, 'youtu.be')) return 'youtube';
        if (str_contains($lower, 'open.spotify.com')) return 'spotify';
        return 'mp3';
    }

    private function fetchTrackTitle(?string $url, ?string $type): string
    {
        if ($type === 'youtube' || $type === 'spotify') {
            try {
                $res = \Illuminate\Support\Facades\Http::get('https://noembed.com/embed', ['url' => $url]);
                if ($res->successful() && $res->json('title')) return $res->json('title');
            } catch (\Exception $e) {}
        } elseif ($type === 'mp3') {
            return basename(parse_url($url, PHP_URL_PATH) ?? 'Unknown MP3');
        }
        return 'Untitled Track';
    }

    private function generateAgoraToken(string $channelName, int $uid): string
    {
        try {
            return Agora::make((string) $uid)
                ->channel($channelName)
                ->join(false)
                ->audioOnly(true)
                ->token();
        } catch (\Exception $e) {
            Log::error("Failed to generate Agora token: " . $e->getMessage());
            return "DEVELOPMENT_TOKEN";
        }
    }
}

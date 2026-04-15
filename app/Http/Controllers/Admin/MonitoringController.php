<?php

namespace App\Http\Controllers\Admin;

use App\Models\AdminContentInspection;
use App\Models\CallLog;
use App\Models\Conversation;
use App\Models\ModerationAction;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonitoringController extends BaseAdminController
{
    /* ── Hub Page ─────────────────────────────────────────────────── */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'messages');

        $activeStories = Story::whereNull('archived_at')
            ->where('expires_at', '>', now())
            ->count();

        $expiredLast7d = Story::where('expires_at', '<', now())
            ->where('expires_at', '>', now()->subDays(7))
            ->count();

        $activeLives = \App\Models\SchoolCurrent::where('is_active', true)->count();

        $inspectionsToday = AdminContentInspection::whereDate('inspected_at', today())->count();

        // Latest stories (10)
        $stories = Story::with('user:id,name,username,profile_picture')
            ->whereNull('archived_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->take(12)
            ->get()
            ->map(fn($s) => [
                'id'          => $s->id,
                'type'        => $s->type ?? 'image',
                'media_url'   => $s->media_url,
                'text_content'=> $s->content ?? null,
                'user'        => $s->user ? [
                    'id'              => $s->user->id,
                    'name'            => $s->user->name,
                    'username'        => $s->user->username,
                    'profile_picture' => $s->user->profile_picture,
                ] : null,
                'created_at'  => $s->created_at?->diffForHumans(),
                'expires_at'  => $s->expires_at?->format('M d, H:i'),
            ]);

        // Active live sessions
        $currents = \App\Models\SchoolCurrent::with('school:id,name,profile_image', 'admin:id,name,username')
            ->where('is_active', true)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($c) => [
                'id'            => $c->id,
                'school_id'     => $c->school_id,
                'school_name'   => $c->school?->name,
                'school_image'  => $c->school?->profile_image,
                'host'          => $c->admin?->name ?? 'Unknown',
                'listener_count'=> $c->activeParticipants()->count(),
                'session_name'  => $c->session_name ?? 'Live Session',
                'uptime'        => $c->created_at?->diffForHumans(),
                'track_playing' => $c->current_track_title ?? null,
            ]);

        return Inertia::render('Admin/Monitoring', [
            'stats' => [
                'activeStories'    => $activeStories,
                'expiredLast7d'    => $expiredLast7d,
                'activeLives'      => $activeLives,
                'inspectionsToday' => $inspectionsToday,
            ],
            'stories'  => $stories,
            'currents' => $currents,
        ]);
    }

    /* ── Delete Story ──────────────────────────────────────────────── */
    public function deleteStory(Request $request, $id)
    {
        $this->authorizeAdmin($request, 'messages');
        $request->validate(['reason' => 'nullable|string|max:500']);

        $story = Story::findOrFail($id);
        $admin = $request->user()->admin;

        $story->update(['archived_at' => now()]);

        ModerationAction::create([
            'admin_id'    => $admin->id,
            'action_type' => 'delete_story',
            'target_type' => 'story',
            'target_id'   => $story->id,
            'reason'      => $request->reason ?? 'Admin removed story',
        ]);

        $this->logAction($request, 'Story Deleted', [
            'story_id' => $story->id,
            'user_id'  => $story->user_id,
            'reason'   => $request->reason,
        ]);

        return back()->with('success', 'Story removed.');
    }

    /* ── All Conversations (proactive browse) ─────────────────────── */
    public function conversations(Request $request)
    {
        $this->authorizeAdmin($request, 'messages');

        $search = $request->input('search', '');
        $type   = $request->input('type', 'all'); // 'dm', 'group', 'all'

        $query = Conversation::with('participants:id,name,username,profile_picture')
            ->withCount('messages');

        if ($type === 'dm') {
            $query->where('type', 'direct');
        } elseif ($type === 'group') {
            $query->where('type', 'group');
        }

        if ($search) {
            $query->whereHas('participants', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
            );
        }

        $conversations = $query->latest()->paginate(20)->through(fn($c) => [
            'id'           => $c->id,
            'type'         => $c->type,
            'name'         => $c->name,
            'participants' => $c->participants->map(fn($p) => [
                'id'              => $p->id,
                'name'            => $p->name,
                'username'        => $p->username,
                'profile_picture' => $p->profile_picture,
            ]),
            'messages_count' => $c->messages_count,
            'created_at'     => $c->created_at?->diffForHumans(),
            'flagged'        => $c->flagged_for_review ?? false,
        ]);

        return response()->json($conversations);
    }

    /* ── Inspect Full Thread ──────────────────────────────────────── */
    public function inspectThread(Request $request, $id)
    {
        $this->authorizeAdmin($request, 'messages');
        $request->validate(['reason' => 'required|string|min:5|max:500']);

        $admin = $request->user()->admin;

        // Log the inspection
        AdminContentInspection::create([
            'admin_id'    => $admin->id,
            'target_type' => 'conversation',
            'target_id'   => $id,
            'reason'      => $request->reason,
            'ip_address'  => $request->ip(),
            'inspected_at'=> now(),
        ]);

        $this->logAction($request, 'Conversation Inspected', [
            'conversation_id' => $id,
            'reason'          => $request->reason,
        ]);

        $conversation = Conversation::with('participants:id,name,username,profile_picture')
            ->findOrFail($id);

        $messages = $conversation->messages()
            ->with('user:id,name,username,profile_picture')
            ->oldest()
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'content'    => $m->content,
                'type'       => $m->type ?? 'text',
                'sender'     => $m->user ? [
                    'id'              => $m->user->id,
                    'name'            => $m->user->name,
                    'username'        => $m->user->username,
                    'profile_picture' => $m->user->profile_picture,
                ] : null,
                'created_at' => $m->created_at?->format('M d, Y H:i'),
                'time_ago'   => $m->created_at?->diffForHumans(),
            ]);

        return response()->json([
            'conversation' => [
                'id'           => $conversation->id,
                'type'         => $conversation->type,
                'name'         => $conversation->name,
                'participants' => $conversation->participants->map(fn($p) => [
                    'id'              => $p->id,
                    'name'            => $p->name,
                    'username'        => $p->username,
                    'profile_picture' => $p->profile_picture,
                ]),
            ],
            'messages' => $messages,
        ]);
    }

    /* ── Call Logs ────────────────────────────────────────────────── */
    public function callLogs(Request $request)
    {
        $this->authorizeAdmin($request, 'messages');

        $logs = CallLog::with([
            'initiator:id,name,username,profile_picture',
            'conversation:id,type,name',
        ])
            ->latest('started_at')
            ->paginate(25)
            ->through(fn($l) => [
                'id'               => $l->id,
                'call_type'        => $l->call_type,
                'is_group_call'    => $l->is_group_call,
                'initiated_by'     => $l->initiator ? [
                    'id'              => $l->initiator->id,
                    'name'            => $l->initiator->name,
                    'username'        => $l->initiator->username,
                    'profile_picture' => $l->initiator->profile_picture,
                ] : null,
                'conversation'     => $l->conversation ? [
                    'id'   => $l->conversation->id,
                    'type' => $l->conversation->type,
                    'name' => $l->conversation->name,
                ] : null,
                'duration'         => $l->duration_formatted,
                'duration_seconds' => $l->duration_seconds,
                'started_at'       => $l->started_at?->format('M d, Y H:i'),
                'end_reason'       => $l->end_reason,
                'participant_count'=> count($l->participant_ids ?? []),
            ]);

        return response()->json($logs);
    }

    /* ── Restrict Caller ──────────────────────────────────────────── */
    public function restrictCaller(Request $request, $callLogId)
    {
        $this->authorizeAdmin($request, 'messages');
        $request->validate(['reason' => 'nullable|string|max:500']);

        $log   = CallLog::findOrFail($callLogId);
        $admin = $request->user()->admin;

        User::where('id', $log->initiated_by)->update(['can_initiate_calls' => false]);

        ModerationAction::create([
            'admin_id'    => $admin->id,
            'action_type' => 'restrict_calling',
            'target_type' => 'user',
            'target_id'   => $log->initiated_by,
            'reason'      => $request->reason ?? 'Calling restricted via call log review.',
        ]);

        $this->logAction($request, 'Caller Restricted', [
            'user_id'     => $log->initiated_by,
            'call_log_id' => $callLogId,
            'reason'      => $request->reason,
        ]);

        return response()->json(['success' => true]);
    }
}

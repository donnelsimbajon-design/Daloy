<?php

namespace App\Http\Controllers;

use App\Jobs\BroadcastAnnouncement;
use App\Models\Admin;
use App\Models\AdminLog;
use App\Models\Announcement;
use App\Models\Ripple;
use App\Models\School;
use App\Models\User;
use App\Services\AnnouncementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    // ─── Index ───────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Announcement::with('admin.user:id,name')
            ->withCount([
                'interactions as upvote_count' => fn($q) => $q->where('vote', 'upvote'),
                'interactions as downvote_count' => fn($q) => $q->where('vote', 'downvote'),
            ])
            ->latest();

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            match ($status) {
                'active'     => $query->where('is_active', true)->where('sent_count', '>', 0),
                'scheduled'  => $query->where('is_active', true)->where('sent_count', 0)
                                      ->whereNotNull('scheduled_at')->where('scheduled_at', '>', now()),
                'draft'      => $query->where('is_active', true)->where('sent_count', 0)
                                      ->where(fn($q) => $q->whereNull('scheduled_at')
                                                          ->orWhere('scheduled_at', '<=', now())),
                'expired'    => $query->whereNotNull('expires_at')->where('expires_at', '<', now()),
                'deactivated'=> $query->where('is_active', false),
                default      => null,
            };
        }

        if ($from = $request->input('from')) $query->whereDate('created_at', '>=', $from);
        if ($to = $request->input('to'))     $query->whereDate('created_at', '<=', $to);

        $announcements = $query->paginate(15)->through(fn($a) => $this->formatAnnouncement($a));

        // ── Global stats ──
        $totalInteractions = \App\Models\AnnouncementInteraction::count();
        $totalUpvotes = \App\Models\AnnouncementInteraction::where('vote', 'upvote')->count();
        $globalApproval = $totalInteractions > 0 ? round(($totalUpvotes / $totalInteractions) * 100, 1) : 0;

        $stats = [
            'total'          => Announcement::count(),
            'active'         => Announcement::where('is_active', true)->where('sent_count', '>', 0)->count(),
            'scheduled'      => Announcement::where('is_active', true)->where('sent_count', 0)
                                            ->whereNotNull('scheduled_at')->where('scheduled_at', '>', now())->count(),
            'avgOpenRate'    => $this->computeAvgOpenRate(),
            'approval_rate'  => $globalApproval,
        ];

        $schools = School::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Announcements', [
            'announcements' => $announcements,
            'stats'         => $stats,
            'schools'       => $schools,
            'filters'       => $request->only(['type', 'status', 'from', 'to']),
        ]);
    }

    // ─── Store ───────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:150',
            'message'          => 'required|string|max:2000',
            'type'             => 'required|in:info,warning,critical,maintenance,feature',
            'target_audience'  => 'required|in:all,new_users,active_users,specific_school',
            'school_id'        => 'nullable|exists:schools,id',
            'display_location' => 'required|in:feed,banner,ripple,all',
            'scheduled_at'     => 'nullable|date|after:now',
            'expires_at'       => 'nullable|date',
        ]);

        $admin = $request->user()->admin;

        $announcement = Announcement::create(array_merge($data, ['admin_id' => $admin->id]));

        // If no scheduled_at, broadcast immediately
        if (!$announcement->scheduled_at) {
            BroadcastAnnouncement::dispatch($announcement);
        }

        AdminLog::create([
            'admin_id'   => $admin->id,
            'action'     => 'Create Announcement',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $announcement->title, 'target_id' => $announcement->id],
        ]);

        AnnouncementService::bustCache();

        return back()->with('success', 'Announcement created' . ($announcement->scheduled_at ? ' and scheduled.' : ' and broadcast dispatched.'));
    }

    // ─── Update ──────────────────────────────────────────────────
    public function update(Request $request, Announcement $announcement)
    {
        if ($announcement->sent_count > 0) {
            return back()->with('error', 'Cannot edit an announcement that has already been broadcast.');
        }

        $data = $request->validate([
            'title'            => 'required|string|max:150',
            'message'          => 'required|string|max:2000',
            'type'             => 'required|in:info,warning,critical,maintenance,feature',
            'target_audience'  => 'required|in:all,new_users,active_users,specific_school',
            'school_id'        => 'nullable|exists:schools,id',
            'display_location' => 'required|in:feed,banner,ripple,all',
            'scheduled_at'     => 'nullable|date',
            'expires_at'       => 'nullable|date',
        ]);

        $announcement->update($data);
        AnnouncementService::bustCache();

        return back()->with('success', 'Announcement updated.');
    }

    // ─── Deactivate ──────────────────────────────────────────────
    public function destroy(Announcement $announcement)
    {
        $announcement->update(['is_active' => false]);
        AnnouncementService::bustCache();
        return back()->with('success', 'Announcement archived and will no longer be shown.');
    }

    // ─── Force Delete ────────────────────────────────────────────
    public function forceDelete($id)
    {
        $announcement = Announcement::find($id);
        if (!$announcement) {
            return back()->with('error', 'Announcement not found (may already be deleted).');
        }

        // Remove all interactions first (votes, feedback)
        $announcement->interactions()->delete();

        $announcement->delete();
        AnnouncementService::bustCache();
        return back()->with('success', 'Announcement permanently deleted.');
    }

    // ─── Broadcast Now ───────────────────────────────────────────
    public function broadcast(Request $request, Announcement $announcement)
    {
        if (!$announcement->is_active) {
            return back()->with('error', 'Cannot broadcast a deactivated announcement.');
        }

        BroadcastAnnouncement::dispatch($announcement);

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Broadcast Announcement',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $announcement->title, 'target_id' => $announcement->id],
        ]);

        AnnouncementService::bustCache();
        return back()->with('success', 'Broadcast job dispatched.');
    }

    // ─── Stats ───────────────────────────────────────────────────
    public function stats(Announcement $announcement)
    {
        $recentReaders = Ripple::where('data->announcement_id', $announcement->id)
            ->whereNotNull('read_at')
            ->with('sender:id,name,username,profile_picture')
            ->latest('read_at')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'name'     => $r->sender?->name ?? 'Unknown',
                'username' => $r->sender?->username ?? '',
                'avatar'   => $r->sender?->profile_picture,
                'read_at'  => $r->read_at?->diffForHumans(),
            ]);

        $openRate = $announcement->sent_count > 0
            ? round(($announcement->read_count / $announcement->sent_count) * 100, 1)
            : 0;

        // ── Vote breakdown ──
        $upvotes   = $announcement->interactions()->where('vote', 'upvote')->count();
        $downvotes = $announcement->interactions()->where('vote', 'downvote')->count();
        $totalVotes = $upvotes + $downvotes;
        $approvalRate = $totalVotes > 0 ? round(($upvotes / $totalVotes) * 100, 1) : null;

        // ── User feedback (only those who actually wrote something) ──
        $feedbackEntries = $announcement->interactions()
            ->whereNotNull('feedback')
            ->where('feedback', '!=', '')
            ->with('user:id,name,username,profile_picture')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($i) => [
                'name'     => $i->user?->name ?? 'Unknown',
                'username' => $i->user?->username ?? '',
                'avatar'   => $i->user?->profile_picture,
                'vote'     => $i->vote,
                'feedback' => $i->feedback,
                'time'     => $i->created_at->diffForHumans(),
            ]);

        return response()->json([
            'sent_count'     => $announcement->sent_count,
            'read_count'     => $announcement->read_count,
            'open_rate'      => $openRate,
            'upvotes'        => $upvotes,
            'downvotes'      => $downvotes,
            'total_votes'    => $totalVotes,
            'approval_rate'  => $approvalRate,
            'recent_readers' => $recentReaders,
            'feedback'       => $feedbackEntries,
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────
    private function formatAnnouncement(Announcement $a): array
    {
        $openRate = $a->sent_count > 0
            ? round(($a->read_count / $a->sent_count) * 100, 1)
            : 0;

        return [
            'id'               => $a->id,
            'title'            => $a->title,
            'message'          => $a->message,
            'type'             => $a->type,
            'target_audience'  => $a->target_audience,
            'display_location' => $a->display_location,
            'scheduled_at'     => $a->scheduled_at?->format('M d, Y H:i'),
            'expires_at'       => $a->expires_at?->format('M d, Y H:i'),
            'is_active'        => $a->is_active,
            'sent_count'       => $a->sent_count,
            'read_count'       => $a->read_count,
            'open_rate'        => $openRate,
            'upvote_count'     => $a->upvote_count ?? 0,
            'downvote_count'   => $a->downvote_count ?? 0,
            'status'           => $a->status,
            'created_by'       => $a->admin?->user?->name ?? 'System',
            'created_at'       => $a->created_at->format('M d, Y'),
        ];
    }

    private function computeAvgOpenRate(): float
    {
        $sent = Announcement::where('sent_count', '>', 0)->get();
        if ($sent->isEmpty()) return 0;
        $rates = $sent->map(fn($a) => ($a->read_count / $a->sent_count) * 100);
        return round($rates->average(), 1);
    }
}

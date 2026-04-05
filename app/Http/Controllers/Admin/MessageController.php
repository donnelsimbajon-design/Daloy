<?php

namespace App\Http\Controllers\Admin;

use App\Models\Conversation;
use App\Models\ModerationAction;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessageController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'messages');

        $status = $request->input('status', 'all');

        $query = Report::where(function ($q) {
            $q->where('reportable_type', 'App\\Models\\Message')
              ->orWhere('reportable_type', 'App\\Models\\Conversation');
        });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $reportedConversations = $query
            ->with(['reporter:id,name,username,profile_picture'])
            ->latest()
            ->paginate(15)
            ->through(function ($r) {
                $data = [
                    'id' => $r->id,
                    'reporter' => $r->reporter?->name ?? 'Unknown',
                    'reporter_username' => '@' . ($r->reporter?->username ?? 'unknown'),
                    'reporter_avatar' => $r->reporter?->profile_picture,
                    'reason' => $r->reason,
                    'status' => $r->status,
                    'date' => $r->created_at->format('M d, Y'),
                    'time_ago' => $r->created_at->diffForHumans(),
                    'reportable_type' => class_basename($r->reportable_type ?? ''),
                    'reportable_id' => $r->reportable_id,
                    'evidence_url' => $r->evidence_file_path ? asset('storage/' . $r->evidence_file_path) : null,
                    'conversation' => null,
                    'message_previews' => [],
                    'participants' => [],
                ];

                if ($r->reportable_type === 'App\\Models\\Conversation') {
                    $convo = Conversation::with('participants:id,name,username,profile_picture')
                        ->find($r->reportable_id);
                    if ($convo) {
                        $data['conversation'] = [
                            'id' => $convo->id,
                            'type' => $convo->type,
                            'name' => $convo->name,
                        ];
                        $data['participants'] = $convo->participants->map(fn($p) => [
                            'id' => $p->id,
                            'name' => $p->name,
                            'username' => $p->username,
                            'profile_picture' => $p->profile_picture,
                        ])->toArray();

                        $data['message_previews'] = $convo->messages()
                            ->with('user:id,name')
                            ->latest()
                            ->take(5)
                            ->get()
                            ->reverse()
                            ->values()
                            ->map(fn($m) => [
                                'id' => $m->id,
                                'sender' => $m->user?->name ?? 'Deleted',
                                'content' => \Illuminate\Support\Str::limit($m->content, 120),
                                'time' => $m->created_at->format('H:i'),
                            ])->toArray();
                    }
                }

                return $data;
            });

        $messageReportScope = fn($q) => $q->where('reportable_type', 'App\\Models\\Message')
            ->orWhere('reportable_type', 'App\\Models\\Conversation');

        $counts = [
            'total' => Report::where($messageReportScope)->count(),
            'pending' => Report::where($messageReportScope)->where('status', 'pending')->count(),
            'resolved' => Report::where($messageReportScope)->where('status', 'resolved')->count(),
            'dismissed' => Report::where($messageReportScope)->where('status', 'dismissed')->count(),
        ];

        return Inertia::render('Admin/Messages', [
            'reportedConversations' => $reportedConversations,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    public function action(Request $request, Report $report)
    {
        $this->authorizeAdmin($request, 'messages');

        $request->validate([
            'action' => 'required|in:dismiss,resolve,warn,delete_conversation,restrict_calling',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $admin = $request->user()->admin;

        switch ($request->action) {
            case 'dismiss':
                $report->update([
                    'status' => 'dismissed',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                break;

            case 'resolve':
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                break;

            case 'delete_conversation':
                if ($report->reportable_type === 'App\\Models\\Conversation') {
                    Conversation::find($report->reportable_id)?->delete();
                }
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes ?? 'Conversation deleted by admin.',
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => 'delete_conversation',
                    'target_type' => 'conversation',
                    'target_id' => $report->reportable_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;

            case 'restrict_calling':
                if ($report->reportable_type === 'App\\Models\\Message') {
                    $msg = \App\Models\Message::find($report->reportable_id);
                    $msg?->user?->update(['can_initiate_calls' => false]);
                }
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes ?? 'User calling privileges restricted.',
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => 'restrict_calling',
                    'target_type' => 'message',
                    'target_id' => $report->reportable_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
        }

        $this->logAction($request, 'Message Report ' . ucfirst($request->action), [
            'target' => 'Report #' . $report->id,
            'conversation_id' => $report->reportable_id,
            'action' => $request->action,
            'notes' => $request->admin_notes,
        ]);

        return back()->with('success', 'Report action applied.');
    }
}

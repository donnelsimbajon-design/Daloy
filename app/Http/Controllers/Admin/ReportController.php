<?php

namespace App\Http\Controllers\Admin;

use App\Models\Comment;
use App\Models\ModerationAction;
use App\Models\Post;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'reports');

        $status = $request->input('status', 'all');

        $query = Report::with(['reporter', 'resolver.user']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $reports = $query->latest()->paginate(10)->through(fn($r) => [
            'id' => $r->id,
            'type' => class_basename($r->reportable_type ?? 'Unknown'),
            'reporter' => $r->reporter?->name ?? 'Deleted User',
            'reporter_username' => '@' . ($r->reporter?->username ?? 'unknown'),
            'target' => ucfirst(class_basename($r->reportable_type ?? '')) . ' #' . $r->reportable_id,
            'target_id' => $r->reportable_id,
            'target_type' => $r->reportable_type,
            'reason' => $r->reason,
            'status' => $r->status,
            'admin_notes' => $r->admin_notes,
            'resolver' => $r->resolver?->user?->name,
            'date' => $r->created_at->format('M d, Y H:i'),
            'time_ago' => $r->created_at->diffForHumans(),
        ]);

        $counts = [
            'all' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'dismissed' => Report::where('status', 'dismissed')->count(),
        ];

        return Inertia::render('Admin/Reports', [
            'reports' => $reports,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    public function action(Request $request, Report $report)
    {
        $this->authorizeAdmin($request, 'reports');

        $request->validate([
            'action' => 'required|in:dismiss,warn,remove_content,suspend,ban',
            'admin_notes' => 'nullable|string',
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
            case 'remove_content':
                if ($report->reportable_type === 'App\\Models\\Post') {
                    Post::find($report->reportable_id)?->delete();
                } elseif ($report->reportable_type === 'App\\Models\\Comment') {
                    Comment::find($report->reportable_id)?->delete();
                }
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => 'remove_content',
                    'target_type' => class_basename($report->reportable_type ?? ''),
                    'target_id' => $report->reportable_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
            case 'warn':
            case 'suspend':
            case 'ban':
                $report->update([
                    'status' => 'resolved',
                    'resolved_by' => $admin->id,
                    'admin_notes' => $request->admin_notes,
                ]);
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => "{$request->action}_user",
                    'target_type' => 'user',
                    'target_id' => $report->reporter_id,
                    'reason' => $request->admin_notes ?? $report->reason,
                ]);
                break;
        }

        $this->logAction($request, 'Report ' . ucfirst($request->action), [
            'target' => 'Report #' . $report->id,
            'action' => $request->action,
            'notes' => $request->admin_notes,
        ]);

        return back()->with('success', 'Report action applied.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Models\Comment;
use App\Models\ModerationAction;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModerationController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'content');

        $tab = $request->input('tab', 'posts');

        $posts = Post::with(['user', 'reports'])
            ->withCount(['reports', 'comments'])
            ->latest()
            ->paginate(10, ['*'], 'posts_page')
            ->through(fn($post) => [
                'id' => $post->id,
                'type' => 'Post',
                'author' => $post->user->name,
                'username' => '@' . $post->user->username,
                'profile_picture' => $post->user->profile_picture,
                'content' => \Illuminate\Support\Str::limit($post->content, 200),
                'full_content' => $post->content,
                'media_urls' => $post->media_urls,
                'reports_count' => $post->reports_count,
                'comments_count' => $post->comments_count,
                'flagged' => $post->reports_count > 0,
                'location' => $post->location_tag,
                'date' => $post->created_at->diffForHumans(),
                'created_at' => $post->created_at->toISOString(),
            ]);

        $comments = Comment::with(['user', 'post'])
            ->withCount('reports')
            ->latest()
            ->paginate(10, ['*'], 'comments_page')
            ->through(fn($c) => [
                'id' => $c->id,
                'type' => 'Comment',
                'author' => $c->user->name,
                'username' => '@' . $c->user->username,
                'profile_picture' => $c->user->profile_picture,
                'content' => $c->content,
                'post_id' => $c->post_id,
                'reports_count' => $c->reports_count,
                'flagged' => $c->reports_count > 0,
                'date' => $c->created_at->diffForHumans(),
            ]);

        $lives = \App\Models\SchoolCurrent::with(['school', 'admin'])
            ->withCount('reports')
            ->where('is_active', true)
            ->latest()
            ->paginate(10, ['*'], 'lives_page')
            ->through(fn($l) => [
                'id' => $l->id,
                'type' => 'Live',
                'author' => $l->admin->name ?? 'Unknown',
                'username' => '@' . ($l->admin->username ?? 'unknown'),
                'profile_picture' => $l->admin->profile_picture ?? null,
                'content' => 'Live session: ' . ($l->session_name ?? 'Untitled') . ' in ' . ($l->school->name ?? 'Deleted School'),
                'music_played' => $l->current_track_title,
                'uptime' => $l->created_at->diffForHumans(),
                'track_started' => $l->track_started_at ? \Carbon\Carbon::parse($l->track_started_at)->diffForHumans() : null,
                'school_id' => $l->school_id,
                'reports_count' => $l->reports_count,
                'flagged' => $l->reports_count > 0,
                'date' => $l->created_at->diffForHumans(),
            ]);

        $modLogs = ModerationAction::with('admin.user')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'admin' => $m->admin?->user?->name ?? 'System',
                'action' => ucwords(str_replace('_', ' ', $m->action_type)),
                'target' => ucfirst($m->target_type) . ' #' . $m->target_id,
                'reason' => $m->reason,
                'time' => $m->created_at->diffForHumans(),
            ]);

        $today = Carbon::today();
        $scannedToday = Post::whereDate('created_at', $today)->count() + Comment::whereDate('created_at', $today)->count();
        $removedToday = ModerationAction::whereDate('created_at', $today)
            ->whereIn('action_type', ['delete_post', 'delete_comment', 'hide_post', 'terminate_live'])
            ->count();

        return Inertia::render('Admin/Moderation', [
            'posts' => $posts,
            'comments' => $comments,
            'lives' => $lives,
            'modLogs' => $modLogs,
            'todayStats' => [
                'scanned' => $scannedToday,
                'removed' => $removedToday,
            ],
            'tab' => $tab,
        ]);
    }

    public function action(Request $request)
    {
        $this->authorizeAdmin($request, 'content');

        $request->validate([
            'content_type' => 'required|in:post,comment,live',
            'content_id' => 'required|integer',
            'action' => 'required|in:delete,hide,flag,terminate',
            'reason' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;

        if ($request->content_type === 'post') {
            $post = Post::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $post->delete();
            }
        } elseif ($request->content_type === 'comment') {
            $comment = Comment::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $comment->delete();
            }
        } elseif ($request->content_type === 'live') {
            $live = \App\Models\SchoolCurrent::findOrFail($request->content_id);
            if ($request->action === 'terminate' || $request->action === 'delete') {
                $live->update(['is_active' => false]);
                // Broadcasting termination to websocket could be done here
            }
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => "{$request->action}_{$request->content_type}",
            'target_type' => $request->content_type,
            'target_id' => $request->content_id,
            'reason' => $request->reason,
        ]);

        $this->logAction($request, ucfirst($request->action) . ' ' . ucfirst($request->content_type), [
            'target' => ucfirst($request->content_type) . ' #' . $request->content_id,
            'reason' => $request->reason,
        ]);

        return back()->with('success', 'Content moderated successfully.');
    }
}

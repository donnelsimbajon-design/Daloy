<?php

namespace App\Http\Controllers\Moderator;

use App\Models\Comment;
use App\Models\ModerationAction;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModerationController extends BaseModeratorController
{
    public function index(Request $request)
    {
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
                'content' => $c->content,
                'post_id' => $c->post_id,
                'reports_count' => $c->reports_count,
                'flagged' => $c->reports_count > 0,
                'date' => $c->created_at->diffForHumans(),
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
            ->whereIn('action_type', ['delete_post', 'delete_comment', 'hide_post'])
            ->count();

        return Inertia::render('Moderator/Moderation', [
            'posts' => $posts,
            'comments' => $comments,
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
        $request->validate([
            'content_type' => 'required|in:post,comment',
            'content_id' => 'required|integer',
            'action' => 'required|in:delete,hide,flag',
            'reason' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;

        if ($request->content_type === 'post') {
            $post = Post::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $post->delete();
            }
        } else {
            $comment = Comment::findOrFail($request->content_id);
            if ($request->action === 'delete') {
                $comment->delete();
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

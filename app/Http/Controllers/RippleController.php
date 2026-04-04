<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ripple;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RippleController extends Controller
{
    /**
     * Get latest unread ripples since a timestamp (for toast notifications).
     */
    public function latest(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isNotificationsSnoozed()) {
            return response()->json([]);
        }

        $since = $request->input('since', now()->subSeconds(10)->toIso8601String());

        $ripples = Ripple::where('user_id', $user->id)
            ->whereNull('read_at')
            ->where('created_at', '>=', $since)
            ->with('sender:id,name,username,profile_picture')
            ->latest()
            ->take(5)
            ->get();

        return response()->json($ripples);
    }

    /**
     * Get unread count (for polling badge updates).
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        if ($user->isNotificationsSnoozed()) {
            return response()->json(['count' => 0]);
        }

        $count = Ripple::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Full ripples page with all notification types.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $ripples = Ripple::where('user_id', $user->id)
            ->with('sender:id,name,username,profile_picture')
            ->latest()
            ->paginate(20)
            ->through(fn($r) => [
                'id' => $r->id,
                'type' => $r->type,
                'sender' => $r->sender ? [
                    'id' => $r->sender->id,
                    'name' => $r->sender->name,
                    'username' => $r->sender->username,
                    'profile_picture' => $r->sender->profile_picture,
                ] : null,
                'data' => $r->data,
                'read_at' => $r->read_at,
                'notifiable_type' => $r->notifiable_type ? class_basename($r->notifiable_type) : null,
                'notifiable_id' => $r->notifiable_id,
                'created_at' => $r->created_at->toIso8601String(),
                'time_ago' => $r->created_at->diffForHumans(),
            ]);

        $unreadCount = Ripple::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return Inertia::render('Ripples', [
            'ripples' => $ripples,
            'unreadCount' => $unreadCount,
        ]);
    }

    /**
     * Mark all ripples as read.
     */
    public function markAllRead(): JsonResponse
    {
        Ripple::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark a single ripple as read.
     */
    public function markRead(Ripple $ripple): JsonResponse
    {
        if ($ripple->user_id !== Auth::id()) {
            abort(403);
        }

        $ripple->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Snooze notifications.
     */
    public function snooze(Request $request): JsonResponse
    {
        $request->validate([
            'duration_hours' => 'required|integer|in:1,8,24',
        ]);

        $user = $request->user();
        $user->update([
            'notifications_snoozed_until' => now()->addHours($request->duration_hours),
        ]);

        return response()->json([
            'snoozed_until' => $user->notifications_snoozed_until,
        ]);
    }

    /**
     * Unsnooze notifications.
     */
    public function unsnooze(): JsonResponse
    {
        Auth::user()->update(['notifications_snoozed_until' => null]);
        return response()->json(['success' => true]);
    }
}

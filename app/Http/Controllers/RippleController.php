<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ripple;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

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

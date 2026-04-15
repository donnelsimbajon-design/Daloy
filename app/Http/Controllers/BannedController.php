<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BannedController extends Controller
{
    public function show()
    {
        $user = Auth::user();

        if (!$user || !$user->banned_until) {
            return redirect('/');
        }
        
        $isPermanent = $user->banned_until->year > 9000;
        if (!$isPermanent && !$user->banned_until->isFuture()) {
            return redirect('/');
        }

        $banAction = \App\Models\ModerationAction::where('target_id', $user->id)
            ->where('target_type', 'user')
            ->where('action_type', 'ban_user')
            ->latest()
            ->first();

        return Inertia::render('Errors/Banned', [
            'ban_reason' => $banAction ? $banAction->reason : 'Violation of community guidelines.',
            'banned_at' => $banAction ? $banAction->created_at->format('M d, Y') : $user->updated_at->format('M d, Y'),
            'banned_until' => $isPermanent ? 'Permanent' : $user->banned_until->format('M d, Y h:i A'),
        ]);
    }
    public function appeal()
    {
        $user = Auth::user();

        if (!$user || !$user->banned_until) {
            return redirect('/');
        }
        
        return Inertia::render('Errors/BannedAppeal');
    }

    public function submitAppeal(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->banned_until) {
            return redirect('/');
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ]);

        // In a real app we might create a SupportTicket or BanAppeal model.
        \App\Models\ModerationAction::create([
            'admin_id' => 1, // System or default admin
            'action_type' => 'ban_appeal',
            'target_type' => 'user',
            'target_id' => $user->id,
            'reason' => 'Appeal submitted: ' . $request->reason,
        ]);

        return redirect()->route('banned')->with('message', 'Your appeal has been submitted successfully and is pending review.');
    }
}

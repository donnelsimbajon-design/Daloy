<?php

namespace App\Http\Controllers\Admin;

use App\Models\ModerationAction;
use App\Models\Ripple;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'groups');

        $groups = School::withCount('members')
            ->latest()
            ->paginate(15)
            ->through(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'description' => $g->description,
                'profile_image' => $g->profile_image,
                'members_count' => $g->members_count,
                'created' => $g->created_at->format('M d, Y'),
                'status' => 'active',
            ]);

        return Inertia::render('Admin/Groups', [
            'groups' => $groups,
        ]);
    }

    public function action(Request $request, School $school)
    {
        $this->authorizeAdmin($request, 'groups');

        $request->validate([
            'action' => 'required|in:delete,suspend,activate',
            'reason' => 'nullable|string|max:500',
        ]);

        $admin = $request->user()->admin;
        $adminName = $request->user()->name;

        if ($request->action === 'delete') {
            $memberIds = $school->members()->pluck('users.id')->toArray();
            $schoolName = $school->name;
            $reason = $request->reason ?? 'No reason provided';

            $now = now();
            $rippleRecords = array_map(fn($userId) => [
                'user_id' => $userId,
                'sender_id' => null,
                'type' => 'group_deleted',
                'notifiable_type' => 'App\\Models\\School',
                'notifiable_id' => $school->id,
                'data' => json_encode([
                    'group_name' => $schoolName,
                    'reason' => $reason,
                    'admin_name' => $adminName,
                    'deleted_at' => $now->toIso8601String(),
                ]),
                'read_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ], $memberIds);

            foreach (array_chunk($rippleRecords, 500) as $chunk) {
                Ripple::insert($chunk);
            }

            $school->delete();

            ModerationAction::create([
                'admin_id' => $admin->id,
                'action_type' => 'delete_group',
                'target_type' => 'school',
                'target_id' => $school->id,
                'reason' => $reason,
            ]);
        }

        $this->logAction($request, ucfirst($request->action) . ' Group', [
            'target' => $school->name,
            'target_id' => $school->id,
            'reason' => $request->reason,
            'members_notified' => isset($memberIds) ? count($memberIds) : 0,
        ]);

        return back()->with('success', 'Group action applied.');
    }
}

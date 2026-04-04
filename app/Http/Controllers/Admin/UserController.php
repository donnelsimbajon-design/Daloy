<?php

namespace App\Http\Controllers\Admin;

use App\Models\Admin;
use App\Models\ModerationAction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends BaseAdminController
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request, 'users');

        $query = User::query()->withCount(['posts', 'comments'])->with('admin');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'banned') {
                $query->whereIn('id', ModerationAction::where('target_type', 'user')
                    ->where('action_type', 'ban_user')->pluck('target_id'));
            } elseif ($status === 'suspended') {
                $query->whereIn('id', ModerationAction::where('target_type', 'user')
                    ->where('action_type', 'suspend_user')->pluck('target_id'));
            }
        }

        $bannedIds = ModerationAction::where('target_type', 'user')
            ->where('action_type', 'ban_user')
            ->pluck('target_id')->toArray();

        $suspendedIds = ModerationAction::where('target_type', 'user')
            ->where('action_type', 'suspend_user')
            ->pluck('target_id')->toArray();

        $users = $query->latest()->paginate(15)->through(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'profile_picture' => $user->profile_picture,
            'status' => in_array($user->id, $bannedIds) ? 'banned'
                      : (in_array($user->id, $suspendedIds) ? 'suspended' : 'active'),
            'role' => $user->admin
                ? ($user->admin->role === 'super_admin' ? 'admin' : $user->admin->role)
                : 'user',
            'verified' => $user->email_verified_at !== null,
            'joined' => $user->created_at->format('M d, Y'),
            'posts_count' => $user->posts_count,
            'comments_count' => $user->comments_count,
        ]);

        $totalUsers = User::count();
        $activeConnections = User::where('updated_at', '>=', Carbon::now()->subHours(24))->count();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'totalUsers' => $totalUsers,
            'activeConnections' => $activeConnections,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function action(Request $request, User $user)
    {
        $this->authorizeAdmin($request, 'users');

        $request->validate([
            'action' => 'required|in:suspend,ban,activate,reset_password,verify,revoke_verify',
            'reason' => 'nullable|string',
        ]);

        $admin = $request->user()->admin;
        $action = $request->action;

        switch ($action) {
            case 'suspend':
            case 'ban':
                ModerationAction::create([
                    'admin_id' => $admin->id,
                    'action_type' => "{$action}_user",
                    'target_type' => 'user',
                    'target_id' => $user->id,
                    'reason' => $request->reason,
                ]);
                break;
            case 'activate':
                ModerationAction::where('target_type', 'user')
                    ->where('target_id', $user->id)
                    ->whereIn('action_type', ['suspend_user', 'ban_user'])
                    ->delete();
                break;
            case 'reset_password':
                break;
            case 'verify':
                $user->update(['email_verified_at' => now()]);
                break;
            case 'revoke_verify':
                $user->update(['email_verified_at' => null]);
                break;
        }

        $this->logAction($request, ucwords(str_replace('_', ' ', $action)), [
            'target' => "@{$user->username}" ?? $user->email,
            'target_id' => $user->id,
            'reason' => $request->reason,
        ]);

        return back()->with('success', "Action '{$action}' applied to {$user->name}.");
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request, 'users');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:user,moderator,admin',
        ]);

        $admin = $request->user()->admin;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(),
        ]);

        if ($request->role === 'admin' || $request->role === 'moderator') {
            Admin::create([
                'user_id' => $user->id,
                'role' => $request->role === 'admin' ? 'super_admin' : 'moderator',
            ]);
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => 'create_user',
            'target_type' => 'user',
            'target_id' => $user->id,
            'reason' => 'Admin-created account',
        ]);

        $this->logAction($request, 'Create User', [
            'target' => "@{$user->username}",
            'target_id' => $user->id,
            'role' => $request->role ?? 'user',
        ]);

        return back()->with('success', "User {$user->name} created successfully.");
    }

    public function changeRole(Request $request, User $user)
    {
        $this->authorizeAdmin($request, 'users');

        $request->validate([
            'role' => 'required|in:user,moderator,admin',
        ]);

        $admin = $request->user()->admin;
        $newRole = $request->role;
        $oldRole = $user->admin ? ($user->admin->role === 'super_admin' ? 'admin' : $user->admin->role) : 'user';

        if ($newRole === 'user') {
            Admin::where('user_id', $user->id)->delete();
        } else {
            $adminRecord = Admin::firstOrCreate(
                ['user_id' => $user->id],
                ['role' => $newRole === 'admin' ? 'super_admin' : 'moderator']
            );
            $adminRecord->update(['role' => $newRole === 'admin' ? 'super_admin' : 'moderator']);
        }

        ModerationAction::create([
            'admin_id' => $admin->id,
            'action_type' => 'change_role',
            'target_type' => 'user',
            'target_id' => $user->id,
            'reason' => "Role changed from {$oldRole} to {$newRole}",
        ]);

        $this->logAction($request, 'Change User Role', [
            'target' => "@{$user->username}",
            'target_id' => $user->id,
            'old_role' => $oldRole,
            'new_role' => $newRole,
        ]);

        return back()->with('success', "{$user->name}'s role changed to {$newRole}.");
    }
}

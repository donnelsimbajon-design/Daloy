<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\AdminLog;
use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\User;
use App\Services\PermissionChecker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolesController extends Controller
{
    private function requireSuperAdmin(Request $request): void
    {
        $admin = $request->user()->admin;
        if (!$admin || !$admin->isSuperAdmin()) {
            abort(403, 'Super Admin access required.');
        }
    }

    // ─── Index ───────────────────────────────────────────────────
    public function index(Request $request)
    {
        $this->requireSuperAdmin($request);

        $roles = AdminRole::withCount('admins')
            ->with('permissions:id,key,label,category')
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'name'         => $r->name,
                'display_name' => $r->display_name,
                'description'  => $r->description,
                'color'        => $r->color,
                'is_system'    => $r->is_system,
                'admins_count' => $r->admins_count,
                'permissions'  => $r->permissions->map(fn($p) => [
                    'id'       => $p->id,
                    'key'      => $p->key,
                    'label'    => $p->label,
                    'category' => $p->category,
                ]),
            ]);

        $permissions = AdminPermission::orderBy('category')->orderBy('label')->get()
            ->groupBy('category')
            ->map(fn($group) => $group->map(fn($p) => [
                'id'       => $p->id,
                'key'      => $p->key,
                'label'    => $p->label,
                'category' => $p->category,
            ]));

        $admins = Admin::with(['user:id,name,email,username,profile_picture', 'adminRole:id,name,display_name,color'])
            ->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'user_id'    => $a->user_id,
                'name'       => $a->user?->name ?? 'Unknown',
                'email'      => $a->user?->email ?? '',
                'username'   => $a->user?->username ?? '',
                'avatar'     => $a->user?->profile_picture,
                'role'       => $a->role,
                'role_id'    => $a->role_id,
                'role_label' => $a->adminRole?->display_name ?? ucfirst($a->role),
                'role_color' => $a->adminRole?->color ?? '#111',
                'joined'     => $a->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Admin/Roles', [
            'roles'       => $roles,
            'permissions' => $permissions,
            'admins'      => $admins,
        ]);
    }

    // ─── Store Role ──────────────────────────────────────────────
    public function store(Request $request)
    {
        $this->requireSuperAdmin($request);

        $data = $request->validate([
            'name'         => 'required|string|max:60|unique:admin_roles,name|regex:/^[a-z_]+$/',
            'display_name' => 'required|string|max:100',
            'description'  => 'nullable|string|max:300',
            'color'        => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $role = AdminRole::create(array_merge($data, ['is_system' => false]));

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Create Role',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $role->name, 'target_id' => $role->id],
        ]);

        return back()->with('success', "Role '{$role->display_name}' created.");
    }

    // ─── Update Role ─────────────────────────────────────────────
    public function update(Request $request, AdminRole $role)
    {
        $this->requireSuperAdmin($request);

        $data = $request->validate([
            'display_name' => 'required|string|max:100',
            'description'  => 'nullable|string|max:300',
            'color'        => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $role->update($data);

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Update Role',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $role->name, 'target_id' => $role->id],
        ]);

        return back()->with('success', "Role '{$role->display_name}' updated.");
    }

    // ─── Delete Role ─────────────────────────────────────────────
    public function destroy(Request $request, AdminRole $role)
    {
        $this->requireSuperAdmin($request);

        if ($role->is_system) {
            abort(403, 'System roles cannot be deleted.');
        }

        $request->validate([
            'reassign_to' => 'required|exists:admin_roles,id',
        ]);

        // Reassign admins
        Admin::where('role_id', $role->id)->update(['role_id' => $request->reassign_to]);

        $role->delete();

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Delete Role',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $role->name],
        ]);

        return back()->with('success', "Role deleted and admins reassigned.");
    }

    // ─── Update Role Permissions ─────────────────────────────────
    public function updatePermissions(Request $request, AdminRole $role)
    {
        $this->requireSuperAdmin($request);

        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:admin_permissions,id',
        ]);

        $role->permissions()->sync($request->permission_ids);

        // Clear cached permissions for all admins with this role
        Admin::where('role_id', $role->id)->each(fn($a) =>
            PermissionChecker::clearCache($a->id)
        );

        return back()->with('success', 'Permissions updated.');
    }

    // ─── Promote User to Admin ───────────────────────────────────
    public function promoteUser(Request $request, User $user)
    {
        $this->requireSuperAdmin($request);

        $request->validate([
            'role_id' => 'required|exists:admin_roles,id',
        ]);

        if (Admin::where('user_id', $user->id)->exists()) {
            return back()->with('error', 'User is already an admin.');
        }

        $role = AdminRole::findOrFail($request->role_id);

        $admin = Admin::create([
            'user_id' => $user->id,
            'role'    => $role->name,
            'role_id' => $role->id,
        ]);

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Promote User to Admin',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => "@{$user->username}", 'role' => $role->name],
        ]);

        return back()->with('success', "{$user->name} promoted to {$role->display_name}.");
    }

    // ─── Remove Admin ────────────────────────────────────────────
    public function removeAdmin(Request $request, Admin $admin)
    {
        $this->requireSuperAdmin($request);

        if ($admin->user_id === $request->user()->id) {
            return back()->with('error', 'You cannot remove yourself.');
        }

        $name = $admin->user?->name ?? 'Admin';
        PermissionChecker::clearCache($admin->id);
        $admin->delete();

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Remove Admin',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => $name],
        ]);

        return back()->with('success', "{$name} removed as admin.");
    }

    // ─── Change Admin Role ───────────────────────────────────────
    public function changeRole(Request $request, Admin $admin)
    {
        $this->requireSuperAdmin($request);

        $request->validate(['role_id' => 'required|exists:admin_roles,id']);

        $role = AdminRole::findOrFail($request->role_id);
        $admin->update(['role' => $role->name, 'role_id' => $role->id]);
        PermissionChecker::clearCache($admin->id);

        AdminLog::create([
            'admin_id'   => $request->user()->admin->id,
            'action'     => 'Change Admin Role',
            'ip_address' => $request->ip(),
            'metadata'   => ['target' => "@{$admin->user?->username}", 'new_role' => $role->name],
        ]);

        return back()->with('success', "Role updated to {$role->display_name}.");
    }

    // ─── Search Users (for Promote tab) ─────────────────────────
    public function searchUsers(Request $request)
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) return response()->json([]);

        // Get existing admin user IDs to exclude
        $adminUserIds = Admin::pluck('user_id')->toArray();

        $users = User::where(function ($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('username', 'LIKE', "%{$q}%")
                      ->orWhere('email', 'LIKE', "%{$q}%");
            })
            ->whereNotIn('id', $adminUserIds)
            ->select('id', 'name', 'username', 'email', 'profile_picture')
            ->take(10)
            ->get();

        return response()->json($users);
    }
}

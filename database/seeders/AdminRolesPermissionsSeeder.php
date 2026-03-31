<?php

namespace Database\Seeders;

use App\Models\AdminPermission;
use App\Models\AdminRole;
use Illuminate\Database\Seeder;

class AdminRolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Permissions ─────────────────────────────────────────────────
        $permissions = [
            // Users
            ['key' => 'view_users',       'label' => 'View Users',         'category' => 'users'],
            ['key' => 'suspend_users',    'label' => 'Suspend Users',      'category' => 'users'],
            ['key' => 'ban_users',        'label' => 'Ban Users',          'category' => 'users'],
            ['key' => 'verify_users',     'label' => 'Verify Users',       'category' => 'users'],
            ['key' => 'reset_passwords',  'label' => 'Reset Passwords',    'category' => 'users'],
            // Content
            ['key' => 'view_content',     'label' => 'View Content',       'category' => 'content'],
            ['key' => 'delete_content',   'label' => 'Delete Content',     'category' => 'content'],
            ['key' => 'hide_content',     'label' => 'Hide Content',       'category' => 'content'],
            ['key' => 'flag_content',     'label' => 'Flag Content',       'category' => 'content'],
            // Reports
            ['key' => 'view_reports',     'label' => 'View Reports',       'category' => 'reports'],
            ['key' => 'resolve_reports',  'label' => 'Resolve Reports',    'category' => 'reports'],
            ['key' => 'dismiss_reports',  'label' => 'Dismiss Reports',    'category' => 'reports'],
            // Groups
            ['key' => 'view_groups',      'label' => 'View Groups',        'category' => 'groups'],
            ['key' => 'delete_groups',    'label' => 'Delete Groups',      'category' => 'groups'],
            ['key' => 'suspend_groups',   'label' => 'Suspend Groups',     'category' => 'groups'],
            // Messages
            ['key' => 'view_reported_messages', 'label' => 'View Reported Messages', 'category' => 'messages'],
            // Analytics
            ['key' => 'view_analytics',   'label' => 'View Analytics',     'category' => 'analytics'],
            // Settings
            ['key' => 'view_settings',    'label' => 'View Settings',      'category' => 'settings'],
            ['key' => 'edit_settings',    'label' => 'Edit Settings',      'category' => 'settings'],
            // Logs
            ['key' => 'view_logs',        'label' => 'View Logs',          'category' => 'logs'],
            // System
            ['key' => 'manage_roles',     'label' => 'Manage Roles',       'category' => 'system'],
            ['key' => 'live_monitor',     'label' => 'Live Monitor',       'category' => 'system'],
            ['key' => 'export_data',      'label' => 'Export Data',        'category' => 'system'],
        ];

        foreach ($permissions as $p) {
            AdminPermission::updateOrCreate(['key' => $p['key']], $p);
        }

        // ── Roles ────────────────────────────────────────────────────────
        $allKeys       = array_column($permissions, 'key');
        $moderatorKeys = ['view_content', 'delete_content', 'hide_content', 'flag_content',
                          'view_reports', 'resolve_reports', 'dismiss_reports'];
        $analystKeys   = ['view_analytics', 'view_logs'];
        $supportKeys   = ['view_users', 'view_reports'];

        $roles = [
            [
                'name'         => 'super_admin',
                'display_name' => 'Super Administrator',
                'description'  => 'Full access to all features and settings.',
                'color'        => '#111111',
                'is_system'    => true,
                'perm_keys'    => $allKeys,
            ],
            [
                'name'         => 'moderator',
                'display_name' => 'Moderator',
                'description'  => 'Content moderation and report resolution.',
                'color'        => '#7c3aed',
                'is_system'    => true,
                'perm_keys'    => $moderatorKeys,
            ],
            [
                'name'         => 'analyst',
                'display_name' => 'Analyst',
                'description'  => 'Read-only access to analytics and logs.',
                'color'        => '#0891b2',
                'is_system'    => true,
                'perm_keys'    => $analystKeys,
            ],
            [
                'name'         => 'support',
                'display_name' => 'Support',
                'description'  => 'View users and reports to assist community.',
                'color'        => '#059669',
                'is_system'    => true,
                'perm_keys'    => $supportKeys,
            ],
        ];

        foreach ($roles as $r) {
            $permKeys = $r['perm_keys'];
            unset($r['perm_keys']);

            $role = AdminRole::updateOrCreate(['name' => $r['name']], $r);
            $permIds = AdminPermission::whereIn('key', $permKeys)->pluck('id');
            $role->permissions()->sync($permIds);
        }
    }
}

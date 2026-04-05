<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── Regular Test User ──
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        // ── Super Admin User ──
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@daloy.com'],
            [
                'name' => 'System Admin',
                'username' => 'admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        // Ensure Admin Record exists
        \App\Models\Admin::updateOrCreate(
            ['user_id' => $adminUser->id],
            ['role' => 'super_admin']
        );

        // ── Setup Roles & Permissions ──
        $this->call([
            AdminRolesPermissionsSeeder::class,
            DaloyFeaturesSeeder::class,
        ]);
    }
}

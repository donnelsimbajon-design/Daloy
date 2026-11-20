<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop existing stubs (if they exist from the initial migration)
        Schema::disableForeignKeyConstraints();
        try {
            Schema::dropIfExists('admin_role_permissions');
            Schema::dropIfExists('role_permissions'); // old pivot name
            Schema::dropIfExists('admin_permissions');
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        // Recreate admin_roles with full schema (drop if bare stub existed)
        Schema::table('admin_roles', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('admin_roles', 'display_name')) {
                $table->string('display_name', 100)->after('name');
            }
            if (!Schema::hasColumn('admin_roles', 'description')) {
                $table->string('description', 300)->nullable()->after('display_name');
            }
            if (!Schema::hasColumn('admin_roles', 'color')) {
                $table->string('color', 7)->default('#111111')->after('description');
            }
            if (!Schema::hasColumn('admin_roles', 'is_system')) {
                $table->boolean('is_system')->default(false)->after('color');
            }
        });

        Schema::create('admin_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('label', 100);
            $table->string('description', 300)->nullable();
            $table->enum('category', [
                'users', 'content', 'reports', 'groups',
                'messages', 'analytics', 'settings', 'logs', 'system'
            ]);
            $table->timestamps();
        });

        Schema::create('admin_role_permissions', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained('admin_roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('admin_permissions')->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        // Add role_id to admins table if not exists
        if (!Schema::hasColumn('admins', 'role_id')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->foreignId('role_id')->nullable()->constrained('admin_roles')->nullOnDelete()->after('role');
            });
        }
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\AdminRole::class);
            $table->dropColumn('role_id');
        });
        Schema::dropIfExists('admin_role_permissions');
        Schema::dropIfExists('admin_permissions');
        Schema::dropIfExists('admin_roles');
    }
};

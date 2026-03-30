<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blocked_users', function (Blueprint $table) {
            // Track when a block was lifted — used to enforce 48h cooldown
            $table->timestamp('unblocked_at')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('blocked_users', function (Blueprint $table) {
            $table->dropColumn('unblocked_at');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('group_call_participants', function (Blueprint $table) {
            $table->boolean('is_screen_sharing')->default(false)->after('is_muted_by_host');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_call_participants', function (Blueprint $table) {
            $table->dropColumn('is_screen_sharing');
        });
    }
};

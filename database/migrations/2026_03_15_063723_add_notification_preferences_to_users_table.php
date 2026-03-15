<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_preferences')->nullable()->after('privacy_setting');
            $table->string('font_size', 10)->default('medium')->after('notification_preferences');
            $table->boolean('reduce_motion')->default(false)->after('font_size');
            $table->boolean('high_contrast')->default(false)->after('reduce_motion');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notification_preferences', 'font_size', 'reduce_motion', 'high_contrast']);
        });
    }
};

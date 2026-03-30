<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add school_id, meeting_link, privacy, status, is_pinned to events
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->onDelete('cascade');
            $table->string('meeting_link')->nullable()->after('location');
            $table->enum('privacy', ['public', 'members_only'])->default('public')->after('cover_image');
            $table->enum('status', ['upcoming', 'live', 'ended'])->default('upcoming')->after('privacy');
            $table->boolean('is_pinned')->default(false)->after('status');
        });

        // Add event_id to posts for event-linked discussions
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->after('school_id')->constrained('events')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropColumn('event_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn(['school_id', 'meeting_link', 'privacy', 'status', 'is_pinned']);
        });
    }
};

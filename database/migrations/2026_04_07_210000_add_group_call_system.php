<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance conversations table for groups
        if (!Schema::hasColumn('conversations', 'avatar_url')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->string('avatar_url', 500)->nullable()->after('name');
                $table->integer('max_members')->default(10)->after('avatar_url');
            });
        }

        // Group call tracking
        Schema::create('group_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->string('channel_name', 255);
            $table->foreignId('started_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'ended_at']);
        });

        // Track who's in the call
        Schema::create('group_call_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_call_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('joined_at');
            $table->timestamp('left_at')->nullable();
            $table->enum('role', ['host', 'speaker', 'listener'])->default('speaker');
            $table->boolean('is_muted_by_host')->default(false);
            $table->timestamps();

            $table->unique(['group_call_id', 'user_id']);
        });

        // In-call chat messages (separate from regular messages)
        Schema::create('group_call_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_call_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->timestamps();

            $table->index(['group_call_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_call_messages');
        Schema::dropIfExists('group_call_participants');
        Schema::dropIfExists('group_calls');

        if (Schema::hasColumn('conversations', 'avatar_url')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropColumn(['avatar_url', 'max_members']);
            });
        }
    }
};

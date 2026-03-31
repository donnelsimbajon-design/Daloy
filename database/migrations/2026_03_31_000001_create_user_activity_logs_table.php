<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action_type', 80);
            $table->enum('action_category', [
                'account', 'post', 'reaction', 'story', 'social',
                'block', 'message', 'school', 'event', 'report', 'search'
            ]);
            $table->string('target_type', 80)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['action_category', 'created_at']);
            $table->index('created_at');
        });

        Schema::create('user_activity_logs_archive', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action_type', 80);
            $table->string('action_category', 30);
            $table->string('target_type', 80)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at');
            $table->timestamp('archived_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activity_logs_archive');
        Schema::dropIfExists('user_activity_logs');
    }
};

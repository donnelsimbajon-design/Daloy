<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('initiated_by');
            $table->enum('call_type', ['audio', 'video'])->default('audio');
            $table->boolean('is_group_call')->default(false);
            $table->json('participant_ids')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->enum('end_reason', ['normal', 'timeout', 'admin_terminated', 'dropped'])->default('normal');
            $table->unsignedBigInteger('terminated_by')->nullable(); // admin_id if force-ended
            $table->timestamps();

            $table->index('conversation_id');
            $table->index('initiated_by');
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};

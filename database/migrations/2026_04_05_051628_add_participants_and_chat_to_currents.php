<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_current_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_current_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_heartbeat')->useCurrent();
            $table->timestamps();
            $table->unique(['school_current_id', 'user_id']);
        });

        Schema::create('school_current_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_current_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_current_messages');
        Schema::dropIfExists('school_current_participants');
    }
};

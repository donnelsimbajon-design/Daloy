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
        Schema::create('school_current_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_current_id')->constrained()->cascadeOnDelete();
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->string('track_title');
            $table->text('track_url');
            $table->string('track_type')->nullable();
            $table->enum('status', ['pending', 'playing', 'played'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_current_tracks');
    }
};

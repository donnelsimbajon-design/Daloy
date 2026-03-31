<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('message');
            $table->enum('type', ['info', 'warning', 'critical', 'maintenance', 'feature']);
            $table->enum('target_audience', ['all', 'new_users', 'active_users', 'specific_school']);
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->enum('display_location', ['feed', 'banner', 'ripple', 'all']);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('read_count')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'scheduled_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};

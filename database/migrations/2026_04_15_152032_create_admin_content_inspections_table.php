<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_content_inspections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id');
            $table->string('target_type', 50); // 'conversation', 'story', 'call'
            $table->unsignedBigInteger('target_id');
            $table->text('reason');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('inspected_at')->useCurrent();

            $table->index('admin_id');
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_content_inspections');
    }
};

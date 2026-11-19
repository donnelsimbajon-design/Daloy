<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Supports checking if a user reposted an original, duplicate
            // prevention and counting reposts as more students join.
            $table->index(['repost_of_id', 'user_id'], 'posts_repost_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_repost_lookup_idx');
        });
    }
};

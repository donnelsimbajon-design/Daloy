<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Older deployed databases may already have this column through a manual
        // schema change. Fresh databases never did, causing HTTP 500 when sharing
        // posts as rich messages.
        if (!Schema::hasColumn('messages', 'metadata')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->json('metadata')->nullable();
            });
        }
    }

    public function down(): void
    {
        // Intentionally preserve stored rich-message previews on rollback.
        // Dropping the column can destroy pre-existing production data.
    }
};

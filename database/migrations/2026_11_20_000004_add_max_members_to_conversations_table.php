<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Group creation writes max_members, but the original conversations
        // migration never defined it. Safely accommodate existing databases.
        if (!Schema::hasColumn('conversations', 'max_members')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->unsignedTinyInteger('max_members')->default(11);
            });
        }
    }

    public function down(): void
    {
        // Preserve group settings and any legacy max_members values on rollback.
    }
};

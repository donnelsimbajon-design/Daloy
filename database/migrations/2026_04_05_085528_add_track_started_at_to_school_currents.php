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
        Schema::table('school_currents', function (Blueprint $table) {
            $table->unsignedBigInteger('track_started_at')->nullable()->after('track_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_currents', function (Blueprint $table) {
            $table->dropColumn('track_started_at');
        });
    }
};

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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_initiate_calls')->default(true);
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->string('evidence_file_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_initiate_calls');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('evidence_file_path');
        });
    }
};

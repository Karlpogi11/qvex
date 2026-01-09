<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // STEP 1: Temporarily change to VARCHAR
        Schema::table('queue_entries', function (Blueprint $table) {
            $table->string('queue_type', 20)->change();
        });

        // STEP 2: Normalize existing data
        DB::table('queue_entries')
            ->whereIn('queue_type', ['Walk-in', 'walkIn'])
            ->update(['queue_type' => 'walk-in']);

        DB::table('queue_entries')
            ->where('queue_type', 'Appointment')
            ->update(['queue_type' => 'appointment']);

        // STEP 3: Convert back to ENUM (lowercase only)
        Schema::table('queue_entries', function (Blueprint $table) {
            $table->enum('queue_type', ['walk-in', 'appointment'])
                  ->default('walk-in')
                  ->change();
        });
    }

    public function down(): void
    {
        // Reverse safely
        Schema::table('queue_entries', function (Blueprint $table) {
            $table->string('queue_type', 20)->change();
        });

        DB::table('queue_entries')
            ->where('queue_type', 'walk-in')
            ->update(['queue_type' => 'walkIn']);

        Schema::table('queue_entries', function (Blueprint $table) {
            $table->enum('queue_type', ['walkIn', 'appointment'])
                  ->default('walkIn')
                  ->change();
        });
    }
};

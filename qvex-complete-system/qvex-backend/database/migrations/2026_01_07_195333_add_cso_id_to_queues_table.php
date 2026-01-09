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
    Schema::table('queue_entries', function (Blueprint $table) {
        $table->foreignId('cso_id')->nullable()->constrained('cso_staff');
    });
}

public function down(): void
{
    Schema::table('queue_entries', function (Blueprint $table) {
        $table->dropColumn('cso_id');
    });
}


};
    
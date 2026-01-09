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
    Schema::create('cso_staff', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100)->unique();
    $table->integer('counter_number');
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index('is_active');
    $table->index('counter_number');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cso_staff');
    }
};
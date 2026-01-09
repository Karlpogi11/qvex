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
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->string('queue_number', 10)->unique();
            $table->enum('queue_type', ['walk-in', 'appointment'])->default('walk-in');
            $table->string('customer_name')->nullable();
            $table->string('service_type', 100);
            $table->enum('status', ['waiting', 'serving', 'completed', 'cancelled'])->default('waiting');
            $table->string('cso_name', 100)->nullable();
            $table->integer('service_duration')->nullable()->comment('Duration in seconds');
            $table->timestamp('queued_at');
            $table->timestamp('served_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for better query performance
            $table->index(['status', 'queued_at']);
            $table->index('queue_type');
            $table->index('cso_name');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
{
    Schema::table('queue_entries', function (Blueprint $table) {
        if (!Schema::hasColumn('queue_entries', 'called_at')) {
            $table->timestamp('called_at')->nullable();
        }

        if (!Schema::hasColumn('queue_entries', 'service_duration')) {
            $table->integer('service_duration')->nullable();
        }
    });
}

    public function down(): void
{
    Schema::table('queue_entries', function (Blueprint $table) {
        if (Schema::hasColumn('queue_entries', 'called_at')) {
            $table->dropColumn('called_at');
        }

        if (Schema::hasColumn('queue_entries', 'service_duration')) {
            $table->dropColumn('service_duration');
        }
    });
}
};

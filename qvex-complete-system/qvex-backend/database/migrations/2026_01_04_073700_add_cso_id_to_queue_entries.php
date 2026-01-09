<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
{
    Schema::table('cso_staff', function (Blueprint $table) {
        $table->foreignId('current_queue_id')
              ->nullable()
              ->constrained('queue_entries')
              ->nullOnDelete();
    });
}

    public function down()
{
    Schema::table('cso_staff', function (Blueprint $table) {
        $table->dropColumn('current_queue_id');
    });
}
};


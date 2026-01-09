<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Queue;
use Carbon\Carbon;

class ClearStaleQueues extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:clear-stale';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset serving queues that have been stuck for too long (e.g., 8 hours)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Define the stale threshold (8 hours ago)
        $threshold = Carbon::now()->subHours(11);

        // Reset stale queues
        $staleCount = Queue::where('status', 'serving')
            ->where('called_at', '<', $threshold)
            ->update([
                'status' => 'waiting',
                'cso_id' => null,
            ]);

        $this->info("Cleared {$staleCount} stale serving queues.");
    }
}

<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\Queue;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // TEST MODE: Run every minute
        $schedule->call(function () {
            $cancelled = Queue::where('status', 'waiting')
                ->whereDate('created_at', '<', now()->toDateString())
                ->count();
            
            Queue::where('status', 'waiting')
                ->whereDate('created_at', '<', now()->toDateString())
                ->update([
                    'status' => 'cancelled',
                    'completed_at' => now()
                ]);
            
            Log::info("Auto-cancelled {$cancelled} old waiting queues");
        })->dailyAt('22:30');
        
        // for prod
        // ->dailyAt('22:30');
       // ->everyMinute(); //  TEST MODE
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
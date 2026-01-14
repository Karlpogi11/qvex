<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\CSO;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    /**
     * Get daily statistics
     */
    public function getDaily(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::today()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::today()->format('Y-m-d'));

        $stats = [
            'total_queues' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])->count(),
            'completed' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('status', 'completed')
                ->count(),
            'cancelled' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('status', 'cancelled')
                ->count(),
            'waiting' => Queue::where('status', 'waiting')->count(),
            'serving' => Queue::where('status', 'serving')->count(),
            
            'walk_in' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('queue_type', 'walk-in')
                ->count(),
            'appointment' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('queue_type', 'appointment')
                ->count(),
            
            'average_service_time' => Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('status', 'completed')
                ->whereNotNull('service_duration')
                ->avg('service_duration'),
            
            'hourly_breakdown' => $this->getHourlyBreakdown($startDate, $endDate),
            'service_type_breakdown' => $this->getServiceTypeBreakdown($startDate, $endDate),
        ];

        return response()->json($stats);
    }

    /**
     * Get CSO-specific statistics
     */
    public function getCsoStats($csoId)
    {
        $cso = CSO::findOrFail($csoId);
        $today = Carbon::today();

        $stats = [
            'cso' => [
                'id' => $cso->id,
                'name' => $cso->name,
                'counter_number' => $cso->counter_number,
            ],
            
            // Today's stats
            'today' => [
                'total_served' => Queue::where('cso_id', $csoId)
                    ->whereDate('created_at', $today)
                    ->where('status', 'completed')
                    ->count(),
                
                'average_service_time' => Queue::where('cso_id', $csoId)
                    ->whereDate('created_at', $today)
                    ->where('status', 'completed')
                    ->whereNotNull('service_duration')
                    ->avg('service_duration'),
                
                'total_service_time' => Queue::where('cso_id', $csoId)
                    ->whereDate('created_at', $today)
                    ->where('status', 'completed')
                    ->sum('service_duration'),
                
                'walk_in' => Queue::where('cso_id', $csoId)
                    ->whereDate('created_at', $today)
                    ->where('queue_type', 'walk-in')
                    ->where('status', 'completed')
                    ->count(),
                
                'appointment' => Queue::where('cso_id', $csoId)
                    ->whereDate('created_at', $today)
                    ->where('queue_type', 'appointment')
                    ->where('status', 'completed')
                    ->count(),
            ],
            
            // This week's stats
            'this_week' => [
                'total_served' => Queue::where('cso_id', $csoId)
                    ->whereBetween('created_at', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ])
                    ->where('status', 'completed')
                    ->count(),
                
                'average_service_time' => Queue::where('cso_id', $csoId)
                    ->whereBetween('created_at', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ])
                    ->where('status', 'completed')
                    ->whereNotNull('service_duration')
                    ->avg('service_duration'),
            ],
            
            // This month's stats
            'this_month' => [
                'total_served' => Queue::where('cso_id', $csoId)
                    ->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year)
                    ->where('status', 'completed')
                    ->count(),
                
                'average_service_time' => Queue::where('cso_id', $csoId)
                    ->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year)
                    ->where('status', 'completed')
                    ->whereNotNull('service_duration')
                    ->avg('service_duration'),
            ],
            
            // Service type breakdown
            'service_types' => Queue::where('cso_id', $csoId)
                ->whereDate('created_at', $today)
                ->where('status', 'completed')
                ->select('service_type', DB::raw('count(*) as count'))
                ->groupBy('service_type')
                ->get(),
            
            // Current queue
            'current_queue' => Queue::where('cso_id', $csoId)
                ->where('status', 'serving')
                ->first(),
        ];

        return response()->json($stats);
    }

    /**
     * Get average wait time
     */
    public function getAverageWaitTime()
    {
        $today = Carbon::today();

        // Calculate average wait time (time between created_at and called_at)
        $queues = Queue::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->whereNotNull('called_at')
            ->get();

        $totalWaitTime = 0;
        $count = 0;

        foreach ($queues as $queue) {
            $waitTime = Carbon::parse($queue->called_at)->diffInSeconds(Carbon::parse($queue->created_at));
            $totalWaitTime += $waitTime;
            $count++;
        }

        $averageWaitTime = $count > 0 ? round($totalWaitTime / $count) : 0;

        // Also get current waiting queues
        $currentWaiting = Queue::where('status', 'waiting')
            ->select('id', 'queue_number', 'created_at', 'queue_type', 'service_type')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($queue) {
                $queue->waiting_time = Carbon::parse($queue->created_at)->diffInSeconds(Carbon::now());
                return $queue;
            });

        return response()->json([
            'average_wait_time' => $averageWaitTime,
            'total_completed_today' => $count,
            'current_waiting' => $currentWaiting,
            'current_waiting_count' => $currentWaiting->count(),
        ]);
    }

    /**
     * Get hourly breakdown for a specific date range
     */
    private function getHourlyBreakdown($startDate, $endDate)
    {
        return Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('count(*) as total'),
                DB::raw('sum(case when status = "completed" then 1 else 0 end) as completed'),
                DB::raw('sum(case when status = "cancelled" then 1 else 0 end) as cancelled')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
    }

    /**
     * Get service type breakdown for a specific date range
     */
    private function getServiceTypeBreakdown($startDate, $endDate)
    {
        return Queue::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->select(
                'service_type',
                DB::raw('count(*) as total'),
                DB::raw('avg(service_duration) as avg_duration')
            )
            ->where('status', 'completed')
            ->groupBy('service_type')
            ->get();
    }

    /**
     * Get performance comparison between all CSOs
     */
    public function getCsoComparison(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::today()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::today()->format('Y-m-d'));

        $csos = CSO::where('is_active', true)->get()->map(function ($cso) use ($startDate, $endDate) {
            $queues = Queue::where('cso_id', $cso->id)
                ->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->where('status', 'completed')
                ->get();

            return [
                'id' => $cso->id,
                'name' => $cso->name,
                'cso_name' => $cso->cso_name ?? $cso->name,
                'counter_number' => $cso->counter_number,
                'total_served' => $queues->count(),
                'average_service_time' => $queues->avg('service_duration'),
                'total_service_time' => $queues->sum('service_duration'),
            ];
        });

        return response()->json($csos);
    }
}
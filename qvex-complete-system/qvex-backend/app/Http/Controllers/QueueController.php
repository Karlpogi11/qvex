<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\CSO;
use Illuminate\Http\Request;
use App\Events\QueueCalled;
use App\Events\QueueCancelled;
use App\Events\ServiceCompleted;
use GuzzleHttp\Client;
// use Illuminate\Support\Facades\DB;
// use App\Models\CsoStaff; //  REQUIRED

//working



class QueueController extends Controller
{
    // List all queues
    public function index()
    {

        //chages here
      $csos = CSO::with(['queues' => function($q) {
        $q->where('status', 'serving')->whereNull('completed_at');
    }])->get();

    // map first active queue to `current_queue`
    return $csos->map(function($cso) {
        $cso->current_queue = $cso->queues->first() ?? null;
        unset($cso->queues);
        return $cso;
    });

    }

    // Show specific queue
    public function show($id)
    {
        return Queue::with('cso')->findOrFail($id);
    }

    // Create new queue
    public function store(Request $request)
    {
        $validated = $request->validate([
            'queue_type' => 'required|in:walk-in,appointment',
            'service_type' => 'required|string',
            'queue_number' => 'nullable|string',
        ]);

        if ($validated['queue_type'] === 'walk-in' && !empty($validated['queue_number'])) {
            $exists = Queue::where('queue_number', $validated['queue_number'])
                ->whereIn('status', ['waiting', 'serving'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'error' => 'QUEUE_NUMBER_ACTIVE',
                    'message' => 'This queue number is already in use and has not been completed.'
                ], 422);
            }
            $queueNumber = $validated['queue_number'];
        } else {
            $prefix = $validated['queue_type'] === 'appointment' ? 'A' : 'W';
            $allNumbers = Queue::where('queue_number', 'like', "$prefix%")
                ->pluck('queue_number')
                ->toArray();

            $i = 1;
            do {
                $queueNumber = $prefix . str_pad($i, 3, '0', STR_PAD_LEFT);
                $i++;
            } while (in_array($queueNumber, $allNumbers));
        }

        $queue = Queue::create([
            'queue_number' => $queueNumber,
            'queue_type' => $validated['queue_type'],
            'service_type' => $validated['service_type'],
            'status' => 'waiting',
        ]);

        return response()->json($queue, 201);
    }

    // Get next queue number
    public function nextQueueNumber(Request $request)
    {
        $request->validate([
            'queue_type' => 'required|in:walk-in,appointment',
        ]);

        $prefix = $request->queue_type === 'appointment' ? 'A' : 'W';
        $existingNumbers = Queue::whereIn('status', ['waiting', 'serving'])
            ->pluck('queue_number')
            ->toArray();

        $i = 1;
        do {
            $nextNumber = $prefix . str_pad($i, 3, '0', STR_PAD_LEFT);
            $i++;
        } while (in_array($nextNumber, $existingNumbers));

        return response()->json(['next_number' => $nextNumber]);
    }

    // Cancel a queue
    public function cancel($id)
    {
        $queue = Queue::find($id);
        if (!$queue) {
            return response()->json(['message' => 'Queue not found'], 404);
        }

        $queue->update(['status' => 'cancelled']);
        broadcast(new QueueCancelled($queue));
        return response()->json(['message' => 'Queue cancelled', 'id' => $id]);
    }

    // List waiting queues
    public function waiting()
    {
        return Queue::where('status', 'waiting')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    // List appointment queues
    public function appointments()
    {
        return Queue::where('status', 'waiting')
            ->where('queue_type', 'appointment')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    // Call next queue
 public function callNext(Request $request)
{
    $request->validate([
        'csoId' => 'required|exists:cso_staff,id',
        'customerType' => 'required|in:walk-in,appointment',
    ]);

    $csoId = $request->csoId;
    $customerType = $request->customerType;

    // 1️⃣ Get the CSO
    $cso = CSO::findOrFail($csoId);

    try {
        // 2️⃣ Check if CSO already has a current queue
        if ($cso->current_queue_id) {
            $currentQueue = Queue::find($cso->current_queue_id);
            if ($currentQueue && $currentQueue->status === 'serving') {
                return response()->json([
                    'message' => 'CSO is already serving a customer',
                    'queue' => $currentQueue,
                ], 200);
            }
        }

        // 3️⃣ Get next waiting queue
        $nextQueue = Queue::where('status', 'waiting')
            ->where('queue_type', $customerType)
            ->orderBy('created_at')
            ->first();

        if (!$nextQueue) {
            return response()->json([
                'message' => 'No customers in queue',
            ], 200);
        }

        // 4️⃣ Assign queue to CSO
        $nextQueue->status = 'serving';
        $nextQueue->cso_id = $csoId;
       // $nextQueue->started_at = now();
        $nextQueue->save();

        // 5️⃣ Update CSO's current_queue_id
        $cso->current_queue_id = $nextQueue->id;
        $cso->save();

        return response()->json([
            'message' => 'Next customer called',
            'queue' => $nextQueue,
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Failed to call next customer',
            'error' => $e->getMessage()
        ], 500);
    }
}




    // Complete a queue
 public function complete(Request $request, $id)
{
    $validated = $request->validate([
        'duration' => 'required|integer|min:0',
    ]);

    $queue = Queue::findOrFail($id);
    $queue->update([
        'status' => 'completed',
        'completed_at' => now(),
        'service_duration' => $validated['duration'],
    ]);

    // Broadcast completion to Node.js
    try {
        Http::post('http://localhost:3001/event', [
            'type' => 'service_completed',
            'queue_number' => $queue->queue_number,
            'counter_number' => optional($queue->cso)->counter_number,
        ]);
    } catch (\Throwable $e) {
        \Log::error('Failed to send completion event: ' . $e->getMessage());
    }

    return response()->json($queue);
}


    // Get current queue for CSO
 public function currentForCso($csoId)
{
    $queue = Queue::where('cso_id', $csoId)
        ->where('status', 'serving')
        ->first();

    return response()->json($queue);
}



}

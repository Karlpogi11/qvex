<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\CSO;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use GuzzleHttp\Client;

class QueueController extends Controller
{
    public function index()
    {
        $csos = CSO::with('current_queue')->where('is_active', true)->get();
        return response()->json($csos);
    }

    public function show($id)
    {
        //return Queue::with('cso')->findOrFail($id);
    }

   public function store(Request $request)
{
    $validated = $request->validate([
        'queue_type' => 'required|in:walk-in,appointment',
        'service_type' => 'required|string',
        'queue_number' => 'nullable|string',
    ]);

    // Manual number for walk-in
    if ($validated['queue_type'] === 'walk-in' && !empty($validated['queue_number'])) {
        // ✅ Only check ACTIVE statuses (waiting, serving)
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
        // Auto-generate number
        $prefix = $validated['queue_type'] === 'appointment' ? 'A' : 'W';

        // ✅ Only fetch ACTIVE numbers (waiting, serving)
        $activeNumbers = Queue::where('queue_number', 'like', "$prefix%")
            ->whereIn('status', ['waiting', 'serving'])
            ->pluck('queue_number')
            ->toArray();

        $i = 1;
        do {
            $queueNumber = $prefix . str_pad($i, 3, '0', STR_PAD_LEFT);
            $i++;
        } while (in_array($queueNumber, $activeNumbers));
    }

    $queue = Queue::create([
        'queue_number' => $queueNumber,
        'queue_type' => $validated['queue_type'],
        'service_type' => $validated['service_type'],
        'status' => 'waiting',
    ]);

    // 🔥 EMIT SOCKET EVENT FOR NEW QUEUE
    try {
        Http::timeout(1)->post('http://localhost:3001/event', [
            'type' => 'queue_added',
            'queue' => [
                'id' => $queue->id,
                'queue_number' => $queue->queue_number,
                'queue_type' => $queue->queue_type,
                'service_type' => $queue->service_type,
                'status' => $queue->status,
            ],
        ]);
    } catch (\Throwable $e) {
        \Log::warning('Failed to emit queue_added event: ' . $e->getMessage());
    }

    return response()->json($queue, 201);
}
    // QueueController.php
    public function nextQueueNumber(Request $request)
    {
        $request->validate([
            'queue_type' => 'required|in:walk-in,appointment',
        ]);

        $prefix = $request->queue_type === 'appointment' ? 'A' : 'W';

        // Fetch all active numbers
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

  public function cancel($id)
{
    $queue = Queue::findOrFail($id);
    $oldStatus = $queue->status;

    $queue->update(['status' => 'cancelled']);

    // Emit socket event (optional)
    try {
        Http::timeout(1)->post('http://localhost:3001/event', [
            'type' => 'queue_status_changed',
            'queue_id' => $queue->id,
            'queue_number' => $queue->queue_number,
            'old_status' => $oldStatus,
            'new_status' => 'cancelled',
        ]);
    } catch (\Throwable $e) {
        \Log::warning('Failed to emit queue_status_changed event: ' . $e->getMessage());
    }

    return response()->json([
        'message' => 'Queue cancelled successfully',
        'queue_id' => $queue->id
    ]);
}


    public function waiting()
    {
        return Queue::where('status', 'waiting')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function appointments()
    {
        return Queue::where('status', 'waiting')
            ->where('queue_type', 'appointment') 
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function callNext(Request $request)
    {
        $validated = $request->validate([
            'csoId' => 'required|exists:cso_staff,id',
            'customerType' => 'required|in:walk-in,appointment',
        ]);

        $cso = CSO::findOrFail($validated['csoId']);

        // 1️⃣ Finish ONLY this CSO's current queue
        Queue::where('cso_id', $cso->id)
            ->where('status', 'serving')
            ->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

        // 2️⃣ Get next waiting queue (GLOBAL waiting list)
        $queue = Queue::where('status', 'waiting')
            ->where('queue_type', $validated['customerType'])
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$queue) {
            return response()->json(['message' => 'No customers in queue'], 404);
        }

        // 3️⃣ Assign queue to THIS CSO ONLY
        $queue->update([
            'status' => 'serving',
            'cso_id' => $cso->id,
            'called_at' => now(),
        ]);

        // 4️⃣ Notify display (isolated by counter)
        try {
            Http::timeout(1)->post('http://localhost:3001/event', [
                'type' => 'customer_called',
                'counter_number' => $cso->counter_number,
                'queue_number' => $queue->queue_number,
                'queue_type' => $queue->queue_type,
                'queue_id' => $queue->id,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to emit customer_called event: ' . $e->getMessage());
        }

        return response()->json($queue);
    }

    public function getCurrent($csoId)
    {
        $queue = Queue::where('status', 'serving')
                      ->where('cso_id', $csoId)
                      ->with('cso') // include CSO info
                      ->first();

        return response()->json($queue ?? null); // always return JSON, even if null
    }

    public function complete(Request $request, $id)
    {
        $validated = $request->validate([
            'duration' => 'required|integer|min:0',
        ]);

        $queue = Queue::with('cso')->findOrFail($id);

        // 1️⃣ Mark queue completed
        $queue->update([
            'status' => 'completed',
            'completed_at' => now(),
            'service_duration' => $validated['duration'],
        ]);

        // 2️⃣ CLEAR CSO CURRENT QUEUE
        if ($queue->cso) {
            $queue->cso->update([
                'current_queue_id' => null,
            ]);
        }

        // 3️⃣ Notify display
        try {
            Http::timeout(1)->post('http://localhost:3001/event', [
                'type' => 'service_completed',
                'counter_number' => optional($queue->cso)->counter_number,
                'queue_id' => $queue->id,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to emit service_completed event: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Service completed',
            'queue' => $queue,
        ]);
    }

    public function currentForCso($csoId)
    {
        $queue = Queue::where('status', 'serving')
              ->where('cso_id', $csoId)
              ->first();

        return response()->json($queue);    
    }
}
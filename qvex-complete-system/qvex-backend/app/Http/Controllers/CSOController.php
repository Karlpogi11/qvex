<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB; 
use App\Models\CSO;
use Illuminate\Http\Request;
use App\Models\Queue;


class CSOController extends Controller
{ 

    //index() causing failed to load cso
 public function index()
{
    $csos = CSO::where('is_active', true)
    ->orderBy('counter_number')
    ->get();

$csos = $csos->map(function($cso) {
    $currentQueue = null;
    if ($cso->current_queue_id) {
        $currentQueue = Queue::find($cso->current_queue_id);
    }

    return [
        'id' => $cso->id,
        'name' => $cso->name,
        'counter_number' => $cso->counter_number,
        'is_active' => $cso->is_active,
        'current_queue' => $currentQueue ? [
            'id' => $currentQueue->id,
            'queue_number' => $currentQueue->queue_number,
            'customer_name' => $currentQueue->customer_name ?? null,
            'status' => $currentQueue->status,
        ] : null,
    ];
});


    return response()->json($csos)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}




    public function show($id)
{
    $cso = CSO::findOrFail($id);

    $currentQueue = Queue::where('cso_id', $cso->id)
        ->where('status', 'serving')
        ->first();

    return response()->json([
        'id' => $cso->id,
        'name' => $cso->name,
        'counter_number' => $cso->counter_number,
        'is_active' => $cso->is_active,
       // 'current_queue_id' => $cso->current_queue_id,
        'current_queue' => $currentQueue ? [
            'id' => $currentQueue->id,
            'queue_number' => $currentQueue->queue_number,
            'status' => $currentQueue->status,
        ] : null,
    ]);
}


  public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'counter_number' => 'required|integer',
    ]);

    // Check if CSO exists but is inactive
    $existingCso = CSO::where('name', $validated['name'])->first();

    if ($existingCso) {
        if (!$existingCso->is_active) {
            // Reactivate the existing CSO
            $existingCso->update([
                'is_active' => true,
                'counter_number' => $validated['counter_number']
            ]);
            return response()->json($existingCso, 200);
        } else {
            // CSO is already active
            return response()->json([
                'message' => 'CSO with this name already exists'
            ], 422);
        }
    }

    // Create new CSO
    $validated['is_active'] = true;
    $cso = CSO::create($validated);
    return response()->json($cso, 201);
}


      public function getCurrent($csoId)
{
    $currentQueue = Queue::where('cso_id', $csoId)
                         ->where('status', 'serving')
                         ->first();

    if (!$currentQueue) {
        return response()->json(null);
    }

    return response()->json([
        'id' => $currentQueue->id,
        'queue_number' => $currentQueue->queue_number,
        'queue_type' => $currentQueue->queue_type,
        'service_type' => $currentQueue->service_type,
        'status' => $currentQueue->status,
        'customer_name' => $currentQueue->customer_name ?? null,
        'started_at' => $currentQueue->started_at,
    ]);
}


public function updateStatus(Request $request, $id)
{
    $cso = CSO::findOrFail($id);

    // Make sure the table name matches your actual queue table
    $validated = $request->validate([
        'current_queue_id' => 'nullable|exists:queue_entries,id',
    ]);

    $cso->update($validated);

    return response()->json($cso);
}




    public function destroy($id)
    {
        $cso = CSO::findOrFail($id);
        $cso->update(['is_active' => false]);

        return response()->json(['message' => 'CSO removed successfully']);
    }
}

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CSOController;
use App\Http\Controllers\QueueController;

Route::prefix('queues')->group(function () {
    Route::get('/', [QueueController::class, 'index']);
    Route::get('/waiting', [QueueController::class, 'waiting']);
    Route::get('/appointments', [QueueController::class, 'appointments']);
    Route::get('/current/{csoId}', [QueueController::class, 'currentForCso']); 
    Route::post('/call-next', [QueueController::class, 'callNext']);   
    Route::post('/{queue}/complete', [QueueController::class, 'complete']);  
    Route::post('/', [QueueController::class, 'store']);   
    Route::get('/next-number', [QueueController::class, 'nextQueueNumber']);
    Route::post('queues/{queue}/cancel', [QueueController::class, 'cancel']);
    Route::patch('/csos/{id}/status', [CSOController::class, 'updateStatus']);
      Route::get('/current/{csoId}', [QueueController::class, 'getCurrent']); 
     


});


Route::prefix('csos')->group(function () {
    Route::get('/', [CSOController::class, 'index']);
    Route::get('/{id}', [CSOController::class, 'show']);
    Route::patch('/{id}/status', [CSOController::class, 'updateStatus']);
    Route::get('/{id}/current-queue', [CSOController::class, 'currentQueue']);
});

Route::get('/test', function () {
    return response()->json([
        'message' => 'CORS is working!',
        'timestamp' => now()
    ]);
});

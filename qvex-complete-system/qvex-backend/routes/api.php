<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CSOController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\SettingsController; 
use App\Http\Controllers\StatisticsController;

Route::prefix('queues')->group(function () {
    Route::get('/', [QueueController::class, 'index']);
    Route::get('/waiting', [QueueController::class, 'waiting']);
    Route::get('/appointments', [QueueController::class, 'appointments']);
    Route::get('/current/{csoId}', [QueueController::class, 'currentForCso']); 
    Route::post('/call-next', [QueueController::class, 'callNext']);   
    Route::post('/{queue}/complete', [QueueController::class, 'complete']);  
    Route::post('/', [QueueController::class, 'store']);   
    Route::get('/next-number', [QueueController::class, 'nextQueueNumber']);
    Route::delete('/{queue}', [QueueController::class, 'cancel']);
});

Route::prefix('csos')->group(function () {
    Route::get('/', [CSOController::class, 'index']);
    Route::get('/{id}', [CSOController::class, 'show']);
    Route::post('/', [CSOController::class, 'store']); // ✅ ADD THIS for creating CSO
    Route::delete('/{id}', [CSOController::class, 'destroy']); // ✅ ADD THIS for deleting CSO
    Route::patch('/{id}/status', [CSOController::class, 'updateStatus']);
    Route::get('/{id}/current-queue', [CSOController::class, 'getCurrent']);
});

// ✅ ADD SETTINGS ROUTES
Route::prefix('settings')->group(function () {
    Route::get('/service-types', [SettingsController::class, 'getServiceTypes']);
    Route::post('/service-types', [SettingsController::class, 'updateServiceTypes']);
});


// Statistics routes
Route::get('/statistics/daily', [StatisticsController::class, 'getDaily']);
Route::get('/statistics/cso/{csoId}', [StatisticsController::class, 'getCsoStats']);
Route::get('/statistics/average-wait-time', [StatisticsController::class, 'getAverageWaitTime']);
Route::get('/statistics/cso-comparison', [StatisticsController::class, 'getCsoComparison']);


Route::get('/test', function () {
    return response()->json([
        'message' => 'CORS is working!',
        'timestamp' => now()
    ]);
});
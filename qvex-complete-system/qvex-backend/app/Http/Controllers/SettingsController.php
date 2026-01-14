<?php

namespace App\Http\Controllers;

use App\Models\ServiceType;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function getServiceTypes()
    {
        $serviceTypes = ServiceType::where('is_active', true)
            ->pluck('name')
            ->toArray();
        
        // Return array of names for frontend
        return response()->json($serviceTypes);
    }

    public function updateServiceTypes(Request $request)
    {
        $validated = $request->validate([
            'service_types' => 'required|array',
            'service_types.*' => 'required|string',
        ]);

        // Delete all existing service types
        ServiceType::query()->delete();

        // Create new ones
        foreach ($validated['service_types'] as $typeName) {
            ServiceType::create([
                'name' => $typeName,
                'is_active' => true,
            ]);
        }

        return response()->json([
            'message' => 'Service types updated successfully',
            'service_types' => $validated['service_types']
        ]);
    }
}
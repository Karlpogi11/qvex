<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\ServiceType;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        return Setting::all();
    }

    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $validated['value']]
        );

        return response()->json($setting);
    }

    public function getServiceTypes()
    {
        return ServiceType::where('is_active', true)->pluck('name');
    }

    public function updateServiceTypes(Request $request)
    {
        $validated = $request->validate([
            'types' => 'required|array',
            'types.*' => 'string',
        ]);

        // Deactivate all
        ServiceType::query()->update(['is_active' => false]);

        // Add or reactivate types
        foreach ($validated['types'] as $typeName) {
            ServiceType::updateOrCreate(
                ['name' => $typeName],
                ['is_active' => true]
            );
        }

        return response()->json(['message' => 'Service types updated successfully']);
    }
}

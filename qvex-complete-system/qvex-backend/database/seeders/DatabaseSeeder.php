<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // ============================================
        // 1. Seed Service Types
        // ============================================
        $serviceTypes = [
            'Repair',
            'Screen Replacement',
            'Battery',
            'Diagnostic',
            'Warranty'
        ];

        echo "Seeding Service Types...\n";
        foreach ($serviceTypes as $type) {
            DB::table('service_types')->insert([
                'name' => $type,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }
        echo "✓ Service Types seeded: " . count($serviceTypes) . " types\n";

        // ============================================
        // 2. Seed CSO Staff
        // ============================================
        echo "\nSeeding CSO Staff...\n";
        for ($i = 1; $i <= 6; $i++) {
            DB::table('cso_staff')->insert([
                'name' => "CSO $i",
                'counter_number' => $i,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }
        echo "✓ CSO Staff seeded: 6 staff members\n";

        // ============================================
        // 3. Seed Settings
        // ============================================
        $settings = [
            ['key' => 'dark_mode', 'value' => 'false'],
            ['key' => 'company_name', 'value' => 'Mobilecare'],
            ['key' => 'system_name', 'value' => 'Qvex'],
            ['key' => 'max_queue_display', 'value' => '10'],
            ['key' => 'auto_refresh_interval', 'value' => '5']
        ];

        echo "\nSeeding Settings...\n";
        foreach ($settings as $setting) {
            DB::table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }
        echo "✓ Settings seeded: " . count($settings) . " settings\n";

        // ============================================
        // 4. Seed Sample Queue Entries (Optional - for testing)
        // ============================================
        echo "\nSeeding Sample Queue Entries...\n";
        
        // Walk-in customers
        for ($i = 1; $i <= 3; $i++) {
            DB::table('queue_entries')->insert([
                'queue_number' => 'W' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'queue_type' => 'walkIn',
                'customer_name' => null,
                'service_type' => $serviceTypes[array_rand($serviceTypes)],
                'status' => 'waiting',
                'cso_name' => null,
                'service_duration' => null,
                'queued_at' => $now->copy()->subMinutes(rand(5, 30)),
                'served_at' => null,
                'completed_at' => null,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        // Appointment customers
        $appointmentNames = ['John Doe', 'Jane Smith', 'Robert Johnson'];
        for ($i = 1; $i <= 3; $i++) {
            DB::table('queue_entries')->insert([
                'queue_number' => 'A' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'queue_type' => 'appointment',
                'customer_name' => $appointmentNames[$i - 1],
                'service_type' => $serviceTypes[array_rand($serviceTypes)],
                'status' => 'waiting',
                'cso_name' => null,
                'service_duration' => null,
                'queued_at' => $now->copy()->subMinutes(rand(10, 45)),
                'served_at' => null,
                'completed_at' => null,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }
        echo "✓ Sample Queue Entries seeded: 6 entries\n";

        echo "\n========================================\n";
        echo "✓ Database seeding completed successfully!\n";
        echo "========================================\n";
    }
}
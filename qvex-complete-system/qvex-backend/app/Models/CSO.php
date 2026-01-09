<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CSO extends Model
{
    // Use the actual table
    protected $table = 'cso_staff';

    protected $fillable = ['name', 'counter_number', 'is_active'];

      public function queues()
    {
        return $this->hasMany(Queue::class, 'cso_id');
    }

    //Assuming you have a currentQueue relationship
    public function currentQueue()
    {
           return $this->hasOne(Queue::class, 'cso_id')
                    ->where('status', 'serving')
                    ->whereNull('completed_at')
                    ->latest('called_at');
    }
}

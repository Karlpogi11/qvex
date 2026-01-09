<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;
    protected $table = 'queue_entries';

   protected $fillable = [
    'queue_number',
    'queue_type',
    'service_type',
    'status',
    'cso_id',
    'queued_at',
    'completed_at',
    'service_duration',
    'id',
];

    protected $casts = [
        'queued_at' => 'datetime',
        'completed_at' => 'datetime',
        'service_duration' => 'integer',
    ];

    public function cso()
    {
        return $this->belongsTo(CSO::class, 'cso_id');  
    }

    public function current_queue()
    {
        //return $this->hasOne(Queue::class, 'cso_id')->where('status', 'serving');
        return $this->hasOne(Queue::class, 'cso_id') //chmages
        ->where('status', 'serving')
        ->whereNull('completed_at'); // filter out old serving queues
    }       
}

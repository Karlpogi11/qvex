<?php
// app/Events/QueueCalled.php 
// namespace App\Events;

// use App\Models\Queue;
// use Illuminate\Broadcasting\Channel;
// use Illuminate\Broadcasting\InteractsWithSockets;
// use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
// use Illuminate\Queue\SerializesModels;

// class QueueCalled implements ShouldBroadcast
// {
//     use InteractsWithSockets, SerializesModels;

//     public $type = 'customer_called';
//     public $cso_id;
//     public $queue_number;
//     public $counter_number;

//     public function __construct(Queue $queue)
//     {
//         $this->cso_id = $queue->cso_id;
//         $this->queue_number = $queue->queue_number;
//         $this->counter_number = optional($queue->cso)->counter_number; // may be null if not loaded
//     }

//     public function broadcastOn()
//     {
//         return new Channel('display'); // your existing channel
//     }

//     public function broadcastAs()
//     {
//         return $this->type; // 'customer_called'
//     }

//     public function broadcastWith()
//     {
//         return [
//             'type' => $this->type,
//             'cso_id' => $this->cso_id,
//             'queue_number' => $this->queue_number,
//             'counter_number' => $this->counter_number,
//         ];
//     }
// }
namespace App\Events;

use App\Models\Queue;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QueueCalled implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $queue;

    public function __construct(Queue $queue)
    {
        $this->queue = $queue;
    }

    public function broadcastOn()
    {
        return new Channel('display'); // channel all displays listen to
    }

    public function broadcastAs()
    {
        return 'customer_called';
    }
}

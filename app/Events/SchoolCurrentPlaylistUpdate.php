<?php

namespace App\Events;

use App\Models\School;
use App\Models\SchoolCurrent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SchoolCurrentPlaylistUpdate implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $school;
    public $session;
    public $action;

    /**
     * Create a new event instance.
     */
    public function __construct(School $school, SchoolCurrent $session, $action = 'updated')
    {
        $this->school = $school;
        // e.g. reload tracks completely with fresh relations
        $this->session = $session->load('tracks.addedBy');
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('school.currents.' . $this->school->id),
        ];
    }
}

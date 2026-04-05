<?php

namespace App\Events;

use App\Models\School;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SchoolCurrentVoteUpdate implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $schoolId;
    public $userId;
    public $userName;
    public $userAvatar;
    public $vote; // 'good' or 'bad'

    public function __construct(School $school, User $user, string $vote)
    {
        $this->schoolId = $school->id;
        $this->userId = $user->id;
        $this->userName = $user->name;
        $this->userAvatar = $user->profile_picture;
        $this->vote = $vote;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("school.currents.{$this->schoolId}"),
        ];
    }
}

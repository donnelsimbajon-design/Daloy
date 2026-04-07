<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupCall extends Model
{
    protected $fillable = [
        'conversation_id', 'channel_name', 'started_by', 'started_at', 'ended_at'
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function host()
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function participants()
    {
        return $this->hasMany(GroupCallParticipant::class);
    }

    public function activeParticipants()
    {
        return $this->hasMany(GroupCallParticipant::class)->whereNull('left_at');
    }

    public function chatMessages()
    {
        return $this->hasMany(GroupCallMessage::class);
    }

    public function isActive(): bool
    {
        return $this->ended_at === null;
    }
}

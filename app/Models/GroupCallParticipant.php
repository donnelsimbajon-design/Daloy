<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupCallParticipant extends Model
{
    protected $fillable = [
        'group_call_id', 'user_id', 'joined_at', 'left_at', 'role', 'is_muted_by_host'
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'is_muted_by_host' => 'boolean',
        ];
    }

    public function groupCall()
    {
        return $this->belongsTo(GroupCall::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

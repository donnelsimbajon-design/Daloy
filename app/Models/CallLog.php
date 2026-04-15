<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallLog extends Model
{
    protected $fillable = [
        'conversation_id',
        'initiated_by',
        'call_type',
        'is_group_call',
        'participant_ids',
        'started_at',
        'ended_at',
        'duration_seconds',
        'end_reason',
        'terminated_by',
    ];

    protected $casts = [
        'participant_ids' => 'array',
        'is_group_call'   => 'boolean',
        'started_at'      => 'datetime',
        'ended_at'        => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function terminatedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'terminated_by');
    }

    public function getDurationFormattedAttribute(): string
    {
        $s = $this->duration_seconds;
        if ($s < 60) return "{$s}s";
        $m = intdiv($s, 60);
        $r = $s % 60;
        return $r > 0 ? "{$m}m {$r}s" : "{$m}m";
    }
}

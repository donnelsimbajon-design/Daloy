<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'admin_id', 'title', 'message', 'type',
        'target_audience', 'school_id', 'display_location',
        'scheduled_at', 'expires_at', 'is_active',
        'sent_count', 'read_count',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'expires_at'   => 'datetime',
            'is_active'    => 'boolean',
        ];
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function getStatusAttribute(): string
    {
        if (!$this->is_active) return 'deactivated';
        if ($this->sent_count === 0 && $this->scheduled_at && $this->scheduled_at->isFuture()) {
            return 'scheduled';
        }
        if ($this->sent_count === 0) return 'draft';
        if ($this->expires_at && $this->expires_at->isPast()) return 'expired';
        return 'active';
    }
}

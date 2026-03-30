<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Event extends Model
{
    protected $fillable = [
        'user_id',
        'school_id',
        'title',
        'description',
        'location',
        'meeting_link',
        'starts_at',
        'ends_at',
        'cover_image',
        'privacy',
        'status',
        'is_pinned',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_pinned' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function rsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_rsvps')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /**
     * Auto-compute status based on current time.
     */
    public function computeStatus(): string
    {
        $now = Carbon::now();

        if ($this->ends_at && $now->greaterThan($this->ends_at)) {
            return 'ended';
        }

        if ($now->greaterThanOrEqualTo($this->starts_at)) {
            return 'live';
        }

        return 'upcoming';
    }

    /**
     * Sync the status column with real-time.
     */
    public function syncStatus(): void
    {
        $computed = $this->computeStatus();
        if ($this->status !== $computed) {
            $this->update(['status' => $computed]);
        }
    }

    // ── Scopes ─────────────────────────────────────────────────────────

    public function scopeUpcoming($query)
    {
        return $query->where('starts_at', '>', now());
    }

    public function scopeLive($query)
    {
        return $query->where('starts_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('ends_at')
                  ->orWhere('ends_at', '>', now());
            });
    }

    public function scopeEnded($query)
    {
        return $query->where('ends_at', '<=', now());
    }

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}

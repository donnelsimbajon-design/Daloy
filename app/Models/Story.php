<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'user_id',
        'media_url',
        'type',
        'content',
        'expires_at',
        'visibility',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /** Same audience rules as the story feed, enforced on direct endpoints. */
    public function isVisibleTo(User $viewer): bool
    {
        if ($this->archived_at !== null || !$this->expires_at?->isFuture()) {
            return false;
        }
        if ($this->user_id === $viewer->id) {
            return true;
        }
        $owner = $this->user;
        if (!$owner || $owner->isBlockedWith($viewer)) {
            return false;
        }
        $friend = $viewer->isFriend($owner);
        if (!$friend && !$viewer->isFollowing($owner)) {
            return false;
        }
        return match ($this->visibility) {
            'public' => true,
            'friends' => $friend,
            'close_friends' => $owner->isCloseFriend($viewer),
            default => false,
        };
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function views()
    {
        return $this->hasMany(StoryView::class);
    }

    public function reactions()
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}

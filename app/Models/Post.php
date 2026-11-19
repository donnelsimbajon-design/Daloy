<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'school_id',
        'event_id',
        'content',
        'media_urls',
        'flow_velocity',
        'location_tag',
        'visibility',
        'is_pinned',
        // New fields
        'has_content_warning',
        'content_warning_label',
        'comment_permission',
        'repost_of_id',
        'is_announcement',
        'announcement_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'media_urls' => 'array',
            'is_pinned' => 'boolean',
            'has_content_warning' => 'boolean',
            'is_announcement' => 'boolean',
            'announcement_expires_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class)->orderBy('order');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function reactions()
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }

    public function hashtags()
    {
        return $this->belongsToMany(Hashtag::class, 'post_hashtags');
    }

    public function reports()
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    // --- New Relationships ---

    public function poll()
    {
        return $this->hasOne(Poll::class);
    }

    public function mentions()
    {
        return $this->hasMany(Mention::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function repostOf()
    {
        return $this->belongsTo(Post::class, 'repost_of_id');
    }

    public function reposts()
    {
        return $this->hasMany(Post::class, 'repost_of_id');
    }

    /**
     * Visibility check for direct post URLs and interactive endpoints.
     * Feed/profile queries still filter at the database layer to avoid leaks.
     */
    public function isVisibleTo(User $viewer): bool
    {
        if ($this->user_id === $viewer->id) {
            return true;
        }

        $owner = $this->user;
        if (!$owner || $owner->isBlockedWith($viewer)) {
            return false;
        }

        // Members can access posts shared inside their Schools. Private
        // Schools do not expose their posts to nonmembers.
        if ($this->school_id) {
            $school = $this->school;
            if (!$school) {
                return false;
            }
            if ($school->members()->where('users.id', $viewer->id)->exists()) {
                return true;
            }
            if ($school->privacy === 'private') {
                return false;
            }
        }

        return match ($this->visibility) {
            'public' => true,
            'followers' => $viewer->isFollowing($owner) || $viewer->isFriend($owner),
            'friends' => $viewer->isFriend($owner), // legacy posts
            'close_friends' => $owner->isCloseFriend($viewer),
            default => false,
        };
    }

    // --- Scopes ---

    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    public function scopeHighVelocity($query)
    {
        return $query->where('flow_velocity', 'high');
    }

    public function scopeActiveAnnouncements($query)
    {
        return $query->where('is_announcement', true)
            ->where(function ($q) {
                $q->whereNull('announcement_expires_at')
                  ->orWhere('announcement_expires_at', '>', now());
            });
    }
}

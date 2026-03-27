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
        'content',
        'media_urls',
        'flow_velocity',
        'location_tag',
        'visibility',
        'is_pinned',
    ];

    protected function casts(): array
    {
        return [
            'media_urls' => 'array',
            'is_pinned' => 'boolean',
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

    // --- Scopes ---

    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    public function scopeHighVelocity($query)
    {
        return $query->where('flow_velocity', 'high');
    }
}

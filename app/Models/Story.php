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

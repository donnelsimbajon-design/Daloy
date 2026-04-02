<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Poll extends Model
{
    protected $fillable = ['post_id', 'question', 'expires_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function options()
    {
        return $this->hasMany(PollOption::class);
    }

    public function votes()
    {
        return $this->hasMany(PollVote::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileVisit extends Model
{
    public $timestamps = false;

    protected $fillable = ['visited_user_id', 'visitor_user_id', 'visited_at'];

    protected function casts(): array
    {
        return ['visited_at' => 'datetime'];
    }

    public function visitedUser()
    {
        return $this->belongsTo(User::class, 'visited_user_id');
    }

    public function visitor()
    {
        return $this->belongsTo(User::class, 'visitor_user_id');
    }
}

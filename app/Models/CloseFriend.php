<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CloseFriend extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'friend_id', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function friend()
    {
        return $this->belongsTo(User::class, 'friend_id');
    }
}

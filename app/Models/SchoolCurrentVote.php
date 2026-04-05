<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolCurrentVote extends Model
{
    protected $fillable = ['school_current_id', 'user_id', 'vote'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolCurrentParticipant extends Model
{
    protected $fillable = ['school_current_id', 'user_id', 'last_heartbeat'];

    protected $casts = ['last_heartbeat' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function current()
    {
        return $this->belongsTo(SchoolCurrent::class, 'school_current_id');
    }
}

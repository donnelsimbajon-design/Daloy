<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolCurrentTrack extends Model
{
    protected $fillable = [
        'school_current_id',
        'added_by',
        'track_title',
        'track_url',
        'track_type',
        'status',
    ];

    public function current()
    {
        return $this->belongsTo(SchoolCurrent::class, 'school_current_id');
    }
    
    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedTrack extends Model
{
    protected $fillable = [
        'user_id',
        'track_url',
        'track_title',
        'track_type',
    ];
}

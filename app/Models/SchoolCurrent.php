<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolCurrent extends Model
{
    protected $fillable = ['school_id', 'admin_id', 'channel_name', 'session_name', 'current_track_title', 'track_url', 'track_type', 'is_active'];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function votes()
    {
        return $this->hasMany(SchoolCurrentVote::class);
    }

    public function tracks()
    {
        return $this->hasMany(SchoolCurrentTrack::class);
    }

    public function participants()
    {
        return $this->hasMany(SchoolCurrentParticipant::class);
    }

    public function activeParticipants()
    {
        return $this->hasMany(SchoolCurrentParticipant::class)
            ->where('last_heartbeat', '>=', now()->subSeconds(15));
    }

    public function messages()
    {
        return $this->hasMany(SchoolCurrentMessage::class);
    }
}

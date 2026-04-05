<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementInteraction extends Model
{
    protected $fillable = [
        'announcement_id',
        'user_id',
        'vote',
        'feedback',
        'dismissed',
    ];

    protected $casts = [
        'dismissed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}

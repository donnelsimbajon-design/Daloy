<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileBadge extends Model
{
    public $timestamps = false;

    protected $fillable = ['key', 'label', 'description', 'icon', 'color'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_badges', 'badge_id', 'user_id')
            ->withPivot('earned_at');
    }
}

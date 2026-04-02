<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = ['name', 'description', 'rules', 'privacy', 'cover_image', 'profile_image', 'created_by', 'invite_token'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'school_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function scopePublic($query)
    {
        return $query->where('privacy', 'public');
    }
}

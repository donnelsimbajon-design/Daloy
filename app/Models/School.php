<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = ['name', 'description', 'privacy', 'cover_image', 'created_by'];

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

    public function scopePublic($query)
    {
        return $query->where('privacy', 'public');
    }
}

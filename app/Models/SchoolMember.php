<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolMember extends Model
{
    protected $fillable = ['school_id', 'user_id', 'role'];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

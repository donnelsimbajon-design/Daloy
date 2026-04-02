<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterestTag extends Model
{
    public $timestamps = false;

    protected $fillable = ['label'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_interest_tags', 'tag_id', 'user_id');
    }
}

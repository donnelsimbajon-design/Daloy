<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hashtag extends Model
{
    protected $fillable = ['name', 'post_count'];

    public function posts()
    {
        return $this->belongsToMany(Post::class, 'post_hashtags');
    }
}

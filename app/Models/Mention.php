<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mention extends Model
{
    public $timestamps = false;

    protected $fillable = ['post_id', 'comment_id', 'mentioned_user_id', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }

    public function mentionedUser()
    {
        return $this->belongsTo(User::class, 'mentioned_user_id');
    }
}

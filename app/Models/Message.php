<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = ['conversation_id', 'user_id', 'content', 'media_url', 'read_at', 'reply_to_id', 'deleted_for_everyone_at'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'deleted_for_everyone_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    public function messageReactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function isDeletedForEveryone(): bool
    {
        return $this->deleted_for_everyone_at !== null;
    }
}

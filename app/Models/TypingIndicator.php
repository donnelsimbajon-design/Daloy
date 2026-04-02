<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypingIndicator extends Model
{
    public $timestamps = false;

    protected $fillable = ['conversation_id', 'user_id', 'updated_at'];

    protected function casts(): array
    {
        return ['updated_at' => 'datetime'];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MutedKeyword extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'keyword', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

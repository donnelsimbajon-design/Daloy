<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestrictedUser extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'restricted_user_id', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function restrictedUser()
    {
        return $this->belongsTo(User::class, 'restricted_user_id');
    }
}

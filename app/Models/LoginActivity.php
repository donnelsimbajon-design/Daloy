<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginActivity extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'ip_address', 'user_agent', 'device_type',
        'location', 'logged_in_at', 'logged_out_at', 'session_token'
    ];

    protected function casts(): array
    {
        return [
            'logged_in_at' => 'datetime',
            'logged_out_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isCurrentSession(string $sessionToken): bool
    {
        return $this->session_token === $sessionToken;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminLog extends Model
{
    protected $fillable = ['admin_id', 'action', 'ip_address', 'metadata'];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}

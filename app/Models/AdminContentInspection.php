<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminContentInspection extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'target_type',
        'target_id',
        'reason',
        'ip_address',
        'inspected_at',
    ];

    protected $casts = [
        'inspected_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}

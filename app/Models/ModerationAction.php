<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModerationAction extends Model
{
    protected $fillable = ['admin_id', 'action_type', 'target_type', 'target_id', 'reason'];

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}

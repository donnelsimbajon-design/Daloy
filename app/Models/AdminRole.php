<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminRole extends Model
{
    protected $fillable = ['name', 'display_name', 'description', 'color', 'is_system'];

    protected function casts(): array
    {
        return ['is_system' => 'boolean'];
    }

    public function permissions()
    {
        return $this->belongsToMany(
            AdminPermission::class,
            'admin_role_permissions',
            'role_id',
            'permission_id'
        );
    }

    public function admins()
    {
        return $this->hasMany(Admin::class, 'role_id');
    }
}

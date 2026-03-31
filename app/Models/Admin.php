<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    protected $fillable = ['user_id', 'role', 'role_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function adminRole()
    {
        return $this->belongsTo(AdminRole::class, 'role_id');
    }

    public function moderationActions()
    {
        return $this->hasMany(ModerationAction::class);
    }

    public function logs()
    {
        return $this->hasMany(AdminLog::class);
    }

    public function resolvedReports()
    {
        return $this->hasMany(Report::class, 'resolved_by');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function can(string $permissionKey): bool
    {
        return \App\Services\PermissionChecker::can($this, $permissionKey);
    }
}

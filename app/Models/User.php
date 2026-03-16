<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
        'bio',
        'about',
        'profile_picture',
        'background_picture',
        'location',
        'privacy_setting',
        'notification_preferences',
        'font_size',
        'reduce_motion',
        'high_contrast',
        'dark_mode',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'array',
            'reduce_motion' => 'boolean',
            'high_contrast' => 'boolean',
            'dark_mode' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function reactions()
    {
        return $this->hasMany(Reaction::class);
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'user_id')
            ->withTimestamps();
    }

    public function following()
    {
        return $this->belongsToMany(User::class, 'follows', 'user_id', 'following_id')
            ->withTimestamps();
    }

    public function schools()
    {
        return $this->belongsToMany(School::class, 'school_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function createdSchools()
    {
        return $this->hasMany(School::class, 'created_by');
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function ripples()
    {
        return $this->hasMany(Ripple::class);
    }

    public function sentRipples()
    {
        return $this->hasMany(Ripple::class, 'sender_id');
    }

    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'user_id', 'blocked_user_id')
            ->withTimestamps();
    }

    public function blockedBy()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'blocked_user_id', 'user_id')
            ->withTimestamps();
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function eventRsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function sentFriendRequests()
    {
        return $this->hasMany(FriendRequest::class, 'sender_id');
    }

    public function receivedFriendRequests()
    {
        return $this->hasMany(FriendRequest::class, 'receiver_id');
    }

    public function friends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
            ->withTimestamps();
    }

    public function sentFollowRequests()
    {
        return $this->hasMany(FollowRequest::class, 'follower_id');
    }

    public function receivedFollowRequests()
    {
        return $this->hasMany(FollowRequest::class, 'following_id');
    }

    // --- Helpers ---

    public function isFollowing(User $user): bool
    {
        return $this->following()->where('following_id', $user->id)->exists();
    }

    public function isFriend(User $user): bool
    {
        return $this->friends()->where('friend_id', $user->id)->exists();
    }

    public function isAdmin(): bool
    {
        return $this->admin !== null;
    }
}

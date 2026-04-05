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
        // New fields
        'pronouns',
        'show_activity_status',
        'featured_post_id',
        'profile_accent',
        'notifications_snoozed_until',
        'can_initiate_calls',
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
            'show_activity_status' => 'boolean',
            'can_initiate_calls' => 'boolean',
            'notifications_snoozed_until' => 'datetime',
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
            ->withPivot('last_read_at', 'role')
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

    // --- New Relationships ---

    public function stories()
    {
        return $this->hasMany(Story::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function bookmarkedPosts()
    {
        return $this->belongsToMany(Post::class, 'bookmarks')
            ->withPivot('created_at');
    }

    public function closeFriends()
    {
        return $this->belongsToMany(User::class, 'close_friends', 'user_id', 'friend_id');
    }

    public function closeFriendOf()
    {
        return $this->belongsToMany(User::class, 'close_friends', 'friend_id', 'user_id');
    }

    public function tideScore()
    {
        return $this->hasOne(TideScore::class);
    }

    public function interestTags()
    {
        return $this->belongsToMany(InterestTag::class, 'user_interest_tags', 'user_id', 'tag_id');
    }

    public function badges()
    {
        return $this->belongsToMany(ProfileBadge::class, 'user_badges', 'user_id', 'badge_id')
            ->withPivot('earned_at');
    }

    public function featuredPost()
    {
        return $this->belongsTo(Post::class, 'featured_post_id');
    }

    public function restrictedUsers()
    {
        return $this->belongsToMany(User::class, 'restricted_users', 'user_id', 'restricted_user_id');
    }

    public function restrictedBy()
    {
        return $this->belongsToMany(User::class, 'restricted_users', 'restricted_user_id', 'user_id');
    }

    public function mutedKeywords()
    {
        return $this->hasMany(MutedKeyword::class);
    }

    public function loginActivities()
    {
        return $this->hasMany(LoginActivity::class);
    }

    public function searchHistory()
    {
        return $this->hasMany(SearchHistory::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'reporter_id');
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

    /**
     * Returns true if $this has blocked $user OR $user has blocked $this.
     * Use this for any mutual block check.
     */
    public function isBlockedWith(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_user_id', $user->id)->exists()
            || $user->blockedUsers()->where('blocked_user_id', $this->id)->exists();
    }

    public function isCloseFriend(User $user): bool
    {
        return $this->closeFriends()->where('friend_id', $user->id)->exists();
    }

    public function hasRestricted(User $user): bool
    {
        return $this->restrictedUsers()->where('restricted_user_id', $user->id)->exists();
    }

    public function isAdmin(): bool
    {
        return $this->admin !== null;
    }

    /**
     * Activity status computed from updated_at.
     */
    public function getActivityStatus(): string
    {
        if (!$this->show_activity_status) {
            return 'hidden';
        }

        $diff = now()->diffInMinutes($this->updated_at);

        if ($diff <= 5) return 'Active Now';
        if ($diff <= 1440) return 'Active Today'; // 24 hours
        if ($diff <= 10080) return 'Active This Week'; // 7 days
        return 'Recently';
    }

    /**
     * Profile completion score out of 100.
     */
    public function getProfileCompletionScore(): array
    {
        $items = [];
        $score = 0;

        if ($this->name) { $score += 10; $items['name'] = true; } else { $items['name'] = false; }
        if ($this->username) { $score += 10; $items['username'] = true; } else { $items['username'] = false; }
        if ($this->profile_picture) { $score += 20; $items['profile_picture'] = true; } else { $items['profile_picture'] = false; }
        if ($this->background_picture) { $score += 10; $items['background_picture'] = true; } else { $items['background_picture'] = false; }
        if ($this->bio) { $score += 15; $items['bio'] = true; } else { $items['bio'] = false; }
        if ($this->about) { $score += 10; $items['about'] = true; } else { $items['about'] = false; }
        if ($this->location) { $score += 10; $items['location'] = true; } else { $items['location'] = false; }
        if ($this->interestTags()->count() > 0) { $score += 15; $items['interests'] = true; } else { $items['interests'] = false; }

        return ['score' => $score, 'items' => $items];
    }

    public function isNotificationsSnoozed(): bool
    {
        return $this->notifications_snoozed_until && $this->notifications_snoozed_until->isFuture();
    }
}

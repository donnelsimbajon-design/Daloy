# 📏 Daloy 2.0 — RULES

Non-negotiable rules for all development, design, and AI-generated code.
Every rule must be followed. No exceptions.

---

## 🎨 DESIGN RULES

---

### ❌ RULE D1 — NEVER Change the Color Palette

The ocean-themed color palette is SACRED and PERMANENT.
Do not introduce new base colors. Do not replace CSS variables.
Do not use generic colors (purple gradients, plain white, plain black).
Every new feature must use ONLY the existing palette variables.

**The Official Daloy 2.0 Color Palette:**

```css
/* ── Ocean Dark Backgrounds ── */
--color-abyss        /* Deepest dark — root background */
--color-deep         /* Main dark surface */
--color-current      /* Card / panel surface */
--color-surface      /* Elevated surface */

/* ── Bioluminescent Accents ── */
--color-glow         /* Primary accent — bioluminescent teal/cyan */
--color-ripple       /* Secondary accent */
--color-coral        /* Warm accent */
--color-tide         /* Muted accent */

/* ── Text Colors ── */
--color-foam         /* Primary text (near white) */
--color-mist         /* Secondary text */
--color-drift        /* Muted / placeholder text */

/* ── Functional Colors (do not modify) ── */
--color-danger       /* Errors / destructive actions */
--color-warning      /* Warnings / caution states */
--color-success      /* Success / confirmed states */
```

**Violations that are FORBIDDEN:**
- Adding any hex color directly in JSX or CSS that isn't a variable
- Adding new Tailwind colors outside the existing config
- Using white (`#fff`, `white`) as a background
- Using purple, pink, or orange as primary colors
- Using any gradient that isn't ocean-based (deep blue → teal)

---

### ❌ RULE D2 — NEVER Break Glassmorphism

Every new UI panel, card, modal, and component must follow the glassmorphism pattern already established in the system.

**Required glassmorphism properties:**
```css
/* Every new card/panel must have: */
background: rgba(var(--color-current-rgb), 0.6);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(var(--color-glow-rgb), 0.15);
box-shadow: 0 8px 32px rgba(var(--color-abyss-rgb), 0.4);
border-radius: 16px; /* or matching existing radius */
```

**Violations that are FORBIDDEN:**
- Solid opaque backgrounds on new panels (unless matching an existing opaque element)
- Removing blur effects from existing components
- Adding hard drop shadows without the glow color
- Flat design elements that break the depth/layer feel

---

### ❌ RULE D3 — NEVER Remove or Replace Ocean Terminology

All UI labels, button text, page titles, and variable names must use the established ocean vocabulary.

**Required naming for new features:**
| If you're building... | Use this name |
|----------------------|---------------|
| A new notification type | [ocean word] + Ripple |
| A new feed section | [ocean word] + Flow or Current |
| A new user group feature | School [something] |
| A new score/rank | Tide [something] or [ocean word] Score |
| A new status | [ocean adjective] (e.g., Adrift, Surfacing, Deep) |
| A new user action | [ocean verb] (e.g., Wave, Dive, Anchor) |

**Violations that are FORBIDDEN:**
- Renaming "Voyager" to "User" in any UI label
- Renaming "Ripple" to "Notification" in any UI label
- Renaming "School" to "Group" in any UI label
- Renaming "Deep Flow" to "Feed" in any UI label
- Adding generic social media terms (Tweet, Post boost, Trending, Viral)

---

### ✅ RULE D4 — ALWAYS Match Existing Component Patterns

New UI components must visually match existing ones.
Study the existing component before building a new one.

**Pattern references:**
| Building... | Study this existing component |
|------------|-------------------------------|
| New card | PostCard.jsx or UserCard.jsx |
| New button | FollowButton.jsx or FriendRequestButton.jsx |
| New modal | CreatePostModal.jsx or ShareModal.jsx |
| New sidebar section | ReefPanel.jsx |
| New notification item | NotificationPanel.jsx |
| New admin card | StatCard.jsx |
| New admin table | DataTable.jsx |
| New admin modal | Modal.jsx (Admin) |
| New admin badge | StatusBadge.jsx |

---

### ✅ RULE D5 — ALWAYS Use Admin CSS Namespace

The admin panel has its own completely separate stylesheet: `resources/css/admin.css`
All admin CSS classes use the `adm-*` prefix.

**Admin CSS class namespace:**
```
adm-sidebar          adm-topbar           adm-main-wrapper
adm-main-content     adm-card             adm-card-header
adm-card-body        adm-stats-grid       adm-stat-card
adm-table            adm-table-wrapper    adm-toolbar
adm-filter-input     adm-filter-select    adm-btn
adm-btn-primary      adm-btn-danger       adm-badge
adm-badge-critical   adm-pagination       adm-modal-overlay
adm-modal            adm-toggle           adm-setting-item
adm-tabs             adm-tab              adm-notif-wrapper
adm-health-panel     adm-alert-panel      adm-metric-box
adm-actions-menu     adm-footer           adm-sidebar-overlay
```

**Rules:**
- New admin CSS must be added to `admin.css` only — never in component files
- New admin classes must follow the `adm-*` prefix
- Never use user-facing CSS classes inside admin pages
- Never use Tailwind classes inside admin pages (admin uses custom CSS only)

---

## 🔧 DEVELOPMENT RULES

---

### ❌ RULE V1 — NEVER Introduce Incompatible Libraries

The stack is fixed. These are FORBIDDEN additions:

**CSS / UI:**
- Bootstrap, Material UI, Chakra UI, Ant Design, Shadcn (unless already installed)
- Any CSS framework that conflicts with Tailwind CSS v4

**JavaScript:**
- jQuery or any jQuery-dependent library
- Any non-React component library not already in package.json
- Any library that requires a different build tool than Vite 7

**PHP / Laravel:**
- Any package that requires PHP < 8.2
- Any package that conflicts with Laravel 12.x
- Any auth package that conflicts with Sanctum 4.0

**Allowed additions (always check compatibility first):**
- New Laravel packages compatible with Laravel 12 + PHP 8.2
- New npm packages compatible with React 19 + Vite 7
- Any package that does NOT conflict with Tailwind CSS v4

---

### ✅ RULE V2 — ALWAYS Use Soft Deletes on Posts

Posts use Laravel's `SoftDeletes` trait.
**NEVER hard delete a post directly.**

**Correct approach:**
```php
// Before soft deleting — manually remove media files from disk
foreach ($post->media as $media) {
    Storage::disk('public')->delete($media->url);
}
$post->delete(); // This triggers soft delete via SoftDeletes trait
```

**Wrong approach:**
```php
Post::destroy($id);           // FORBIDDEN — may bypass soft delete
DB::table('posts')->delete(); // FORBIDDEN — bypasses Eloquent entirely
```

---

### ✅ RULE V3 — ALWAYS Apply the Block System to Queries

Every feed, profile, search, school, and messaging query must filter blocked users.
The block is MUTUAL — check both directions.

**Required block filter pattern:**
```php
$blockedByMe = Auth::user()->blockedUsers()->pluck('blocked_user_id');
$blockedMe   = Auth::user()->blockedBy()->pluck('user_id');
$allBlockedIds = $blockedByMe->merge($blockedMe)->unique();

// Apply to any query:
->whereNotIn('user_id', $allBlockedIds)

// For profile visits — return restricted view:
if ($user->isBlockedWith(Auth::user())) {
    return Inertia::render('UserProfile', ['canViewProfile' => false]);
}
```

**Locations where block filter is REQUIRED:**
- PostController@index (Deep Flow feed)
- SchoolController@show (school post feed)
- MessagingController (all messaging endpoints)
- SearchController (search results)
- UserProfileController@show (profile view)
- Any new feed, list, or discovery feature

---

### ✅ RULE V4 — ALWAYS Log Admin Actions

Every admin POST route must create BOTH records:

**1. ModerationAction** — what was done to what:
```php
ModerationAction::create([
    'admin_id'    => $admin->id,
    'action_type' => 'delete_post', // e.g. ban_user, suspend_user, delete_post
    'target_type' => 'post',
    'target_id'   => $post->id,
    'reason'      => $request->reason,
]);
```

**2. AdminLog** — human-readable audit trail:
```php
AdminLog::create([
    'admin_id'   => $admin->id,
    'action'     => "Deleted post #{$post->id} by {$post->user->username}",
    'ip_address' => $request->ip(),
    'metadata'   => [
        'target'    => "Post #{$post->id}",
        'target_id' => $post->id,
        'reason'    => $request->reason,
    ],
]);
```

**No admin POST route is complete without both records.**

---

### ✅ RULE V5 — ALWAYS Apply Privacy Filters

Every query that returns user content must respect privacy settings.

**Privacy levels:**
```php
// public    → visible to everyone (including non-friends)
// followers → visible to followers + friends only
// private   → visible to friends only + the user themselves

// Feed filter example:
->where(function($q) use ($friendIds, $followingIds) {
    $q->where('visibility', 'public')
      ->orWhere(function($q2) use ($friendIds, $followingIds) {
          $q2->where('visibility', 'followers')
             ->whereIn('user_id', $followingIds->merge($friendIds));
      })
      ->orWhere(function($q2) use ($friendIds) {
          $q2->where('visibility', 'private')
             ->whereIn('user_id', $friendIds);
      })
      ->orWhere('user_id', Auth::id()); // Always show own posts
})
```

---

### ✅ RULE V6 — ALWAYS Check Messaging Permissions

Before allowing a message to be sent, verify ALL conditions:

```php
// CONDITION 1: Neither user has blocked the other
if ($sender->isBlockedWith($receiver)) {
    return response()->json(['error' => 'Cannot send message.'], 403);
}

// CONDITION 2: At least one of these must be true:
$areFriends        = $sender->isFriend($receiver);
$areMutualFollow   = $sender->isFollowing($receiver) && $receiver->isFollowing($sender);
$isPublicProfile   = $receiver->privacy_setting === 'public';

if (!$areFriends && !$areMutualFollow && !$isPublicProfile) {
    return response()->json(['error' => 'Cannot send message.'], 403);
}
```

---

### ✅ RULE V7 — ALWAYS Validate Ownership Before Edit/Delete

Every destructive or mutating action on user content must verify ownership.

```php
// Correct approach:
if ($post->user_id !== Auth::id()) {
    abort(403, 'Unauthorized action.');
}

// For school admin actions — use the private helper:
$this->authorizeAdmin($school); // Checks creator OR admin role
```

---

### ✅ RULE V8 — ALWAYS Use Transactions for Complex Social Actions

Multi-step social actions (block, unblock, accept friend request) must use DB transactions to ensure data integrity.

```php
// Example: Block user (from UserProfileController)
DB::transaction(function () use ($userToBlock) {
    // 1. Remove friendship (both directions)
    Auth::user()->friends()->detach($userToBlock->id);
    $userToBlock->friends()->detach(Auth::id());

    // 2. Remove follows (both directions)
    Auth::user()->following()->detach($userToBlock->id);
    $userToBlock->following()->detach(Auth::id());

    // 3. Cancel all pending requests (both directions)
    FriendRequest::where(/* ... */)->delete();
    FollowRequest::where(/* ... */)->delete();

    // 4. Add block record
    BlockedUser::create([
        'user_id'         => Auth::id(),
        'blocked_user_id' => $userToBlock->id,
    ]);
});
// NOTE: Blocked user is NEVER notified
```

---

### ✅ RULE V9 — ALWAYS Sync Event Status on Load

Events have auto-computed statuses. Always call `syncStatus()` when loading events.

```php
// Event status lifecycle:
// upcoming → (starts_at reached) → live → (ends_at reached) → ended

// In EventController — always sync before returning:
$event->syncStatus();

// Sort order: live (0) → upcoming (1) → ended (2), then starts_at ASC
```

---

### ✅ RULE V10 — ALWAYS Keep the Block Silent

The blocked user must NEVER know they were blocked.

**This means:**
- No Ripple notification of type "blocked" — ever
- No email, no toast, no in-app message
- Profile appears as "not found" or heavily restricted
- Search results return nothing for the blocked user
- Group membership shown as "Hidden Member"
- The word "blocked" must never appear in any UI facing the blocked user

**The only notification allowed:**
A single private Ripple shown ONLY to the person who did the blocking:
```
"You have blocked [Username]. They can no longer interact with you."
```
This is visible only in the blocker's own notification panel.

---

## 📋 RULES QUICK CHECKLIST

Before submitting any code, verify every item:

### Design
- [ ] Only existing CSS color variables used — no new hex colors
- [ ] Glassmorphism applied to all new panels and cards
- [ ] Ocean terminology used in all UI labels
- [ ] New components match existing component patterns
- [ ] Admin CSS uses `adm-*` namespace in `admin.css` only

### Development
- [ ] No incompatible libraries introduced
- [ ] Posts use SoftDeletes — no hard deletes
- [ ] Block filter applied to all new queries (`allBlockedIds`)
- [ ] Admin actions logged (ModerationAction + AdminLog)
- [ ] Privacy filters applied (public/followers/private)
- [ ] Messaging permissions checked before sending
- [ ] Ownership verified before edit/delete
- [ ] DB transactions used for complex social actions
- [ ] Event `syncStatus()` called on all event loads
- [ ] Blocked user NEVER notified of the block

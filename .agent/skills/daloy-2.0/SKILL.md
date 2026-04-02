---
name: daloy-2.0
description: >
  Master skill for Daloy 2.0 — an ocean-themed social media platform built with Laravel 12,
  Inertia.js, and React. Use this skill whenever the user asks to build, modify, design, prompt,
  or plan anything related to Daloy 2.0. This includes frontend components, backend controllers,
  database migrations, admin panel features, user features, prompts, or any code generation task
  for this system. Triggers on: "Daloy", "add a feature", "create a prompt", "build a page",
  "fix a component", "admin panel", "voyager", "school", "ripple", "deep flow", or any reference
  to the platform's features. ALWAYS use this skill before writing any code, prompt, or plan
  for Daloy 2.0.
---

# 🌊 Daloy 2.0 — Master Skill

Daloy (Tagalog for "Flow") is a full-stack ocean-themed social networking platform.
Always read this skill fully before generating any code, prompt, or plan.

---

## 📍 MEMORY — What This System Is

### Stack
- **Backend:** Laravel 12, PHP ^8.2, Laravel Breeze, Sanctum, Inertia.js (Laravel)
- **Frontend:** React 19, @inertiajs/react, Tailwind CSS v4, Vite
- **Database:** SQLite (dev), Eloquent ORM
- **Location:** `c:\xampp\htdocs\daloy2.0` served via XAMPP

### Core Terminology
| Platform Term | Meaning |
|---|---|
| Voyager | A registered user |
| Deep Flow | The main feed |
| School | A community group |
| Ripple | A notification |
| River Flow | Secondary feed page |
| Reef | Right sidebar panel |
| Tide Score | User reputation score |

### Key Models (25 total)
User, Admin, Post, Media, Comment, Reaction (polymorphic), Hashtag, Story,
Follow, FollowRequest, FriendRequest, BlockedUser, School, SchoolMember,
Event, EventRsvp, Conversation, Message, Ripple, Report,
ModerationAction, AdminLog, AdminPermission, AdminRole, SystemSetting

### Key Controllers
PostController, UserProfileController, SchoolController, EventController,
MessagingController, SettingsController, AdminController, FriendRequestController,
FollowController, StoryController, CommentController, ReactionController,
SearchController, ShareController, VoyagerController

### Key Frontend Pages (User)
Dashboard.jsx (19KB), Conversations.jsx (28KB), EventDetail.jsx (29KB),
SchoolProfile.jsx (75KB), Settings.jsx (53KB), UserProfile.jsx (62KB),
Schools.jsx, Events.jsx, Explore.jsx, Ripples.jsx, Voyagers.jsx

### Key Frontend Pages (Admin)
Dashboard, Users, Moderation, Reports, Groups, Messages, Analytics, Settings, Logs

### Key Components
ReefPanel.jsx, StoryRail.jsx, PostCard.jsx, CreatePostModal.jsx, ShareModal.jsx,
NavDrawer.jsx, NotificationPanel.jsx, MessagePanel.jsx, FriendRequestButton.jsx,
UserCard.jsx, DiscoveryReef.jsx, TopNav.jsx, PostActions.jsx, FollowButton.jsx,
CommentsSection.jsx, CommentItem.jsx, Feed.jsx, FloatingActionButton.jsx

### Admin Components
Sidebar.jsx, Topbar.jsx, DataTable.jsx, BarChart.jsx, Modal.jsx, StatCard.jsx, StatusBadge.jsx

---

## 🎨 RULES — Design System (NEVER VIOLATE)

### ❌ RULE 1 — NEVER Change the Color Palette
The ocean-themed color palette is SACRED. Do not introduce new base colors.
Do not replace existing CSS variables. Do not use generic purple gradients, white backgrounds,
or any non-ocean colors. Every new feature must use ONLY the existing palette.

**Existing palette variables (always use these):**
```css
/* Ocean Dark Backgrounds */
--color-abyss          /* Deepest dark background */
--color-deep           /* Main dark surface */
--color-current        /* Card/panel surface */
--color-surface        /* Elevated surface */

/* Bioluminescent Accents */
--color-glow           /* Primary accent — bioluminescent teal/cyan */
--color-ripple         /* Secondary accent */
--color-coral          /* Warm accent */
--color-tide           /* Muted accent */

/* Text */
--color-foam           /* Primary text (near white) */
--color-mist           /* Secondary text */
--color-drift          /* Muted text */
```

### ❌ RULE 2 — NEVER Break the Glassmorphism Style
Every new UI element must follow the existing glassmorphism pattern:
- Semi-transparent backgrounds with `backdrop-filter: blur()`
- Subtle border with low-opacity white or glow color
- Soft box shadows using the glow color at low opacity
- No solid opaque panels unless they already exist in the system

### ❌ RULE 3 — NEVER Remove Ocean Terminology
All new features must use ocean-themed naming consistent with the platform:
- Users = Voyagers
- Notifications = Ripples
- Groups = Schools
- Feed = Deep Flow / River Flow
- Sidebar = Reef
- New features should follow this pattern (e.g., Tide Score, Wave reaction, Current status)

### ❌ RULE 4 — NEVER Introduce Incompatible Libraries
The stack is fixed. Do not introduce:
- New CSS frameworks (Bootstrap, MUI, Chakra, etc.)
- jQuery or non-React JS libraries
- Any package that conflicts with Tailwind CSS v4 or Vite 7
- Any PHP package that conflicts with Laravel 12

### ✅ RULE 5 — ALWAYS Use Existing Components First
Before creating any new component check if an existing one can be reused or extended:
- Admin UI → use StatCard, DataTable, StatusBadge, Modal, BarChart
- User UI → use PostCard, UserCard, ReefPanel, NotificationPanel
- Buttons → extend FollowButton or FriendRequestButton patterns
- Modals → follow CreatePostModal or ShareModal patterns

### ✅ RULE 6 — ALWAYS Follow the Block System Rules
The blocking system is MUTUAL, SILENT, and COMPLETE:
- Blocked users cannot see profile, posts, stories, groups, messages, search results
- The blocked person is NEVER notified they were blocked
- 48-hour cooldown after unblocking (tracked via `unblocked_at`)
- All feeds and queries must apply `allBlockedIds = blockedByMe ∪ blockedMe`
- Group members shown as "Hidden Member" when blocked

### ✅ RULE 7 — ALWAYS Follow the Admin CSS Namespace
Admin panel uses `adm-*` CSS class prefix exclusively.
Never use user-facing CSS classes inside admin pages.
New admin CSS must be added to `resources/css/admin.css` only.

### ✅ RULE 8 — ALWAYS Create AdminLog on Every Admin Action
Every mutating admin action must create:
1. A `ModerationAction` record (what was done, to whom)
2. An `AdminLog` record (human-readable label, IP, metadata JSON)
No admin POST route is complete without both records.

### ✅ RULE 9 — ALWAYS Apply Privacy Filters in Queries
Every feed, profile, school, and messaging query must:
- Exclude blocked users (both directions)
- Respect `privacy_setting` (public/followers/private)
- Check `comment_permission` on posts before allowing comments
- Check messaging permissions (friends OR mutual follow OR public profile)

### ✅ RULE 10 — ALWAYS Use Soft Deletes on Posts
Posts use `SoftDeletes`. Never hard-delete posts directly.
Always call `$post->delete()` which triggers soft delete.
Media files on disk must be manually deleted before soft delete.

---

## 🔧 PROCESS — How to Build Features for Daloy 2.0

When asked to build any new feature, always follow this process:

### Step 1 — Check Memory
Re-read the Memory section above. Identify which existing models, controllers,
components, and routes are relevant to the feature.

### Step 2 — Check Rules
Re-read the Rules section above. Confirm the feature does not violate any rule.
Especially check: color palette, block system, admin logging, privacy filters.

### Step 3 — Plan the Feature
Before writing any code, plan:
1. **Database** — What new migrations/tables are needed?
2. **Models** — What new models and relationships are needed?
3. **Controllers** — Which existing controllers need updating? Any new ones?
4. **Routes** — What new routes are needed (web.php or api.php)?
5. **Frontend** — Which existing pages/components need updating? Any new ones?
6. **Ripples** — Does this feature send notifications? What type?
7. **Admin** — Does this feature need an admin panel section?

### Step 4 — Generate Code in This Order
Always generate in this sequence to avoid dependency errors:
1. Migration files
2. Model files (with relationships)
3. Controller methods
4. Route additions
5. Frontend pages/components
6. CSS additions (user: existing variables only, admin: adm-* namespace)

### Step 5 — Verify Against Rules
After generating, re-check:
- [ ] Color palette unchanged
- [ ] Block system applied in all queries
- [ ] Admin actions logged
- [ ] Privacy filters applied
- [ ] Existing components reused where possible
- [ ] Ocean terminology used

---

## 📝 PROCESS — How to Generate Prompts for Daloy 2.0

When asked to generate a prompt for a feature, always include:

1. **System context paragraph** — Mention Laravel 12, React, Inertia.js, the relevant
   existing tables, models, controllers, and frontend files
2. **Feature breakdown** — List every sub-feature with specific technical requirements
3. **Database section** — Exact migration schema with column names and types
4. **Controller section** — Method names, logic, validation rules
5. **Route section** — Method, URI, controller method
6. **Frontend section** — Page/component name, props, state, functions, UI sections
7. **Design rule** — Always end with: "Match the existing ocean glassmorphism design —
   use existing CSS variables, Tailwind utility classes, and component patterns.
   DO NOT change the color palette."
8. **Block system reminder** — If feature touches feeds, profiles, or messaging,
   always remind to apply `allBlockedIds` filter

---

## 🗂️ COMPONENT FOLDER STRUCTURE (Reorganized)

```
resources/js/Components/
├── UI/
│   ├── Cards/         → PostCard.jsx, UserCard.jsx
│   ├── Buttons/       → FollowButton.jsx, FriendRequestButton.jsx, FloatingActionButton.jsx
│   ├── Panels/        → ReefPanel.jsx, NotificationPanel.jsx, MessagePanel.jsx
│   ├── Navigation/    → TopNav.jsx, NavDrawer.jsx, LanguageSelector.jsx
│   ├── Modals/        → CreatePostModal.jsx, ShareModal.jsx
│   ├── Badges/        → StatusBadge.jsx
│   └── Misc/          → Feed.jsx
├── Features/
│   ├── Posts/         → PostActions.jsx
│   ├── Comments/      → CommentsSection.jsx, CommentItem.jsx
│   ├── Stories/       → StoryRail.jsx
│   ├── Messaging/     → MessagePanel.jsx, ShareModal.jsx
│   ├── Social/        → FriendRequestButton.jsx, FollowButton.jsx, DiscoveryReef.jsx
│   └── Notifications/ → NotificationPanel.jsx
└── Admin/
    ├── UI/            → Sidebar.jsx, Topbar.jsx, StatCard.jsx, StatusBadge.jsx, Modal.jsx
    └── Features/      → DataTable.jsx, BarChart.jsx
```

---

## 🚦 QUICK REFERENCE — Existing Routes

### User Routes (authenticated)
`GET /` — Dashboard/Feed | `GET /explore` — Explore | `GET /ripples` — Notifications
`GET /conversations` — Messaging | `GET /schools` — Schools | `GET /events` — Events
`GET /voyagers` — All users | `GET /users/{user}` — Profile
`POST /users/{user}/block` — Block | `DELETE /users/{user}/unblock` — Unblock
`POST /posts` — Create post | `PUT /posts/{post}` — Edit | `DELETE /posts/{post}` — Delete
`POST /posts/{post}/like` — Toggle like | `GET /stories` — Stories | `POST /stories` — Create story

### API Routes (Sanctum)
`GET /api/user` | `POST /api/friend-request/send` | `POST /api/friend-request/accept`
`POST /api/follow` | `DELETE /api/unfollow` | `POST /api/conversations/start`
`POST /api/messages/send` | `GET /api/messages/{conversation}` | `GET /api/search`

### Admin Routes (prefix /admin)
`GET /admin/dashboard` | `GET /admin/users` | `GET /admin/moderation`
`GET /admin/reports` | `GET /admin/groups` | `GET /admin/messages`
`GET /admin/analytics` | `GET /admin/settings` | `GET /admin/logs`

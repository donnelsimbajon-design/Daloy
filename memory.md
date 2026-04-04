# 🌊 Daloy 2.0 — MEMORY

Current system state & architecture reference for AI-assisted development.

---

## 📦 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Laravel | 12.x |
| Frontend | React (via Inertia.js) | 19.x |
| CSS | Tailwind CSS | v4 |
| Build | Vite | 7.x |
| Icons | Lucide React | latest |
| Auth | Laravel Sanctum | 4.0 |
| DB | MySQL (XAMPP) | 8.x |
| PHP | PHP | 8.2+ |

---

## 🗃️ Database Tables (Key ones)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | Voyager accounts | name, email, username, profile_picture, privacy_setting |
| posts | User posts (SoftDeletes) | user_id, content, visibility, flow_velocity, school_id |
| comments | Post comments | post_id, user_id, content |
| reactions | Post reactions (polymorphic) | user_id, reactable_type, reactable_id, type(wave/fire/haha/sad/wow) |
| schools | Groups/Communities | name, description, creator_id |
| school_user | School membership (pivot) | school_id, user_id, role |
| ripples | Notifications | user_id, sender_id, type, notifiable_type, notifiable_id, data(JSON), read_at |
| friend_requests | Pending friend requests | sender_id, receiver_id, status |
| follow_requests | Pending follow requests | follower_id, following_id, status |
| blocked_users | Block relationships | user_id, blocked_user_id |
| events | School events | school_id, title, starts_at, ends_at, status |
| polls | Post polls | post_id, question, expires_at |
| poll_options | Poll choices | poll_id, label, votes_count |
| media | Post media files | post_id, type, url, order |
| hashtags | Tag system | name |
| mentions | User mentions in posts | post_id, mentioned_user_id |
| bookmarks | Saved posts | user_id, post_id |
| moderation_actions | Admin audit trail | admin_id, action_type, target_type, target_id, reason |
| admin_logs | Admin activity log | admin_id, action, ip_address, metadata(JSON) |
| admins | Admin roles | user_id, role(super_admin/moderator) |

---

## 🔔 Notification (Ripple) Types

| type | Trigger | sender_id | data fields |
|------|---------|-----------|-------------|
| reaction | User reacts to a post | reactor_id | reaction_type, post_id |
| comment | User comments on post | commenter_id | post_id |
| mention | User @mentioned in post | poster_id | post_id |
| follow | New follower | follower_id | — |
| repost | Post reposted | reposter_id | post_id, original_post_id |
| group_deleted | Admin deletes school | null | group_name, reason, admin_name, deleted_at |

---

## 🧭 Key Controllers & What They Do

| Controller | Responsibilities |
|-----------|-----------------|
| PostController | CRUD posts, feed (Deep Flow), hashtags, mentions |
| ReactionController | Toggle reactions (wave/fire/haha/sad/wow), ripple notifications |
| CommentController | CRUD comments on posts |
| RippleController | Notification polling, unread count, mark read, snooze |
| AdminController | Dashboard stats, user/group management, moderation, roles, logs |
| SearchController | Explore page, global search, hashtag search |
| SchoolController | School CRUD, membership, posts, events |
| EventController | Event CRUD, RSVP, global events page |
| UserProfileController | Profile view, block/unblock, friend/follow |
| MessagingController | Conversations, messages, real-time polling |

---

## 🌐 API Routes (Notification System)

| Method | URI | Purpose |
|--------|-----|---------|
| GET | /api/ripples/latest | Recent new ripples (for toasts) |
| GET | /api/ripples/unread-count | Unread badge count (polled every 3s) |
| POST | /api/ripples/mark-all-read | Mark all as read |
| POST | /api/ripples/{ripple}/mark-read | Mark single as read |
| POST | /api/ripples/snooze | Snooze notifications |
| POST | /api/ripples/unsnooze | Resume notifications |

---

## 🎣 Key Frontend Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| useNotifications | Hooks/useNotifications.js | Polls unread count (3s), fetches new ripples for toasts |

---

## 📐 Component Architecture

```
resources/js/
├── Components/
│   ├── CreatePostModal.jsx       ← Main post creation modal (with poll, CW, media)
│   ├── QuickPostCard.jsx         ← Inline post composer on Dashboard
│   ├── FloatingActionButton.jsx  ← FAB → opens CreatePostModal
│   ├── UI/
│   │   ├── Cards/     → PostCard.jsx, UserCard.jsx
│   │   ├── Panels/    → ReefPanel.jsx
│   │   ├── Navigation/ → TopNav.jsx, NavDrawer.jsx
│   │   └── Misc/      → Feed.jsx
│   ├── Features/
│   │   ├── Posts/      → PostActions.jsx, CreatePostModal.jsx (simpler version)
│   │   ├── Comments/   → CommentsSection.jsx, CommentItem.jsx
│   │   ├── Notifications/ → NotificationPanel.jsx
│   │   ├── Social/     → FriendRequestButton.jsx, FollowButton.jsx
│   │   └── Messaging/  → MessagePanel.jsx, ShareModal.jsx
│   └── Admin/
│       ├── UI/         → Sidebar.jsx, Topbar.jsx, Modal.jsx, StatusBadge.jsx
│       └── Features/   → DataTable.jsx, BarChart.jsx
├── Hooks/
│   └── useNotifications.js  ← Real-time polling hook
├── Pages/
│   ├── Dashboard.jsx, Ripples.jsx, Explore.jsx
│   ├── Admin/ → Users.jsx, Groups.jsx, Dashboard.jsx, etc.
│   └── Auth/  → Login.jsx, Register.jsx
└── Layouts/
    ├── MainLayout.jsx    ← User-facing layout (TopNav + sidebar)
    └── AdminLayout.jsx   ← Admin panel layout (adm-* CSS)
```

---

## 🛡️ Block System Summary

- **Mutual & Silent**: Both parties cannot see each other anywhere
- **48h cooldown** after unblocking before re-blocking
- **allBlockedIds** = blockedByMe ∪ blockedMe — applied to ALL queries
- Blocked user is NEVER notified
- Profile shows restricted view, search returns nothing

---

## 🔑 Admin System

- **Roles**: super_admin, moderator (stored in `admins` table)
- **Every admin POST** creates both `ModerationAction` + `AdminLog`
- **Admin CSS** uses `adm-*` namespace in `resources/css/admin.css`
- **Admin pages** do NOT use Tailwind — pure custom CSS only
- **User management**: Create user, change roles, suspend/ban/activate
- **Group management**: Delete with reason → notifies all members via Ripple

---

## 📝 Recent Changes Log

| Date | Change |
|------|--------|
| 2026-04-02 | Fixed like/reaction bug (response field mismatch: `liked`→`reacted`, `count`→`reaction_counts.total`) |
| 2026-04-02 | Added notification polling: useNotifications hook, /api/ripples/unread-count |
| 2026-04-02 | Admin group deletion now notifies all members via Ripple |
| 2026-04-02 | Admin user management: create user, change roles |
| 2026-04-02 | NotificationPanel shows ripple activity (likes, comments), clickable to profile/post |
| 2026-04-02 | Removed "View all notifications" footer from NotificationPanel |

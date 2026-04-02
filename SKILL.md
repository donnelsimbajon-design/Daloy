---
name: daloy-2.0
description: >
  Master skill for Daloy 2.0 — an ocean-themed social media platform built with Laravel 12,
  Inertia.js, and React. Use this skill whenever the user asks to build, modify, design, prompt,
  or plan anything related to Daloy 2.0. Triggers on: "Daloy", "add a feature", "create a prompt",
  "build a page", "fix a component", "admin panel", "voyager", "school", "ripple", "deep flow",
  or any reference to the platform's features. ALWAYS use this skill before writing any code,
  prompt, or plan for Daloy 2.0.
---

# 🌊 Daloy 2.0 — Master Skill

Daloy (Tagalog for "Flow") is a full-stack ocean-themed social networking platform
built on Laravel 12 with an Inertia.js + React frontend.

Always read MEMORY.md and RULES.md before generating any code, prompt, or plan.

---

## 📋 Skill Structure

This skill has three files. Read them in this order:

| File | Purpose | Read When |
|------|---------|-----------|
| `SKILL.md` | Entry point + process guide | Always first |
| `MEMORY.md` | Full system knowledge | Before writing any code or prompt |
| `RULES.md` | Design + dev rules | Before writing any code or prompt |

---

## ⚙️ PROCESS — How to Build Features

When asked to build any new feature, always follow this exact process:

### Step 1 — Read Memory
Open and read `MEMORY.md`. Identify which existing models, controllers,
components, and routes are relevant to the feature being built.

### Step 2 — Check Rules
Open and read `RULES.md`. Confirm the feature does not violate any rule.
Especially check: color palette, block system, admin logging, privacy filters.

### Step 3 — Plan Before Coding
Before writing any code, plan:
1. **Database** — What new migrations/tables are needed?
2. **Models** — What new models and relationships are needed?
3. **Controllers** — Which existing controllers need updating? Any new ones?
4. **Routes** — What new routes are needed (web.php or api.php)?
5. **Frontend** — Which pages/components need updating? Any new ones?
6. **Ripples** — Does this feature send notifications? What type?
7. **Admin** — Does this feature need an admin panel section?

### Step 4 — Generate Code in This Order
Always generate in this exact sequence to avoid dependency errors:
1. Migration files
2. Model files (with relationships)
3. Controller methods
4. Route additions (web.php / api.php)
5. Frontend pages / components
6. CSS additions (user: existing variables only | admin: adm-* namespace only)

### Step 5 — Verify Checklist
After generating, verify every item:
- [ ] Color palette unchanged — only existing CSS variables used
- [ ] Block system applied in all feed/profile/messaging queries
- [ ] Admin actions logged via AdminLog + ModerationAction
- [ ] Privacy filters applied (public/followers/private)
- [ ] Existing components reused where possible
- [ ] Ocean terminology used consistently
- [ ] SoftDeletes used on posts — never hard delete
- [ ] No incompatible libraries introduced

---

## 📝 PROCESS — How to Generate Prompts

When asked to generate a prompt for any Daloy 2.0 feature, always include all 8 sections:

### Required Prompt Sections

**1. System Context**
Start with: "You are a senior Laravel + React developer working on Daloy 2.0 —
an ocean-themed social media platform built with Laravel 12, Inertia.js, and React."
Then list all relevant existing tables, models, controllers, and frontend files.

**2. Feature Breakdown**
List every sub-feature with clear, specific technical requirements.
Use numbered lists. Be explicit about what to build.

**3. Database Section**
Provide exact migration schema:
```
table_name: column_name (type nullable/required), ...
```

**4. Controller Section**
Specify: method name, validation rules, logic steps, what it returns.

**5. Routes Section**
Specify: HTTP method, URI, controller@method, purpose.

**6. Frontend Section**
Specify: page/component name, props received, state variables,
functions, UI sections to build.

**7. Design Rule — ALWAYS END WITH THIS**
"Match the existing ocean glassmorphism design — use existing CSS variables,
Tailwind utility classes, and the same component patterns already in the system.
DO NOT change the color palette under any circumstances."

**8. Block System Reminder — IF FEATURE TOUCHES FEEDS/PROFILES/MESSAGING**
"All queries must apply: allBlockedIds = blockedByMe ∪ blockedMe.
Blocked users must be completely invisible on both sides."

---

## 🗂️ Component Folder Structure

```
resources/js/Components/
├── UI/
│   ├── Cards/         → PostCard.jsx, UserCard.jsx, StatCard.jsx
│   ├── Buttons/       → FollowButton.jsx, FriendRequestButton.jsx, FloatingActionButton.jsx
│   ├── Panels/        → ReefPanel.jsx, NotificationPanel.jsx, MessagePanel.jsx
│   ├── Navigation/    → TopNav.jsx, NavDrawer.jsx, LanguageSelector.jsx
│   ├── Modals/        → CreatePostModal.jsx, ShareModal.jsx, Modal.jsx
│   ├── Badges/        → StatusBadge.jsx
│   └── Misc/          → Feed.jsx
├── Features/
│   ├── Posts/         → PostActions.jsx, CreatePostModal.jsx
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

## 🚦 Quick Route Reference

### User Routes
| Method | URI | Purpose |
|--------|-----|---------|
| GET | `/` | Dashboard / Deep Flow feed |
| GET | `/explore` | Explore / Discovery |
| GET | `/ripples` | Notifications |
| GET | `/conversations` | Messaging |
| GET | `/schools` | Schools list |
| GET | `/events` | Events list |
| GET | `/voyagers` | All users |
| GET | `/users/{user}` | User profile |
| POST | `/users/{user}/block` | Block user |
| DELETE | `/users/{user}/unblock` | Unblock user |
| POST | `/posts` | Create post |
| PUT | `/posts/{post}` | Edit post |
| DELETE | `/posts/{post}` | Delete post (soft) |
| POST | `/posts/{post}/like` | Toggle like |
| GET | `/stories` | View stories |
| POST | `/stories` | Create story |

### API Routes
| Method | URI | Purpose |
|--------|-----|---------|
| GET | `/api/user` | Current user |
| POST | `/api/friend-request/send` | Send friend request |
| POST | `/api/friend-request/accept` | Accept request |
| POST | `/api/follow` | Follow user |
| DELETE | `/api/unfollow` | Unfollow user |
| POST | `/api/conversations/start` | Start conversation |
| POST | `/api/messages/send` | Send message |
| GET | `/api/messages/{conversation}` | Fetch messages |
| GET | `/api/search` | Global search |

### Admin Routes
| Method | URI | Purpose |
|--------|-----|---------|
| GET | `/admin/dashboard` | Dashboard stats |
| GET | `/admin/users` | User management |
| GET | `/admin/moderation` | Content moderation |
| GET | `/admin/reports` | Reports queue |
| GET | `/admin/groups` | Group management |
| GET | `/admin/messages` | Reported messages |
| GET | `/admin/analytics` | Analytics |
| GET | `/admin/settings` | System settings |
| GET | `/admin/logs` | Audit logs |

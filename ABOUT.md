# Daloy 2.0 - System Overview & Functional Guide

## 🌊 What is Daloy?
**Daloy** (Tagalog for "Flow") is a comprehensive social networking ecosystem built with **Laravel 11**, **Inertia.js**, and **React**. It is designed as a "fluid" platform for **Voyagers** (users) to share content, join **Schools** (communities), engage in **Deep Flow** (the main feed), and track interactions through **Ripples** (notifications).

---

## 🛠️ Step-by-Step Functional Guide

### 1. **Authentication & Identity (Voyagers)**
- **Step 1: Registration**: New users sign up with a unique email and name.
- **Step 2: Profile Customization**: Users can upload a profile picture and a background banner (`UserProfileController`).
- **Step 3: Account Security**: Support for password resets and secure logins with throttled attempts.

### 2. **Deep Flow (Main Feed & Content)**
- **Step 1: Content Input**: Users create posts via the `CreatePostModal` supporting text and media (images/videos).
- **Step 2: Processing**: The `PostController` validates input and stores it in the `posts` table.
- **Step 3: Real-time Feed**: Posts are served to the dashboard, filtered by visibility (Public/Friends).
- **Step 4: Persistence**: Users can edit or delete their posts, and those actions are immediately synced.

### 3. **StoryRail (Ephemeral Content)**
- **Step 1: Toggle Mode**: Users choose between "Photo Story" or "Text Story".
- **Step 2: Customization**: Users can add captions and choose visibility (Public/Friends/Private).
- **Step 3: Life Cycle**: Stories are listed in the `StoryRail` component and automatically expire/filter based on their 24-hour nature.
- **Step 4: Viewing experience**: Smooth, full-screen portal views with progress bars and navigation.

### 4. **Connections (Voyagers & Connections)**
- **Step 1: Search & Discover**: Users find other Voyagers in the **Explore** or **Voyagers** modules.
- **Step 2: Friendship Request**: Sending a friend request via `FriendRequestController`. 
- **Step 3: Following**: Users can follow others to see their content in the feed without a formal friend request.
- **Step 4: Mutual Connections**: Once a friend request is accepted, both users become friends (stored in the `friends` table).

### 5. **Interactions & Ripples (Engagement)**
- **Step 1: Reaction**: A user likes a post, triggering `ReactionController`.
- **Step 2: Comments**: Users participate in threads under posts.
- **Step 3: Sharing**: Users can share posts directly to other Voyagers or copy the link via `ShareModal`.
- **Step 4: The Ripple**: Every like, comment, or share triggers a **Ripple** (Notification) which appears in the recipient's `NotificationPanel`.

### 6. **Conversations (Private Messaging)**
- **Step 1: Inbox Access**: Navigating to **Conversations** shows a list of message threads.
- **Step 2: Searching Participants**: Using `ShareController` to find friends to start a new chat.
- **Step 3: Real-time Messaging**: Writing messages handled by `MessagingController`.
- **Step 4: Data Flow**: Messages are stored in `messages` and linked to `conversations`.

### 7. **Schools & Community Events**
- **Step 1: Group Discovery**: Users browse **Schools** to join niche communities.
- **Step 2: Event Planning**: Authorized users create **Events** (live sessions, meetups).
- **Step 3: RSVP**: Voyagers can "JOIN" or "INTERESTED" in an event, which tracks attendance in `event_rsvps`.
- **Step 4: Tracking**: Events show time, location, and attendee counts.

### 8. **Settings & Preferences**
- **Step 1: Privacy Controls**: Toggle visibility for stories and profile details.
- **Step 2: Theme & Accessibility**: Switch between Dark/Light modes (persisted to the `users` table).
- **Step 3: Language Selection**: Instantly change the UI language via `LanguageSelector` and `LanguageContext`.
- **Step 4: Notifications**: Manage which types of **Ripples** should alert the user.

---

## 🔄 Core System Flow (Data Lifecycle)

1.  **Input (User Action)**: Voyager enters data (Post, Story, Message, RSVP).
2.  **Processing (Logic)**: 
    - The request reaches a defined **Route** in `web.php`.
    - The **Controller** validates the request and processes media (if any).
    - The **Model** (Post, Story, Ripple, etc.) interacts with the MySQL database.
3.  **Persistence**: The state is updated in the database tables.
4.  **Output (UI Update)**: 
    - **Inertia.js** sends the updated data back to the React component without a page reload.
    - The **UI Components** (PostCard, StoryRail, NotificationPanel) re-render to reflect the new state.
    - If another user is online, they receive the **Ripple** notification.

---

## 🎨 Design Philosophy
- **Aesthetic**: Ocean-inspired glassmorphism with bioluminescent accents.
- **Technology**: Tailwind CSS v4, Framer Motion (for fluid transitions), and Inertia-React bridge.
- **UX**: "Smooth Waters" — Minimal page refreshes, intuitive navigation, and high responsiveness.

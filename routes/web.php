<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CloseFriendController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\HashtagController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\RippleController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SuggestionController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\VoyagerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root Route — Smart landing (no middleware)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard'); // → /app
    }
    return Inertia::render('Landing');
})->name('landing');

/*
|--------------------------------------------------------------------------
| Guest Routes (unauthenticated)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:5,1');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.update');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    // Banned Page
    Route::get('/banned', [\App\Http\Controllers\BannedController::class, 'show'])->name('banned');
    Route::get('/banned/appeal', [\App\Http\Controllers\BannedController::class, 'appeal'])->name('banned.appeal');
    Route::post('/banned/appeal', [\App\Http\Controllers\BannedController::class, 'submitAppeal'])->name('banned.appeal.submit');

    // Auth dashboard (named 'dashboard' so redirects from login work)
    Route::get('/app', [PostController::class, 'index'])->name('dashboard');
    Route::get('/home', [PostController::class, 'index']);

    // Navigation Pages
    Route::get('/explore', [SearchController::class, 'explore'])->name('explore');
    Route::get('/events', [EventController::class, 'globalIndex'])->name('events.global');
    Route::get('/river-flow', function () { return Inertia::render('RiverFlow'); });
    Route::get('/ripples', [RippleController::class, 'index'])->name('ripples');
    Route::get('/conversations/{id?}', function () { return Inertia::render('Conversations'); });

    // ── Saved Posts / Bookmarks ──────────────────────────────────
    Route::get('/saved', [BookmarkController::class, 'index'])->name('saved');
    Route::post('/posts/{post}/bookmark', [BookmarkController::class, 'toggle'])->name('posts.bookmark');

    // ── Hashtag Explore ──────────────────────────────────────────
    Route::get('/hashtag/{hashtag}', [HashtagController::class, 'show'])->name('hashtag.show');

    // Schools / Groups
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
    Route::get('/schools/create', function () { return Inertia::render('SchoolCreate'); })->name('schools.create');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
    Route::get('/schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
    Route::post('/schools/{school}/toggle-membership', [SchoolController::class, 'toggleMembership'])->name('schools.toggle');
    Route::post('/schools/{school}/posts', [SchoolController::class, 'storePost'])->name('schools.posts.store');
    Route::post('/schools/{school}/cover-image', [SchoolController::class, 'updateCoverImage'])->name('schools.cover');
    Route::post('/schools/{school}/profile-image', [SchoolController::class, 'updateProfileImage'])->name('schools.profile');
    Route::put('/schools/{school}/details', [SchoolController::class, 'updateDetails'])->name('schools.details');
    // School Upgrades (Prompt 7)
    Route::put('/schools/{school}/rules', [SchoolController::class, 'updateRules'])->name('schools.rules');
    Route::post('/schools/{school}/invite-token', [SchoolController::class, 'generateInviteToken'])->name('schools.invite.generate');
    Route::delete('/schools/{school}/invite-token', [SchoolController::class, 'revokeInviteToken'])->name('schools.invite.revoke');
    Route::get('/schools/{school}/leaderboard', [SchoolController::class, 'leaderboard'])->name('schools.leaderboard');
    Route::put('/schools/{school}/members/{user}/role', [SchoolController::class, 'changeMemberRole'])->name('schools.members.role');
    Route::delete('/schools/{school}/members/{user}', [SchoolController::class, 'removeMember'])->name('schools.members.remove');

    // ── School Currents (Audio Events) ──────────────────────────
    Route::post('/schools/{school}/currents/start', [\App\Http\Controllers\SchoolCallController::class, 'start'])->name('schools.currents.start');
    Route::get('/schools/{school}/currents/join', [\App\Http\Controllers\SchoolCallController::class, 'join'])->name('schools.currents.join');
    Route::post('/schools/{school}/currents/leave', [\App\Http\Controllers\SchoolCallController::class, 'leave'])->name('schools.currents.leave');
    Route::get('/schools/{school}/currents/live-state', [\App\Http\Controllers\SchoolCallController::class, 'liveState'])->name('schools.currents.live-state');
    Route::post('/schools/{school}/currents/vote', [\App\Http\Controllers\SchoolCallController::class, 'vote'])->name('schools.currents.vote');
    Route::post('/schools/{school}/currents/end', [\App\Http\Controllers\SchoolCallController::class, 'end'])->name('schools.currents.end');
    Route::post('/schools/{school}/currents/add-track', [\App\Http\Controllers\SchoolCallController::class, 'addTrack'])->name('schools.currents.add-track');
    Route::post('/schools/{school}/currents/play-next', [\App\Http\Controllers\SchoolCallController::class, 'playNext'])->name('schools.currents.play-next');
    Route::post('/schools/{school}/currents/save-track', [\App\Http\Controllers\SchoolCallController::class, 'saveTrack'])->name('schools.currents.save-track');
    Route::post('/schools/{school}/currents/chat', [\App\Http\Controllers\SchoolCallController::class, 'sendMessage'])->name('schools.currents.chat');

    // ── Join via invite link ─────────────────────────────────────
    Route::get('/join/{token}', [SchoolController::class, 'joinViaToken'])->name('schools.join');

    // Events (inside Groups)
    Route::get('/schools/{school}/events', [EventController::class, 'index'])->name('schools.events');
    Route::post('/schools/{school}/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
    Route::post('/events/{event}/rsvp', [EventController::class, 'rsvp'])->name('events.rsvp');
    Route::delete('/events/{event}/rsvp', [EventController::class, 'cancelRsvp'])->name('events.rsvp.cancel');
    Route::post('/events/{event}/posts', [EventController::class, 'storePost'])->name('events.posts.store');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    // Event Check-in (Prompt 7)
    Route::post('/events/{event}/checkin', [EventController::class, 'checkin'])->name('events.checkin');

    // Voyagers / Friends
    Route::get('/voyagers', [VoyagerController::class, 'index'])->name('voyagers.index');

    // User Profile
    Route::get('/users/{user}', [UserProfileController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/block', [UserProfileController::class, 'block'])->name('users.block');
    Route::delete('/users/{user}/unblock', [UserProfileController::class, 'unblock'])->name('users.unblock');
    // Restrict/Unrestrict (Prompt 4)
    Route::post('/users/{user}/restrict', [UserProfileController::class, 'restrict'])->name('users.restrict');
    Route::delete('/users/{user}/unrestrict', [UserProfileController::class, 'unrestrict'])->name('users.unrestrict');

    // Settings
    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings');
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::post('/settings/profile-picture', [SettingsController::class, 'updateProfilePicture'])->name('settings.profile-picture');
    Route::post('/settings/background-picture', [SettingsController::class, 'updateBackgroundPicture'])->name('settings.background-picture');
    Route::put('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password');
    Route::patch('/settings/privacy', [SettingsController::class, 'updatePrivacy'])->name('settings.privacy');
    Route::patch('/settings/notifications', [SettingsController::class, 'updateNotifications'])->name('settings.notifications');
    Route::patch('/settings/accessibility', [SettingsController::class, 'updateAccessibility'])->name('settings.accessibility');
    Route::delete('/settings/unblock/{userId}', [SettingsController::class, 'unblockUser'])->name('settings.unblock');
    Route::delete('/settings/account', [SettingsController::class, 'destroy'])->name('settings.destroy');
    // New Settings routes
    Route::post('/settings/interests', [SettingsController::class, 'updateInterests'])->name('settings.interests');
    Route::patch('/settings/accent', [SettingsController::class, 'updateAccent'])->name('settings.accent');
    Route::post('/settings/featured-post', [SettingsController::class, 'updateFeaturedPost'])->name('settings.featured-post');
    Route::post('/settings/muted-keywords', [SettingsController::class, 'addMutedKeyword'])->name('settings.muted-keywords.add');
    Route::delete('/settings/muted-keywords/{keyword}', [SettingsController::class, 'removeMutedKeyword'])->name('settings.muted-keywords.remove');
    Route::get('/settings/login-activity', [SettingsController::class, 'loginActivity'])->name('settings.login-activity');
    Route::post('/settings/logout-other-sessions', [SettingsController::class, 'logoutOtherSessions'])->name('settings.logout-other-sessions');

    // Stories
    Route::get('/stories', [\App\Http\Controllers\StoryController::class, 'index'])->name('stories.index');
    Route::post('/stories', [\App\Http\Controllers\StoryController::class, 'store'])->name('stories.store');
    Route::post('/stories/{story}/view', [\App\Http\Controllers\StoryController::class, 'recordView'])->name('stories.view');
    Route::get('/stories/{story}/viewers', [\App\Http\Controllers\StoryController::class, 'viewers'])->name('stories.viewers');
    Route::post('/stories/{story}/react', [\App\Http\Controllers\StoryController::class, 'react'])->name('stories.react');
    Route::post('/stories/{story}/reply', [\App\Http\Controllers\StoryController::class, 'reply'])->name('stories.reply');
    Route::get('/stories/{story}/live-state', [\App\Http\Controllers\StoryController::class, 'liveState'])->name('stories.live-state');
    Route::delete('/stories/{story}', [\App\Http\Controllers\StoryController::class, 'destroy'])->name('stories.destroy');
    Route::post('/stories/{story}/archive', [\App\Http\Controllers\StoryController::class, 'archive'])->name('stories.archive');
    Route::post('/stories/{story}/unarchive', [\App\Http\Controllers\StoryController::class, 'unarchive'])->name('stories.unarchive');
    Route::get('/api/stories/archived', [\App\Http\Controllers\StoryController::class, 'archived'])->name('stories.archived');

    // Posts
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/pin', [PostController::class, 'pin'])->name('posts.pin');

    // Reactions (updated for multi-type)
    Route::post('/posts/{post}/react', [ReactionController::class, 'toggle'])->name('posts.react');
    Route::post('/posts/{post}/like', [ReactionController::class, 'toggle'])->name('posts.like'); // Legacy compat

    // Polls
    Route::post('/polls/{poll}/vote', [PollController::class, 'vote'])->name('polls.vote');

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index'])->name('posts.comments.index');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('posts.comments.store');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Share / Messaging
    Route::get('/share/search-users', [App\Http\Controllers\ShareController::class, 'searchUsers']);
    Route::post('/share/send', [App\Http\Controllers\ShareController::class, 'sendToUser']);

    // ── API-style JSON routes ────────────────────────────────────

    // Messaging Upgrades (Prompt 5)
    Route::get('/api/conversations', [MessagingController::class, 'index'])->name('api.conversations');
    Route::post('/api/conversations/start', [MessagingController::class, 'start'])->name('api.conversations.start');
    Route::post('/api/conversations/send', [MessagingController::class, 'sendMessage'])->name('api.conversations.send');
    Route::get('/api/conversations/{conversation}/messages', [MessagingController::class, 'messages'])->name('api.conversations.messages');
    Route::post('/api/conversations/{conversation}/call', [App\Http\Controllers\MessagingCallController::class, 'startCall'])->name('api.conversations.call');
    Route::get('/api/calls/incoming', [App\Http\Controllers\MessagingCallController::class, 'checkIncoming'])->name('api.calls.incoming');
    Route::get('/api/calls/status', [App\Http\Controllers\MessagingCallController::class, 'checkStatus'])->name('api.calls.status');
    Route::post('/api/calls/action', [App\Http\Controllers\MessagingCallController::class, 'action'])->name('api.calls.action');
    Route::post('/api/messages/{message}/react', [MessagingController::class, 'reactToMessage'])->name('api.messages.react');
    Route::delete('/api/messages/{message}', [MessagingController::class, 'deleteMessage'])->name('api.messages.delete');
    Route::post('/api/conversations/{conversation}/typing', [MessagingController::class, 'typing'])->name('api.conversations.typing');
    Route::get('/api/conversations/{conversation}/typing', [MessagingController::class, 'getTyping'])->name('api.conversations.typing.get');
    Route::post('/api/conversations/group', [MessagingController::class, 'createGroup'])->name('api.conversations.group');
    Route::post('/api/conversations/{conversation}/members', [MessagingController::class, 'addMember'])->name('api.conversations.members.add');
    Route::delete('/api/conversations/{conversation}/members/{user}', [MessagingController::class, 'removeMember'])->name('api.conversations.members.remove');
    // ── Group Messaging ──────────────────────────────────────────
    Route::post('/api/conversations/{conversation}/leave', [MessagingController::class, 'leaveGroup'])->name('api.conversations.leave');
    Route::post('/api/conversations/{conversation}/disband', [MessagingController::class, 'disbandGroup'])->name('api.conversations.disband');
    Route::post('/api/conversations/{conversation}/kick', [MessagingController::class, 'kickMember'])->name('api.conversations.kick');
    Route::post('/api/conversations/{conversation}/invite', [MessagingController::class, 'inviteMember'])->name('api.conversations.invite');
    Route::patch('/api/conversations/{conversation}/name', [MessagingController::class, 'updateGroupName'])->name('api.conversations.name');
    Route::get('/api/conversations/{conversation}/search', [MessagingController::class, 'searchMessages'])->name('api.conversations.search');
    Route::post('/api/conversations/{conversation}/report', [MessagingController::class, 'reportConversation'])->name('api.conversations.report');

    // Group Call System
    Route::post('/api/group-calls/{conversation}/start', [App\Http\Controllers\GroupCallController::class, 'startGroupCall'])->name('api.group-calls.start');
    Route::post('/api/group-calls/{conversation}/join', [App\Http\Controllers\GroupCallController::class, 'joinGroupCall'])->name('api.group-calls.join');
    Route::post('/api/group-calls/{conversation}/leave', [App\Http\Controllers\GroupCallController::class, 'leaveGroupCall'])->name('api.group-calls.leave');
    Route::post('/api/group-calls/{conversation}/end', [App\Http\Controllers\GroupCallController::class, 'endGroupCall'])->name('api.group-calls.end');
    Route::post('/api/group-calls/{conversation}/mute/{user}', [App\Http\Controllers\GroupCallController::class, 'muteParticipant'])->name('api.group-calls.mute');
    Route::get('/api/group-calls/{conversation}/active', [App\Http\Controllers\GroupCallController::class, 'getActiveCall'])->name('api.group-calls.active');
    Route::post('/api/group-calls/{conversation}/chat', [App\Http\Controllers\GroupCallController::class, 'sendCallChat'])->name('api.group-calls.chat');
    Route::get('/api/group-calls/{conversation}/chat', [App\Http\Controllers\GroupCallController::class, 'getCallChat'])->name('api.group-calls.chat.get');
    Route::get('/api/group-calls/{conversation}/mute-status', [App\Http\Controllers\GroupCallController::class, 'getMuteStatus'])->name('api.group-calls.mute-status');

    // Ripple / Notification routes (Prompt 6)
    Route::get('/api/ripples/latest', [RippleController::class, 'latest'])->name('api.ripples.latest');
    Route::get('/api/ripples/unread-count', [RippleController::class, 'unreadCount'])->name('api.ripples.unread-count');
    Route::post('/api/ripples/mark-all-read', [RippleController::class, 'markAllRead'])->name('api.ripples.mark-all-read');
    Route::post('/api/ripples/{ripple}/mark-read', [RippleController::class, 'markRead'])->name('api.ripples.mark-read');
    Route::post('/api/ripples/snooze', [RippleController::class, 'snooze'])->name('api.ripples.snooze');
    Route::post('/api/ripples/unsnooze', [RippleController::class, 'unsnooze'])->name('api.ripples.unsnooze');

    // Live Announcements Poller
    Route::get('/api/announcements/live', [\App\Http\Controllers\AnnouncementInteractionController::class, 'live'])->name('api.announcements.live');
    Route::post('/api/announcements/{announcement}/interact', [\App\Http\Controllers\AnnouncementInteractionController::class, 'interact'])->name('api.announcements.interact');

    // Close Friends (Prompt 2)
    Route::get('/api/close-friends', [CloseFriendController::class, 'index'])->name('api.close-friends');
    Route::post('/api/close-friends/add', [CloseFriendController::class, 'add'])->name('api.close-friends.add');
    Route::delete('/api/close-friends/remove', [CloseFriendController::class, 'remove'])->name('api.close-friends.remove');

    // Suggestions (Prompt 2)
    Route::get('/api/suggestions', [SuggestionController::class, 'index'])->name('api.suggestions');

    // Search & Discovery (Prompt 8)
    Route::get('/api/search', [SearchController::class, 'search'])->name('api.search');
    Route::get('/api/trending/hashtags', [SearchController::class, 'trendingHashtags'])->name('api.trending.hashtags');
    Route::get('/api/trending/posts', [SearchController::class, 'trendingPosts'])->name('api.trending.posts');
    Route::get('/api/nearby-users', [SearchController::class, 'nearbyUsers'])->name('api.nearby-users');
    Route::get('/api/recommended-schools', [SearchController::class, 'recommendedSchools'])->name('api.recommended-schools');
    Route::get('/api/mention-search', [SearchController::class, 'mentionSearch'])->name('api.mention-search');
    Route::get('/api/search-history', [SearchController::class, 'searchHistory'])->name('api.search-history');
    Route::delete('/api/search-history/{id}', [SearchController::class, 'deleteSearchHistory'])->name('api.search-history.delete');
    Route::delete('/api/search-history', [SearchController::class, 'clearSearchHistory'])->name('api.search-history.clear');
    Route::get('/api/collections', [SearchController::class, 'collections'])->name('api.collections');
    Route::get('/api/collections/{collection}', [SearchController::class, 'collectionPosts'])->name('api.collections.posts');

    // Interest Tags (Prompt 2)
    Route::get('/api/interest-tags', function () {
        return response()->json(\App\Models\InterestTag::all());
    })->name('api.interest-tags');

    // My Reports (Prompt 4)
    Route::get('/settings/my-reports', function () {
        $reports = auth()->user()->reports()
            ->with('reportable')
            ->orderByDesc('created_at')
            ->paginate(10);
        return response()->json($reports);
    })->name('settings.my-reports');

    Route::post('logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Admin Panel Routes
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ModerationController as AdminModerationController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\GroupController as AdminGroupController;
use App\Http\Controllers\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\LogController as AdminLogController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\LiveMonitorController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Admin\MonitoringController as AdminMonitoringController;

Route::get('/admin/login', [AdminAuthController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'store']);

Route::get('/moderator/login', [AdminAuthController::class, 'create'])->name('moderator.login');
Route::post('/moderator/login', [AdminAuthController::class, 'store']);

Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', function () { return redirect()->route('admin.dashboard'); });
    Route::post('/logout', [AdminAuthController::class, 'destroy'])->name('admin.logout');

    // Dashboard (all admins)
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');

    // Users
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users');
    Route::get('/users/{user}/content', [AdminUserController::class, 'showContent'])->name('admin.users.content');
    Route::post('/users/{user}/action', [AdminUserController::class, 'action'])->name('admin.users.action');
    Route::post('/users/store', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::patch('/users/{user}/role', [AdminUserController::class, 'changeRole'])->name('admin.users.role');

    // Moderation
    Route::get('/moderation', [AdminModerationController::class, 'index'])->name('admin.moderation');
    Route::post('/moderation/action', [AdminModerationController::class, 'action'])->name('admin.moderation.action');

    // Reports
    Route::get('/reports', [AdminReportController::class, 'index'])->name('admin.reports');
    Route::post('/reports/{report}/action', [AdminReportController::class, 'action'])->name('admin.reports.action');

    // Groups
    Route::get('/groups', [AdminGroupController::class, 'index'])->name('admin.groups');
    Route::post('/groups/{school}/action', [AdminGroupController::class, 'action'])->name('admin.groups.action');

    // Messages
    Route::get('/messages', [AdminMessageController::class, 'index'])->name('admin.messages');
    Route::post('/messages/{report}/action', [AdminMessageController::class, 'action'])->name('admin.messages.action');
    Route::get('/messages/conversations', [AdminMessageController::class, 'conversations'])->name('admin.messages.conversations');

    // Monitoring (Stories, Currents, Conversation Inspect, Call Logs)
    Route::get('/monitoring', [AdminMonitoringController::class, 'index'])->name('admin.monitoring');
    Route::post('/monitoring/stories/{id}/delete', [AdminMonitoringController::class, 'deleteStory'])->name('admin.monitoring.story.delete');
    Route::get('/monitoring/conversations', [AdminMonitoringController::class, 'conversations'])->name('admin.monitoring.conversations');
    Route::post('/monitoring/conversations/{id}/inspect', [AdminMonitoringController::class, 'inspectThread'])->name('admin.monitoring.inspect');
    Route::get('/monitoring/call-logs', [AdminMonitoringController::class, 'callLogs'])->name('admin.monitoring.calls');
    Route::post('/monitoring/calls/{id}/restrict', [AdminMonitoringController::class, 'restrictCaller'])->name('admin.monitoring.restrict');

    // Analytics
    Route::get('/analytics', AdminAnalyticsController::class)->name('admin.analytics');

    // Settings
    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('admin.settings');
    Route::post('/settings', [AdminSettingsController::class, 'update'])->name('admin.settings.update');

    // Logs
    Route::get('/logs', AdminLogController::class)->name('admin.logs');

    Route::get('/activity/export', [ActivityController::class, 'exportCsv'])->name('admin.activity.export');
    Route::get('/activity/{user}', [ActivityController::class, 'userActivity'])->name('admin.activity.user');
    Route::get('/activity', [ActivityController::class, 'index'])->name('admin.activity');

    Route::get('/live', [LiveMonitorController::class, 'index'])->name('admin.live');
    Route::get('/live/stats', [LiveMonitorController::class, 'stats'])->name('admin.live.stats');

    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('admin.announcements');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('admin.announcements.store');
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update'])->name('admin.announcements.update');
    Route::delete('/announcements/{id}/force', [AnnouncementController::class, 'forceDelete'])->name('admin.announcements.forceDelete');
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('admin.announcements.destroy');
    Route::post('/announcements/{announcement}/broadcast', [AnnouncementController::class, 'broadcast'])->name('admin.announcements.broadcast');
    Route::get('/announcements/{announcement}/stats', [AnnouncementController::class, 'stats'])->name('admin.announcements.stats');

    Route::get('/roles', [RolesController::class, 'index'])->name('admin.roles');
    Route::post('/roles', [RolesController::class, 'store'])->name('admin.roles.store');
    Route::delete('/roles/{role}', [RolesController::class, 'destroy'])->name('admin.roles.destroy');
    Route::post('/roles/promote', [RolesController::class, 'promoteUser'])->name('admin.roles.promote');
    Route::delete('/roles/admin/{admin}', [RolesController::class, 'removeAdmin'])->name('admin.roles.remove');
    Route::patch('/roles/admin/{admin}/role', [RolesController::class, 'changeRole'])->name('admin.roles.change');
    Route::get('/roles/users/search', [RolesController::class, 'searchUsers'])->name('admin.roles.search_users');
});

Route::prefix('moderator')->middleware(['auth', 'moderator'])->group(function () {
    Route::get('/', function () { return redirect()->route('moderator.dashboard'); });
    Route::post('/logout', [AdminAuthController::class, 'destroy'])->name('moderator.logout');

    Route::get('/dashboard', \App\Http\Controllers\Moderator\DashboardController::class)->name('moderator.dashboard');
    Route::get('/moderation', [\App\Http\Controllers\Moderator\ModerationController::class, 'index'])->name('moderator.moderation');
    Route::post('/moderation/action', [\App\Http\Controllers\Moderator\ModerationController::class, 'action'])->name('moderator.moderation.action');
    Route::get('/reports', [\App\Http\Controllers\Moderator\ReportController::class, 'index'])->name('moderator.reports');
    Route::post('/reports/{report}/action', [\App\Http\Controllers\Moderator\ReportController::class, 'action'])->name('moderator.reports.action');
    Route::get('/messages', [\App\Http\Controllers\Moderator\MessageController::class, 'index'])->name('moderator.messages');
    Route::post('/messages/{report}/action', [\App\Http\Controllers\Moderator\MessageController::class, 'action'])->name('moderator.messages.action');


});

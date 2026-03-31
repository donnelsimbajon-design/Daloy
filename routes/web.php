<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\VoyagerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    Route::get('/', [PostController::class, 'index'])->name('dashboard');

    Route::get('/app', [PostController::class, 'index']);

    // Navigation Pages
    Route::get('/explore', function () { return Inertia::render('Explore'); });
    Route::get('/events', [EventController::class, 'globalIndex'])->name('events.global');
    Route::get('/river-flow', function () { return Inertia::render('RiverFlow'); });
    Route::get('/ripples', function () { return Inertia::render('Ripples'); });
    Route::get('/conversations', function () { return Inertia::render('Conversations'); });

    // Schools / Groups (Dynamic)
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
    Route::get('/schools/create', function () { return Inertia::render('SchoolCreate'); })->name('schools.create');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
    Route::get('/schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
    Route::post('/schools/{school}/toggle-membership', [SchoolController::class, 'toggleMembership'])->name('schools.toggle');
    Route::post('/schools/{school}/posts', [SchoolController::class, 'storePost'])->name('schools.posts.store');
    Route::post('/schools/{school}/cover-image', [SchoolController::class, 'updateCoverImage'])->name('schools.cover');
    Route::post('/schools/{school}/profile-image', [SchoolController::class, 'updateProfileImage'])->name('schools.profile');
    Route::put('/schools/{school}/details', [SchoolController::class, 'updateDetails'])->name('schools.details');

    // Events (inside Groups)
    Route::get('/schools/{school}/events', [EventController::class, 'index'])->name('schools.events');
    Route::post('/schools/{school}/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
    Route::post('/events/{event}/rsvp', [EventController::class, 'rsvp'])->name('events.rsvp');
    Route::delete('/events/{event}/rsvp', [EventController::class, 'cancelRsvp'])->name('events.rsvp.cancel');
    Route::post('/events/{event}/posts', [EventController::class, 'storePost'])->name('events.posts.store');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

    // Voyagers / Friends (Dynamic)
    Route::get('/voyagers', [VoyagerController::class, 'index'])->name('voyagers.index');

    // User Profile
    Route::get('/users/{user}', [\App\Http\Controllers\UserProfileController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/block', [\App\Http\Controllers\UserProfileController::class, 'block'])->name('users.block');
    Route::delete('/users/{user}/unblock', [\App\Http\Controllers\UserProfileController::class, 'unblock'])->name('users.unblock');


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

    // Stories
    Route::get('/stories', [\App\Http\Controllers\StoryController::class, 'index'])->name('stories.index');
    Route::post('/stories', [\App\Http\Controllers\StoryController::class, 'store'])->name('stories.store');

    // Posts
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');

    // Likes (Reactions)
    Route::post('/posts/{post}/like', [ReactionController::class, 'toggle'])->name('posts.like');

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index'])->name('posts.comments.index');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('posts.comments.store');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Share / Messaging
    Route::get('/share/search-users', [App\Http\Controllers\ShareController::class, 'searchUsers']);
    Route::post('/share/send', [App\Http\Controllers\ShareController::class, 'sendToUser']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

/*
|--------------------------------------------------------------------------
| Admin Panel Routes
|--------------------------------------------------------------------------
| Admin login is accessible to guests. All dashboard routes are protected
| by auth + admin middleware (returns 404 for non-admin users).
*/
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\LiveMonitorController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\AnnouncementController;

// Admin login (no auth required)
Route::get('/admin/login', [AdminAuthController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'store']);

// Admin panel (requires auth + admin middleware)
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', function () { return redirect()->route('admin.dashboard'); });
    Route::post('/logout', [AdminAuthController::class, 'destroy'])->name('admin.logout');

    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

    // Users
    Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
    Route::post('/users/{user}/action', [AdminController::class, 'userAction'])->name('admin.users.action');

    // Moderation
    Route::get('/moderation', [AdminController::class, 'moderation'])->name('admin.moderation');
    Route::post('/moderation/action', [AdminController::class, 'moderateContent'])->name('admin.moderation.action');

    // Reports
    Route::get('/reports', [AdminController::class, 'reports'])->name('admin.reports');
    Route::post('/reports/{report}/action', [AdminController::class, 'reportAction'])->name('admin.reports.action');

    // Groups
    Route::get('/groups', [AdminController::class, 'groups'])->name('admin.groups');
    Route::post('/groups/{school}/action', [AdminController::class, 'groupAction'])->name('admin.groups.action');

    // Messages
    Route::get('/messages', [AdminController::class, 'messages'])->name('admin.messages');

    // Analytics
    Route::get('/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');

    // Settings
    Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    Route::post('/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');

    // Audit Logs
    Route::get('/logs', [AdminController::class, 'logs'])->name('admin.logs');

    // ── Voyager Activity Tracker ──────────────────────────────
    Route::get('/activity/export', [ActivityController::class, 'exportCsv'])->name('admin.activity.export');
    Route::get('/activity/{user}', [ActivityController::class, 'userActivity'])->name('admin.activity.user');
    Route::get('/activity', [ActivityController::class, 'index'])->name('admin.activity');

    // ── Live Monitor ─────────────────────────────────────────
    Route::get('/live', [LiveMonitorController::class, 'index'])->name('admin.live');
    Route::get('/live/stream', [LiveMonitorController::class, 'stream'])->name('admin.live.stream');
    Route::post('/live/maintenance', [LiveMonitorController::class, 'toggleMaintenance'])->name('admin.live.maintenance');
    Route::post('/live/clear-cache', [LiveMonitorController::class, 'clearCache'])->name('admin.live.cache');

    // ── Roles & Permissions ──────────────────────────────────
    Route::get('/roles', [RolesController::class, 'index'])->name('admin.roles');
    Route::post('/roles', [RolesController::class, 'store'])->name('admin.roles.store');
    Route::put('/roles/{role}', [RolesController::class, 'update'])->name('admin.roles.update');
    Route::delete('/roles/{role}', [RolesController::class, 'destroy'])->name('admin.roles.destroy');
    Route::post('/roles/{role}/permissions', [RolesController::class, 'updatePermissions'])->name('admin.roles.permissions');
    Route::post('/admins/{user}/promote', [RolesController::class, 'promoteUser'])->name('admin.admins.promote');
    Route::delete('/admins/{admin}/remove', [RolesController::class, 'removeAdmin'])->name('admin.admins.remove');
    Route::patch('/admins/{admin}/role', [RolesController::class, 'changeRole'])->name('admin.admins.role');

    // ── Announcements ────────────────────────────────────────
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('admin.announcements');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('admin.announcements.store');
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update'])->name('admin.announcements.update');
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('admin.announcements.destroy');
    Route::post('/announcements/{announcement}/broadcast', [AnnouncementController::class, 'broadcast'])->name('admin.announcements.broadcast');
    Route::get('/announcements/{announcement}/stats', [AnnouncementController::class, 'stats'])->name('admin.announcements.stats');
});


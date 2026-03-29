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
    Route::get('/events', function () { return Inertia::render('Events'); });
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

    // ─── Admin Panel Routes ───
    Route::prefix('admin')->group(function () {
        Route::get('/', function () { return redirect('/admin/dashboard'); });
        Route::get('/dashboard', function () { return Inertia::render('Admin/Dashboard'); })->name('admin.dashboard');
        Route::get('/users', function () { return Inertia::render('Admin/Users'); })->name('admin.users');
        Route::get('/moderation', function () { return Inertia::render('Admin/Moderation'); })->name('admin.moderation');
        Route::get('/reports', function () { return Inertia::render('Admin/Reports'); })->name('admin.reports');
        Route::get('/groups', function () { return Inertia::render('Admin/Groups'); })->name('admin.groups');
        Route::get('/messages', function () { return Inertia::render('Admin/Messages'); })->name('admin.messages');
        Route::get('/analytics', function () { return Inertia::render('Admin/Analytics'); })->name('admin.analytics');
        Route::get('/settings', function () { return Inertia::render('Admin/Settings'); })->name('admin.settings');
        Route::get('/logs', function () { return Inertia::render('Admin/Logs'); })->name('admin.logs');
    });
});

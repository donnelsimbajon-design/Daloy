<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\SettingsController;
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
    Route::get('/schools', function () { return Inertia::render('Schools'); });
    Route::get('/voyagers', function () { return Inertia::render('Voyagers'); });
    Route::get('/events', function () { return Inertia::render('Events'); });
    Route::get('/river-flow', function () { return Inertia::render('RiverFlow'); });
    Route::get('/ripples', function () { return Inertia::render('Ripples'); });
    Route::get('/conversations', function () { return Inertia::render('Conversations'); });

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

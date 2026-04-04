<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FriendRequestController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\SearchController;

Route::get('/user', function (Request $request) {
    return $request->user()->only([
        'id', 'name', 'username', 'email', 'profile_picture', 'bio', 'location', 'privacy_setting'
    ]);
})->middleware('auth');

Route::middleware('auth')->group(function () {
    // Friend Requests
    Route::get('/friend-requests/pending', function () {
        return response()->json(
            \App\Models\FriendRequest::where('receiver_id', auth()->id())
                ->where('status', 'pending')
                ->with('sender:id,name,username,profile_picture')
                ->latest()
                ->get()
        );
    });
    Route::post('/friend-request/send', [FriendRequestController::class, 'send']);
    Route::post('/friend-request/accept', [FriendRequestController::class, 'accept']);
    Route::post('/friend-request/reject', [FriendRequestController::class, 'reject']);
    Route::delete('/friend-request/cancel', [FriendRequestController::class, 'cancel']);
    
    // Friends
    Route::delete('/friend/remove', [FriendRequestController::class, 'removeFriend']);
    Route::get('/friends', [FriendRequestController::class, 'index']);

    // Follow
    Route::post('/follow', [FollowController::class, 'follow']);
    Route::delete('/unfollow', [FollowController::class, 'unfollow']);

    // Follow Requests
    Route::get('/follow-requests/pending', function () {
        return response()->json(
            \App\Models\FollowRequest::where('following_id', auth()->id())
                ->where('status', 'pending')
                ->with('follower:id,name,username,profile_picture')
                ->latest()
                ->get()
        );
    });
    Route::post('/follow-request/accept', [FollowController::class, 'acceptRequest']);
    Route::post('/follow-request/reject', [FollowController::class, 'rejectRequest']);

    // Messaging
    Route::get('/conversations', [MessagingController::class, 'index']);
    Route::post('/conversations/start', [MessagingController::class, 'start']);
    Route::post('/messages/send', [MessagingController::class, 'sendMessage']);
    Route::get('/messages/{conversation}', [MessagingController::class, 'messages']);
    Route::post('/messages/{message}/react', [MessagingController::class, 'reactToMessage']);
    Route::delete('/messages/{message}', [MessagingController::class, 'deleteMessage']);
    
    // Typing Indicators
    Route::post('/conversations/{conversation}/typing', [MessagingController::class, 'typing']);
    Route::get('/conversations/{conversation}/typing', [MessagingController::class, 'getTyping']);
    
    // Conversation Media & Search
    Route::get('/conversations/{conversation}/search', [MessagingController::class, 'searchMessages']);
    Route::get('/conversations/{conversation}/media', [MessagingController::class, 'getMedia']);
    
    // Groups
    Route::post('/conversations/group', [MessagingController::class, 'createGroup']);
    Route::post('/conversations/{conversation}/members', [MessagingController::class, 'addMember']);
    Route::delete('/conversations/{conversation}/members/{user}', [MessagingController::class, 'removeMember']);
    Route::put('/conversations/{conversation}/name', [MessagingController::class, 'updateGroupName']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);
});

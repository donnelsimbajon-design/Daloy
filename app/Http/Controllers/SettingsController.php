<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Default notification preferences
        $defaultNotifPrefs = [
            'push_likes' => true, 'push_comments' => true, 'push_follows' => true,
            'push_messages' => true, 'push_mentions' => true,
            'email_digest' => false, 'email_security' => true, 'email_updates' => false,
        ];

        $blockedUsers = $user->blockedUsers()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->withPivot('created_at')
            ->get();

        return Inertia::render('Settings', [
            'user' => array_merge(
                $user->only([
                    'id', 'name', 'username', 'email', 'bio', 'about', 'phone',
                    'location', 'profile_picture', 'background_picture', 'privacy_setting',
                    'font_size', 'reduce_motion', 'high_contrast', 'dark_mode',
                ]),
                [
                    'notification_preferences' => $user->notification_preferences ?? $defaultNotifPrefs,
                    'posts_count' => $user->posts()->count(),
                    'followers_count' => $user->followers()->count(),
                    'following_count' => $user->following()->count(),
                ]
            ),
            'blocked_users' => $blockedUsers,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|alpha_dash|unique:users,username,' . $request->user()->id,
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $request->user()->id,
            'bio' => 'nullable|string|max:500',
            'about' => 'nullable|string|max:2000',
            'phone' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',
        ]);

        $request->user()->fill($validated);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return back()->with('status', 'profile-updated');
    }

    public function updateProfilePicture(Request $request): RedirectResponse
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $user = $request->user();

        if ($user->profile_picture) {
            $oldPath = str_replace('/storage/', '', $user->profile_picture);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('profile_picture')->store('profile-pictures', 'public');
        $user->update(['profile_picture' => '/storage/' . $path]);

        return back()->with('status', 'profile-picture-updated');
    }

    public function updateBackgroundPicture(Request $request): RedirectResponse
    {
        $request->validate([
            'background_picture' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $user = $request->user();

        if ($user->background_picture) {
            $oldPath = str_replace('/storage/', '', $user->background_picture);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('background_picture')->store('background-pictures', 'public');
        $user->update(['background_picture' => '/storage/' . $path]);

        return back()->with('status', 'background-updated');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('status', 'password-updated');
    }

    public function updatePrivacy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'privacy_setting' => 'required|in:public,followers,private',
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'privacy-updated');
    }

    /**
     * Update notification preferences.
     */
    public function updateNotifications(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notification_preferences' => 'required|array',
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'notifications-updated');
    }

    /**
     * Update accessibility preferences.
     */
    public function updateAccessibility(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'font_size' => 'required|in:small,medium,large',
            'reduce_motion' => 'required|boolean',
            'high_contrast' => 'required|boolean',
            'dark_mode' => 'required|boolean',
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'accessibility-updated');
    }

    /**
     * Unblock a user.
     */
    public function unblockUser(Request $request, $userId): RedirectResponse
    {
        $request->user()->blockedUsers()->detach($userId);

        return back()->with('status', 'user-unblocked');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\InterestTag;
use App\Models\LoginActivity;
use App\Models\MutedKeyword;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $defaultNotifPrefs = [
            'push_likes' => true, 'push_comments' => true, 'push_follows' => true,
            'push_messages' => true, 'push_mentions' => true,
            'email_digest' => false, 'email_security' => true, 'email_updates' => false,
            'email_digest_frequency' => 'never',
        ];

        $blockedUsers = $user->blockedUsers()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->withPivot('created_at')
            ->get();

        $mutedKeywords = $user->mutedKeywords()->orderByDesc('created_at')->get();
        $interestTags = InterestTag::all();
        $userInterestIds = $user->interestTags()->pluck('interest_tags.id')->toArray();

        // Login activity
        $loginActivities = $user->loginActivities()
            ->orderByDesc('logged_in_at')
            ->limit(10)
            ->get();

        // Current session token for marking active
        $currentSessionToken = session()->getId();

        // User's filed reports
        $myReports = $user->reports()
            ->with('reportable')
            ->orderByDesc('created_at')
            ->paginate(10);

        return Inertia::render('Settings', [
            'user' => array_merge(
                $user->only([
                    'id', 'name', 'username', 'email', 'bio', 'about', 'phone',
                    'location', 'profile_picture', 'background_picture', 'privacy_setting',
                    'font_size', 'reduce_motion', 'high_contrast', 'dark_mode',
                    'pronouns', 'show_activity_status', 'profile_accent',
                ]),
                [
                    'notification_preferences' => $user->notification_preferences ?? $defaultNotifPrefs,
                    'posts_count' => $user->posts()->count(),
                    'followers_count' => $user->followers()->count(),
                    'following_count' => $user->following()->count(),
                ]
            ),
            'blocked_users' => $blockedUsers,
            'muted_keywords' => $mutedKeywords,
            'interest_tags' => $interestTags,
            'user_interest_ids' => $userInterestIds,
            'login_activities' => $loginActivities,
            'current_session_token' => $currentSessionToken,
            'my_reports' => $myReports,
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
            'pronouns' => 'nullable|string|max:30',
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
            $oldPath = $user->profile_picture;
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('profile_picture')->store('profile-pictures');
        $user->update(['profile_picture' => Storage::url($path)]);

        return back()->with('status', 'profile-picture-updated');
    }

    public function updateBackgroundPicture(Request $request): RedirectResponse
    {
        $request->validate([
            'background_picture' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $user = $request->user();

        if ($user->background_picture) {
            $oldPath = $user->background_picture;
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('background_picture')->store('background-pictures');
        $user->update(['background_picture' => Storage::url($path)]);

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
            'show_activity_status' => 'nullable|boolean',
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'privacy-updated');
    }

    public function updateNotifications(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notification_preferences' => 'required|array',
        ]);

        $request->user()->update($validated);

        return back()->with('status', 'notifications-updated');
    }

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
     * Update interest tags.
     */
    public function updateInterests(Request $request): RedirectResponse
    {
        $request->validate([
            'tag_ids' => 'required|array|max:10',
            'tag_ids.*' => 'exists:interest_tags,id',
        ]);

        $request->user()->interestTags()->sync($request->tag_ids);

        return back()->with('status', 'interests-updated');
    }

    /**
     * Update profile accent color.
     */
    public function updateAccent(Request $request): RedirectResponse
    {
        $request->validate([
            'profile_accent' => 'required|string|in:deep-blue,coral,bioluminescent-green,abyssal-purple,seafoam,sunset-orange',
        ]);

        $request->user()->update(['profile_accent' => $request->profile_accent]);

        return back()->with('status', 'accent-updated');
    }

    /**
     * Set featured post.
     */
    public function updateFeaturedPost(Request $request): JsonResponse
    {
        $request->validate([
            'post_id' => 'nullable|exists:posts,id',
        ]);

        $user = $request->user();

        // Verify the post belongs to the user
        if ($request->post_id) {
            $post = \App\Models\Post::find($request->post_id);
            if (!$post || $post->user_id !== $user->id) {
                return response()->json(['message' => 'You can only feature your own posts.'], 403);
            }
        }

        $user->update(['featured_post_id' => $request->post_id]);

        return response()->json(['success' => true]);
    }

    /**
     * Add muted keyword.
     */
    public function addMutedKeyword(Request $request): RedirectResponse
    {
        $request->validate(['keyword' => 'required|string|max:100']);

        MutedKeyword::firstOrCreate([
            'user_id' => $request->user()->id,
            'keyword' => strtolower(trim($request->keyword)),
        ]);

        return back()->with('status', 'keyword-muted');
    }

    /**
     * Remove muted keyword.
     */
    public function removeMutedKeyword(MutedKeyword $keyword): RedirectResponse
    {
        if ($keyword->user_id !== Auth::id()) {
            abort(403);
        }

        $keyword->delete();

        return back()->with('status', 'keyword-unmuted');
    }

    /**
     * Get login activities.
     */
    public function loginActivity(): JsonResponse
    {
        $activities = Auth::user()->loginActivities()
            ->orderByDesc('logged_in_at')
            ->limit(10)
            ->get();

        return response()->json($activities);
    }

    /**
     * Log out all other sessions.
     */
    public function logoutOtherSessions(Request $request): JsonResponse
    {
        $currentToken = session()->getId();

        // Delete all sessions except current
        DB::table('sessions')
            ->where('user_id', Auth::id())
            ->where('id', '!=', $currentToken)
            ->delete();

        return response()->json(['success' => true]);
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

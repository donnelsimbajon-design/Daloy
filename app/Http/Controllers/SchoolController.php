<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\Post;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SchoolController extends Controller
{
    /**
     * List all schools/groups with membership info.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $filter = $request->query('filter', 'all'); // all, my, discover

        $query = School::withCount('members', 'posts');

        if ($filter === 'my') {
            $query->whereHas('members', fn($q) => $q->where('user_id', $user->id));
        } elseif ($filter === 'discover') {
            $query->whereDoesntHave('members', fn($q) => $q->where('user_id', $user->id));
        }

        $schools = $query->latest()->get()->map(function ($school) use ($user) {
            $school->is_member = $school->members()->where('user_id', $user->id)->exists();
            $school->is_creator = $school->created_by === $user->id;
            $school->member_role = $school->members()
                ->where('user_id', $user->id)
                ->first()?->pivot?->role;
            $school->member_avatars = $school->members()
                ->select('users.id', 'users.profile_picture', 'users.name')
                ->limit(3)
                ->get();
            return $school;
        });

        return Inertia::render('Schools', [
            'schools' => $schools,
            'filter' => $filter,
        ]);
    }

    /**
     * Show a single school/group page with posts and members.
     */
    public function show(School $school)
    {
        $user = Auth::user();

        $school->loadCount('members', 'posts');
        $school->load('creator:id,name,username,profile_picture');

        $isMember = $school->members()->where('user_id', $user->id)->exists();
        $memberRole = $school->members()->where('user_id', $user->id)->first()?->pivot?->role;
        $isCreator = $school->created_by === $user->id;
        $isAdmin = $memberRole === 'admin' || $isCreator;

        // Get posts for this school
        $posts = $school->posts()
            ->with(['user:id,name,username,profile_picture', 'media', 'school:id,name,profile_image'])
            ->withCount(['comments', 'reactions'])
            ->withExists(['reactions as liked_by_user' => function ($q) {
                $q->where('user_id', Auth::id())
                  ->where('type', 'like');
            }])
            ->latest()
            ->paginate(15);

        // Get members
        $members = $school->members()
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture', 'users.bio')
            ->withPivot('role')
            ->orderByRaw("CASE WHEN school_members.role = 'admin' THEN 0 WHEN school_members.role = 'moderator' THEN 1 ELSE 2 END")
            ->paginate(20);

        return Inertia::render('SchoolProfile', [
            'school' => array_merge($school->toArray(), [
                'is_member' => $isMember,
                'is_creator' => $isCreator,
                'is_admin'  => $isAdmin,
                'member_role' => $memberRole,
            ]),
            'posts' => $posts,
            'members' => $members,
        ]);
    }

    /**
     * Join or leave a school/group.
     */
    public function toggleMembership(School $school)
    {
        $user = Auth::user();

        if ($school->created_by === $user->id) {
            return response()->json(['message' => 'Creator cannot leave the group.'], 400);
        }

        $isMember = $school->members()->where('user_id', $user->id)->exists();

        if ($isMember) {
            $school->members()->detach($user->id);
            return response()->json(['message' => 'Left the group.', 'is_member' => false]);
        } else {
            $school->members()->attach($user->id, ['role' => 'member']);
            return response()->json(['message' => 'Joined the group.', 'is_member' => true]);
        }
    }

    /**
     * Create a new school/group.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'privacy' => 'required|in:public,private',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('schools/covers', 'public');
            $coverPath = '/storage/' . $path;
        }

        $school = School::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'privacy' => $validated['privacy'],
            'cover_image' => $coverPath,
            'created_by' => Auth::id(),
        ]);

        // Creator is automatically an admin member
        $school->members()->attach(Auth::id(), ['role' => 'admin']);

        return redirect()->route('schools.show', $school)->with('status', 'group-created');
    }

    /**
     * Update the group's cover image.
     */
    public function updateCoverImage(Request $request, School $school)
    {
        $this->authorizeAdmin($school);

        $request->validate([
            'cover_image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // Delete old cover
        if ($school->cover_image) {
            $oldPath = str_replace('/storage/', '', $school->cover_image);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('cover_image')->store('schools/covers', 'public');
        $school->update(['cover_image' => '/storage/' . $path]);

        return back()->with('status', 'cover-updated');
    }

    /**
     * Update the group's profile image.
     */
    public function updateProfileImage(Request $request, School $school)
    {
        $this->authorizeAdmin($school);

        $request->validate([
            'profile_image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // Delete old profile image
        if ($school->profile_image) {
            $oldPath = str_replace('/storage/', '', $school->profile_image);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('profile_image')->store('schools/profiles', 'public');
        $school->update(['profile_image' => '/storage/' . $path]);

        return back()->with('status', 'profile-updated');
    }

    /**
     * Update group details (name, description, privacy).
     */
    public function updateDetails(Request $request, School $school)
    {
        $this->authorizeAdmin($school);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'privacy' => 'required|in:public,private',
        ]);

        $school->update($validated);

        return back()->with('status', 'details-updated');
    }

    /**
     * Create a post within a school/group.
     */
    public function storePost(Request $request, School $school)
    {
        $user = Auth::user();

        // Must be a member to post
        if (!$school->members()->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['content' => 'You must be a member to post.']);
        }

        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'visibility' => 'required|in:public,followers,private',
            'media' => 'nullable|array|max:4',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm|max:51200',
        ]);

        if (empty($validated['content']) && empty($request->file('media'))) {
            return back()->withErrors(['content' => 'Please write something or attach media.']);
        }

        $post = Post::create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'content' => $validated['content'] ?? null,
            'visibility' => $validated['visibility'],
        ]);

        if ($request->hasFile('media')) {
            $mediaUrls = [];
            foreach ($request->file('media') as $index => $file) {
                $path = $file->store('posts/' . $post->id, 'public');
                $url = '/storage/' . $path;
                $extension = strtolower($file->getClientOriginalExtension());
                $type = in_array($extension, ['mp4', 'mov', 'webm']) ? 'video' : 'image';

                Media::create([
                    'post_id' => $post->id,
                    'type' => $type,
                    'url' => $url,
                    'order' => $index,
                ]);
                $mediaUrls[] = $url;
            }
            $post->update(['media_urls' => $mediaUrls]);
        }

        return back()->with('status', 'post-created');
    }

    /**
     * Ensure the current user is an admin of the school.
     */
    private function authorizeAdmin(School $school): void
    {
        $user = Auth::user();
        $isCreator = $school->created_by === $user->id;
        $isAdmin = $school->members()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();

        if (!$isCreator && !$isAdmin) {
            abort(403, 'Only group admins can perform this action.');
        }
    }
}


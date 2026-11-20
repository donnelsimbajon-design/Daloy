<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Post;
use App\Models\Media;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EventController extends Controller
{
    /**
     * Private schools and members-only events must not disclose event details,
     * attendee lists, discussion posts, or RSVP endpoints to outsiders.
     */
    private function authorizeEventAccess(Event $event, User $viewer): void
    {
        $school = $event->school;
        abort_unless($school, 404);
        if ($school->privacy === 'private' || $event->privacy === 'members_only') {
            abort_unless($school->members()->where('users.id', $viewer->id)->exists(), 404);
        }
    }

    private function authorizeSchoolEvents(School $school, User $viewer): bool
    {
        $member = $school->members()->where('users.id', $viewer->id)->exists();
        if ($school->privacy === 'private') {
            abort_unless($member, 404);
        }
        return $member;
    }

    /**
     * Global events page — events from all groups the user belongs to.
     */
    public function globalIndex()
    {
        $user = Auth::user();

        // Get all school IDs the user is a member of
        $schoolIds = $user->schools()->pluck('schools.id');

        $events = Event::whereIn('school_id', $schoolIds)
            ->with(['creator:id,name,username,profile_picture', 'school:id,name,profile_image'])
            ->withCount([
                'rsvps as going_count' => fn($q) => $q->where('status', 'going'),
                'rsvps as interested_count' => fn($q) => $q->where('status', 'interested'),
            ])
            ->orderByRaw("CASE WHEN status = 'live' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END")
            ->orderBy('starts_at', 'asc')
            ->get()
            ->map(function ($event) use ($user) {
                $event->syncStatus();
                $event->user_rsvp = EventRsvp::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->value('status');
                $event->going_avatars = $event->attendees()
                    ->wherePivot('status', 'going')
                    ->select('users.id', 'users.name', 'users.profile_picture')
                    ->limit(5)
                    ->get();
                return $event;
            });

        return Inertia::render('Events', ['events' => $events]);
    }

    /**
     * List events for a school/group.
     */
    public function index(School $school)
    {
        $user = Auth::user();
        $member = $this->authorizeSchoolEvents($school, $user);

        $events = $school->events()
            ->when(!$member, fn ($q) => $q->where('privacy', 'public'))
            ->with('creator:id,name,username,profile_picture')
            ->withCount([
                'rsvps as going_count' => fn($q) => $q->where('status', 'going'),
                'rsvps as interested_count' => fn($q) => $q->where('status', 'interested'),
            ])
            ->orderByRaw("CASE WHEN status = 'live' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END")
            ->orderBy('starts_at', 'asc')
            ->get()
            ->map(function ($event) use ($user) {
                // Sync status in real-time
                $event->syncStatus();

                $event->user_rsvp = EventRsvp::where('event_id', $event->id)
                    ->where('user_id', $user->id)
                    ->value('status');

                $event->going_avatars = $event->attendees()
                    ->wherePivot('status', 'going')
                    ->select('users.id', 'users.name', 'users.profile_picture')
                    ->limit(5)
                    ->get();

                return $event;
            });

        return response()->json($events);
    }

    /**
     * Show event detail page.
     */
    public function show(Event $event)
    {
        $user = Auth::user();
        $this->authorizeEventAccess($event, $user);

        $event->syncStatus();
        $event->load('creator:id,name,username,profile_picture', 'school:id,name,profile_image');
        $event->loadCount([
            'rsvps as going_count' => fn($q) => $q->where('status', 'going'),
            'rsvps as interested_count' => fn($q) => $q->where('status', 'interested'),
            'posts as discussion_count',
        ]);

        // User's RSVP status
        $userRsvp = EventRsvp::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->value('status');

        // Going attendees
        $goingAttendees = $event->attendees()
            ->wherePivot('status', 'going')
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->limit(20)
            ->get();

        // Interested attendees
        $interestedAttendees = $event->attendees()
            ->wherePivot('status', 'interested')
            ->select('users.id', 'users.name', 'users.username', 'users.profile_picture')
            ->limit(20)
            ->get();

        // Discussion posts linked to this event
        $posts = Post::where('event_id', $event->id)
            ->with(['user:id,name,username,profile_picture', 'media', 'school:id,name,profile_image'])
            ->withCount(['comments', 'reactions'])
            ->withExists(['reactions as liked_by_user' => function ($q) {
                $q->where('user_id', Auth::id())
                  ->where('type', 'like');
            }])
            ->latest()
            ->paginate(15);

        // Check if user is member of the group
        $isMember = $event->school->members()->where('user_id', $user->id)->exists();

        // Check admin/mod status
        $memberRole = $event->school->members()->where('user_id', $user->id)->first()?->pivot?->role;
        $isCreator = $event->school->created_by === $user->id;
        $isGroupAdmin = $memberRole === 'admin' || $isCreator;
        $isEventCreator = $event->user_id === $user->id;

        return Inertia::render('EventDetail', [
            'event' => array_merge($event->toArray(), [
                'user_rsvp' => $userRsvp,
                'is_event_creator' => $isEventCreator,
                'is_group_admin' => $isGroupAdmin,
            ]),
            'goingAttendees' => $goingAttendees,
            'interestedAttendees' => $interestedAttendees,
            'posts' => $posts,
            'isMember' => $isMember,
        ]);
    }

    /**
     * Create a new event in a school/group.
     */
    public function store(Request $request, School $school)
    {
        $user = Auth::user();
        $this->authorizeGroupAdmin($school, $user);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:2000',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'starts_at' => 'required|date|after:now',
            'ends_at' => 'nullable|date|after:starts_at',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'privacy' => 'required|in:public,members_only',
        ]);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('events/covers', 'public');
            $coverPath = Storage::disk('public')->url($path);
        }

        $event = Event::create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'] ?? null,
            'cover_image' => $coverPath,
            'privacy' => $validated['privacy'],
            'status' => 'upcoming',
        ]);

        // Auto-RSVP the creator as "going"
        EventRsvp::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'status' => 'going',
        ]);

        // Auto-generate an announcement post in the group feed
        Post::create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'event_id' => $event->id,
            'content' => "📅 New Event: **{$event->title}**\n\n{$event->description}\n\n🕐 " . $event->starts_at->format('M d, Y • g:i A') . ($event->location ? "\n📍 {$event->location}" : ''),
            'visibility' => 'public',
        ]);

        return redirect()->route('events.show', $event)->with('status', 'event-created');
    }

    /**
     * RSVP to an event (going, interested, not_going).
     */
    public function rsvp(Request $request, Event $event)
    {
        $user = Auth::user();
        $this->authorizeEventAccess($event, $user);

        $validated = $request->validate([
            'status' => 'required|in:going,interested,not_going',
        ]);

        $rsvp = EventRsvp::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id],
            ['status' => $validated['status']]
        );

        // Return updated counts
        $goingCount = EventRsvp::where('event_id', $event->id)->where('status', 'going')->count();
        $interestedCount = EventRsvp::where('event_id', $event->id)->where('status', 'interested')->count();

        return response()->json([
            'status' => $rsvp->status,
            'going_count' => $goingCount,
            'interested_count' => $interestedCount,
        ]);
    }

    /**
     * Cancel RSVP (remove entirely).
     */
    public function cancelRsvp(Event $event)
    {
        $this->authorizeEventAccess($event, Auth::user());
        EventRsvp::where('event_id', $event->id)
            ->where('user_id', Auth::id())
            ->delete();

        return response()->json(['status' => null]);
    }

    /**
     * Create a discussion post inside an event.
     */
    public function storePost(Request $request, Event $event)
    {
        $user = Auth::user();
        $this->authorizeEventAccess($event, $user);

        // Must be a member of the school
        if (!$event->school->members()->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['content' => 'You must be a group member to post.']);
        }

        $validated = $request->validate([
            'content' => 'nullable|string|max:2000',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm|max:51200',
        ]);

        $mediaFiles = $request->file('media', []);
        if (array_sum(array_map(fn ($file) => $file->getSize(), $mediaFiles)) > 90 * 1024 * 1024) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'media' => 'Photos and videos must total 90 MB or less.',
            ]);
        }

        if (empty($validated['content']) && empty($mediaFiles)) {
            return back()->withErrors(['content' => 'Please write something or attach media.']);
        }

        $post = Post::create([
            'user_id' => $user->id,
            'school_id' => $event->school_id,
            'event_id' => $event->id,
            'content' => $validated['content'] ?? null,
            'visibility' => 'public',
        ]);

        if ($request->hasFile('media')) {
            $mediaUrls = [];
            foreach ($request->file('media') as $index => $file) {
                $path = $file->store('posts/' . $post->id, 'public');
                $url = Storage::disk('public')->url($path);
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
     * Delete an event (admin/creator only).
     */
    public function destroy(Event $event)
    {
        $user = Auth::user();
        $school = $event->school;

        // Must be event creator or group admin
        $memberRole = $school->members()->where('user_id', $user->id)->first()?->pivot?->role;
        $isCreator = $school->created_by === $user->id;
        $isGroupAdmin = $memberRole === 'admin' || $isCreator;
        $isEventCreator = $event->user_id === $user->id;

        if (!$isGroupAdmin && !$isEventCreator) {
            abort(403, 'Only group admins or the event creator can delete events.');
        }

        // Delete cover image
        if ($event->cover_image) {
            $urlPath = parse_url($event->cover_image, PHP_URL_PATH) ?: '';
            if (str_starts_with($urlPath, '/storage/events/covers/')) {
                Storage::disk('public')->delete(substr($urlPath, strlen('/storage/')));
            }
        }

        $event->delete();

        return redirect()->route('schools.show', $school)->with('status', 'event-deleted');
    }

    /**
     * Check in to an event (Prompt 7).
     */
    public function checkin(Event $event)
    {
        $user = Auth::user();
        $this->authorizeEventAccess($event, $user);

        // Must have RSVP'd as going
        $rsvp = EventRsvp::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->where('status', 'going')
            ->first();

        if (!$rsvp) {
            return response()->json(['message' => 'You must RSVP as going before checking in.'], 422);
        }

        // Event must be live
        $event->syncStatus();
        if ($event->status !== 'live') {
            return response()->json(['message' => 'Check-in is only available during live events.'], 422);
        }

        // Already checked in?
        if ($rsvp->checked_in_at) {
            return response()->json(['message' => 'You have already checked in.', 'checked_in' => true]);
        }

        $rsvp->update(['checked_in_at' => now()]);

        return response()->json([
            'checked_in' => true,
            'checked_in_at' => $rsvp->checked_in_at,
        ]);
    }

    /**
     * Check if user is admin/moderator of the group.
     */
    private function authorizeGroupAdmin(School $school, $user): void
    {
        $isCreator = $school->created_by === $user->id;
        $role = $school->members()->where('user_id', $user->id)->first()?->pivot?->role;
        $isAdmin = $role === 'admin' || $role === 'moderator';

        if (!$isCreator && !$isAdmin) {
            abort(403, 'Only group admins and moderators can create events.');
        }
    }
}

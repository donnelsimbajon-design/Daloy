<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Post;
use App\Models\School;
use App\Models\Story;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Private-school, members-only event, and story-reply access regressions.
 * Uses fresh in-memory SQLite and fake file storage.
 */
class EventStoryAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Inertia HTTP feature tests should not require a compiled Vite manifest.
        $this->withoutVite();
    }

    private function school(User $owner, string $privacy = 'public'): School
    {
        $school = School::create([
            'name' => 'School of Testing',
            'privacy' => $privacy,
            'created_by' => $owner->id,
        ]);
        $school->members()->attach($owner->id, ['role' => 'admin']);

        return $school;
    }

    private function event(School $school, User $owner, string $privacy = 'public'): Event
    {
        return Event::create([
            'school_id' => $school->id,
            'user_id' => $owner->id,
            'title' => 'Protected Event',
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDays(2),
            'privacy' => $privacy,
            'status' => 'upcoming',
        ]);
    }

    public function test_private_school_event_routes_reject_outsiders(): void
    {
        $owner = User::factory()->create();
        $visitor = User::factory()->create();
        $school = $this->school($owner, 'private');
        $event = $this->event($school, $owner);

        $this->actingAs($visitor)->getJson("/schools/{$school->id}/events")->assertNotFound();
        $this->actingAs($visitor)->get("/events/{$event->id}")->assertNotFound();
        $this->actingAs($visitor)->postJson("/events/{$event->id}/rsvp", ['status' => 'going'])->assertNotFound();
        $this->actingAs($visitor)->deleteJson("/events/{$event->id}/rsvp")->assertNotFound();
        $this->actingAs($visitor)->postJson("/events/{$event->id}/checkin")->assertNotFound();

        $this->assertDatabaseCount('event_rsvps', 0);
    }

    public function test_members_only_events_are_not_exposed_in_public_school_lists(): void
    {
        $owner = User::factory()->create();
        $visitor = User::factory()->create();
        $school = $this->school($owner);
        $public = $this->event($school, $owner);
        $membersOnly = $this->event($school, $owner, 'members_only');

        $result = $this->actingAs($visitor)->getJson("/schools/{$school->id}/events")->assertOk();
        $visibleIds = array_column($result->json(), 'id');
        $this->assertContains($public->id, $visibleIds);
        $this->assertNotContains($membersOnly->id, $visibleIds);

        $this->actingAs($visitor)->get("/events/{$membersOnly->id}")->assertNotFound();
        $this->actingAs($visitor)->postJson("/events/{$membersOnly->id}/rsvp", ['status' => 'going'])
            ->assertNotFound();
        $this->assertDatabaseCount('event_rsvps', 0);

        $this->actingAs($owner)->get("/events/{$membersOnly->id}")->assertOk();
    }

    public function test_event_discussion_accepts_five_photos_on_public_disk(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $school = $this->school($owner);
        $event = $this->event($school, $owner);

        $photos = [];
        foreach (range(1, 5) as $i) {
            $photos[] = UploadedFile::fake()->image("event-photo-{$i}.jpg");
        }

        $this->actingAs($owner)->from("/events/{$event->id}")
            ->post("/events/{$event->id}/posts", [
                'content' => 'Our school event gallery',
                'media' => $photos,
            ])->assertRedirect();

        $post = Post::where('event_id', $event->id)->firstOrFail();
        $this->assertSame(5, $post->media()->count());
        foreach ($post->media as $photo) {
            $path = parse_url($photo->url, PHP_URL_PATH) ?: $photo->url;
            Storage::disk('public')->assertExists(preg_replace('#^/storage/#', '', $path));
        }
    }

    public function test_story_replies_cannot_bypass_private_message_settings(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $owner->forceFill(['privacy_setting' => 'private'])->save();
        $viewer->following()->attach($owner->id);

        $story = Story::create([
            'user_id' => $owner->id,
            'type' => 'image',
            'media_url' => '/storage/stories/sample.jpg',
            'visibility' => 'public',
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($viewer)->postJson("/stories/{$story->id}/reply", [
            'content' => 'Not allowed to bypass private DMs',
        ])->assertForbidden();
        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }
}

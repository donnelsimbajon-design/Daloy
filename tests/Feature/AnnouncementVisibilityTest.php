<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Announcement;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function announcement(User $adminUser, array $attributes = []): Announcement
    {
        $admin = Admin::create(['user_id' => $adminUser->id, 'role' => 'super_admin']);

        return Announcement::create(array_merge([
            'admin_id' => $admin->id,
            'title' => 'Important notice',
            'message' => 'An official update',
            'type' => 'info',
            'target_audience' => 'all',
            'display_location' => 'feed',
            'is_active' => true,
            'sent_count' => 1,
            'read_count' => 0,
        ], $attributes));
    }

    public function test_unpublished_and_scheduled_announcements_are_not_visible_or_actionable(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $draft = $this->announcement($owner, ['sent_count' => 0]);

        $this->actingAs($viewer)->getJson('/api/announcements/live')
            ->assertOk()->assertJsonPath('announcement', null);
        $this->actingAs($viewer)->postJson("/api/announcements/{$draft->id}/interact", [
            'dismissed' => true,
        ])->assertNotFound();

        $draft->update(['sent_count' => 1, 'scheduled_at' => now()->addDay()]);
        $this->actingAs($viewer)->getJson('/api/announcements/live')
            ->assertOk()->assertJsonPath('announcement', null);
        $this->actingAs($viewer)->postJson("/api/announcements/{$draft->id}/interact", [
            'dismissed' => true,
        ])->assertNotFound();
        $this->assertDatabaseCount('announcement_interactions', 0);
    }

    public function test_school_targeted_announcements_deny_nonmembers(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $school = School::create([
            'name' => 'Selected members', 'created_by' => $owner->id, 'privacy' => 'private',
        ]);
        $school->members()->attach($member->id, ['role' => 'member']);
        $announcement = $this->announcement($owner, [
            'target_audience' => 'specific_school',
            'school_id' => $school->id,
        ]);

        $this->actingAs($outsider)->getJson('/api/announcements/live')
            ->assertOk()->assertJsonPath('announcement', null);
        $this->actingAs($outsider)->postJson("/api/announcements/{$announcement->id}/interact", [
            'dismissed' => true,
        ])->assertNotFound();

        $this->actingAs($member)->postJson("/api/announcements/{$announcement->id}/interact", [
            'vote' => 'upvote', 'dismissed' => true,
        ])->assertOk();
        $this->assertSame(1, $announcement->fresh()->read_count);
    }

    public function test_read_count_increments_only_for_first_dismissal(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $announcement = $this->announcement($owner);
        $url = "/api/announcements/{$announcement->id}/interact";

        $this->actingAs($viewer)->postJson($url, ['vote' => 'upvote', 'dismissed' => true])->assertOk();
        $this->actingAs($viewer)->postJson($url, ['vote' => 'downvote', 'dismissed' => true])->assertOk();
        $this->actingAs($viewer)->postJson($url, ['dismissed' => false])->assertOk();

        $this->assertSame(1, $announcement->fresh()->read_count);
        $this->assertDatabaseHas('announcement_interactions', [
            'announcement_id' => $announcement->id,
            'user_id' => $viewer->id,
            'vote' => 'downvote',
            'dismissed' => true,
        ]);
        $this->actingAs($viewer)->getJson('/api/announcements/live')
            ->assertOk()->assertJsonPath('announcement', null);
    }
}

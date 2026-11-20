<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Post;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression checks for cross-user sharing and live-room privacy.
 * All tests use a disposable in-memory database.
 */
class CommunicationAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_outsiders_cannot_read_group_call_status_or_chat(): void
    {
        $admin = User::factory()->create();
        $outsider = User::factory()->create();
        $conversation = Conversation::create(['type' => 'group', 'name' => 'Members only']);
        $conversation->participants()->attach($admin->id, ['role' => 'admin']);

        $this->actingAs($outsider)->getJson("/api/group-calls/{$conversation->id}/active")->assertForbidden();
        $this->actingAs($outsider)->getJson("/api/group-calls/{$conversation->id}/chat")->assertForbidden();
        $this->actingAs($outsider)->getJson("/api/group-calls/{$conversation->id}/mute-status")->assertForbidden();
        $this->actingAs($outsider)->postJson("/api/group-calls/{$conversation->id}/leave")->assertForbidden();

        $this->actingAs($admin)->getJson("/api/group-calls/{$conversation->id}/active")
            ->assertOk()->assertJsonPath('active', false);
    }

    public function test_private_school_currents_deny_visitors(): void
    {
        $owner = User::factory()->create();
        $visitor = User::factory()->create();
        $school = School::create([
            'name' => 'Private Student Group',
            'privacy' => 'private',
            'created_by' => $owner->id,
        ]);
        $school->members()->attach($owner->id, ['role' => 'admin']);

        $this->actingAs($visitor)->getJson("/schools/{$school->id}/currents/join")->assertForbidden();
        $this->actingAs($visitor)->getJson("/schools/{$school->id}/currents/live-state")->assertForbidden();
        $this->actingAs($visitor)->postJson("/schools/{$school->id}/currents/chat", [
            'message' => 'Intrusion',
        ])->assertForbidden();
        $this->actingAs($visitor)->postJson("/schools/{$school->id}/currents/vote", [
            'vote' => 'good',
        ])->assertForbidden();

        $this->actingAs($owner)->getJson("/schools/{$school->id}/currents/live-state")
            ->assertOk()->assertJsonPath('active', false);
    }

    public function test_private_post_cannot_be_shared_as_a_preview_to_nonviewer(): void
    {
        $author = User::factory()->create();
        $recipient = User::factory()->create();
        $recipient->forceFill(['privacy_setting' => 'public'])->save();

        $post = Post::create([
            'user_id' => $author->id,
            'visibility' => 'private',
            'content' => 'Private update — do not disclose',
        ]);
        $this->actingAs($author)->postJson('/share/send', [
            'recipient_id' => $recipient->id,
            'post_id' => $post->id,
            'post_url' => "https://daloy.test/posts/{$post->id}",
        ])->assertNotFound();

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_share_dialog_respects_private_direct_message_settings(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $recipient->forceFill(['privacy_setting' => 'private'])->save();
        $post = Post::create([
            'user_id' => $sender->id, 'visibility' => 'public', 'content' => 'Public update',
        ]);

        $this->actingAs($sender)->postJson('/share/send', [
            'recipient_id' => $recipient->id,
            'post_id' => $post->id,
            'post_url' => "https://daloy.test/posts/{$post->id}",
        ])->assertForbidden();
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_share_dialog_rejects_self_sharing(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/share/send', [
            'recipient_id' => $user->id,
            'post_url' => 'https://daloy.test/posts/123',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_public_post_share_creates_a_message_for_permitted_recipient(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $recipient->forceFill(['privacy_setting' => 'public'])->save();
        $post = Post::create([
            'user_id' => $sender->id,
            'visibility' => 'public',
            'content' => 'A public update',
        ]);
        $this->actingAs($sender)->postJson('/share/send', [
            'recipient_id' => $recipient->id,
            'post_id' => $post->id,
            'post_url' => "https://daloy.test/posts/{$post->id}",
        ])->assertOk();

        $message = Message::firstOrFail();
        $this->assertSame('shared_post', $message->metadata['type']);
        $this->assertSame($post->id, $message->metadata['post_id']);
    }
    public function test_group_invitation_does_not_expose_email_or_private_account_fields(): void
    {
        $admin = User::factory()->create();
        $invitee = User::factory()->create();
        $conversation = Conversation::create(['type' => 'group', 'name' => 'Group']);
        $conversation->participants()->attach($admin->id, ['role' => 'admin']);

        $result = $this->actingAs($admin)->postJson("/api/conversations/{$conversation->id}/invite", [
            'user_id' => $invitee->id,
        ])->assertOk();

        $this->assertSame($invitee->id, $result->json('user.id'));
        $this->assertArrayNotHasKey('email', $result->json('user'));
        $this->assertArrayNotHasKey('privacy_setting', $result->json('user'));
        $this->assertArrayNotHasKey('password', $result->json('user'));
    }

    public function test_group_avatar_upload_is_saved_to_the_public_disk(): void
    {
        Storage::fake('public');
        $creator = User::factory()->create();
        $invitee = User::factory()->create();

        $result = $this->actingAs($creator)->postJson('/api/conversations/group', [
            'name' => 'Group with Photo',
            'member_ids' => [$invitee->id],
            'avatar' => UploadedFile::fake()->image('group-avatar.jpg'),
        ])->assertOk();

        $avatarUrl = $result->json('avatar_url');
        $this->assertNotEmpty($avatarUrl);
        $publicPath = parse_url($avatarUrl, PHP_URL_PATH) ?: $avatarUrl;
        $storedPath = preg_replace('#^/storage/#', '', $publicPath);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_school_post_supports_five_photos_and_stores_every_attachment(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $school = School::create([
            'name' => 'Photo School', 'privacy' => 'public', 'created_by' => $owner->id,
        ]);
        $school->members()->attach($owner->id, ['role' => 'admin']);

        $files = [];
        for ($i = 1; $i <= 5; $i++) {
            $files[] = UploadedFile::fake()->image("gallery-{$i}.jpg");
        }

        $this->actingAs($owner)->from("/schools/{$school->id}")->post("/schools/{$school->id}/posts", [
            'content' => 'Five photos from our school',
            'visibility' => 'public',
            'media' => $files,
        ])->assertRedirect();

        $post = Post::where('school_id', $school->id)
            ->where('content', 'Five photos from our school')->firstOrFail();
        $this->assertSame(5, $post->media()->count());
    }

}

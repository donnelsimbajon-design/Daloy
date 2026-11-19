<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Server-side regression coverage for post and messaging permissions.
 * Uses disposable in-memory SQLite, never staging or production data.
 */
class SocialFlowIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function conversation(User $admin, User $member): Conversation
    {
        $conversation = Conversation::create(['type' => 'group', 'name' => 'Test group']);
        $conversation->participants()->attach($admin->id, ['role' => 'admin']);
        $conversation->participants()->attach($member->id, ['role' => 'member']);

        return $conversation;
    }

    public function test_post_owner_can_moderate_while_an_unrelated_user_cannot(): void
    {
        $owner = User::factory()->create();
        $commenter = User::factory()->create();
        $stranger = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id, 'content' => 'A public update', 'visibility' => 'public',
        ]);
        $comment = Comment::create([
            'post_id' => $post->id, 'user_id' => $commenter->id, 'content' => 'Unwanted comment',
        ]);

        $this->actingAs($stranger)->deleteJson("/comments/{$comment->id}")->assertForbidden();
        $this->assertNotSoftDeleted('comments', ['id' => $comment->id]);

        $this->actingAs($owner)->deleteJson("/comments/{$comment->id}")->assertOk();
        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    }

    public function test_a_reply_cannot_point_to_a_comment_on_another_post(): void
    {
        $author = User::factory()->create();
        $first = Post::create(['user_id' => $author->id, 'content' => 'First post', 'visibility' => 'public']);
        $second = Post::create(['user_id' => $author->id, 'content' => 'Second post', 'visibility' => 'public']);
        $otherPostComment = Comment::create([
            'post_id' => $second->id, 'user_id' => $author->id, 'content' => 'Private context for other post',
        ]);

        $this->actingAs($author)->postJson("/posts/{$first->id}/comments", [
            'content' => 'Invalid cross-post reply', 'parent_id' => $otherPostComment->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');

        $this->assertDatabaseMissing('comments', ['post_id' => $first->id, 'parent_id' => $otherPostComment->id]);
    }

    public function test_messaging_endpoints_deny_nonparticipants(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $conversation = $this->conversation($admin, $member);
        $message = Message::create([
            'conversation_id' => $conversation->id, 'user_id' => $admin->id, 'content' => 'For members only',
        ]);

        $this->actingAs($outsider)->postJson("/api/messages/{$message->id}/react", ['emoji' => '👍'])->assertForbidden();
        $this->actingAs($outsider)->postJson("/api/conversations/{$conversation->id}/typing")->assertForbidden();
        $this->actingAs($outsider)->getJson("/api/conversations/{$conversation->id}/typing")->assertForbidden();
        $this->actingAs($outsider)->patchJson("/api/conversations/{$conversation->id}/name", [
            'name' => 'Hijacked group name',
        ])->assertForbidden();
    }

    public function test_only_group_admin_may_rename_a_group(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $conversation = $this->conversation($admin, $member);

        $this->actingAs($member)->patchJson("/api/conversations/{$conversation->id}/name", [
            'name' => 'Not allowed',
        ])->assertForbidden();
        $this->actingAs($admin)->patchJson("/api/conversations/{$conversation->id}/name", [
            'name' => 'Updated group name',
        ])->assertOk();
        $this->assertSame('Updated group name', $conversation->fresh()->name);
    }

    public function test_reply_to_message_must_be_in_the_same_conversation(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $first = $this->conversation($admin, $member);
        $second = $this->conversation($admin, $member);
        $unrelated = Message::create([
            'conversation_id' => $second->id, 'user_id' => $admin->id, 'content' => 'Other conversation',
        ]);

        $this->actingAs($admin)->postJson('/api/messages/send', [
            'conversation_id' => $first->id, 'content' => 'Cannot quote unrelated message',
            'reply_to_id' => $unrelated->id,
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('messages', [
            'conversation_id' => $first->id, 'reply_to_id' => $unrelated->id,
        ]);
    }

    public function test_group_member_can_leave_without_a_server_error(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $conversation = $this->conversation($admin, $member);

        $this->actingAs($member)->postJson("/api/conversations/{$conversation->id}/leave")->assertOk();
        $this->assertDatabaseMissing('conversation_participants', [
            'conversation_id' => $conversation->id, 'user_id' => $member->id,
        ]);
    }

    public function test_user_cannot_start_a_direct_conversation_with_self(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/conversations/start', [
            'user_id' => $user->id,
        ])->assertUnprocessable();
    }
}

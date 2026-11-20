<?php

namespace Tests\Feature;

use App\Models\Bookmark;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reaction_toggle_is_consistent_and_does_not_duplicate_reactions(): void
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'React to this update',
            'visibility' => 'public',
        ]);

        $this->actingAs($user)->postJson("/posts/{$post->id}/like", ['type' => 'like'])
            ->assertOk()->assertJsonPath('reacted', true);
        $this->actingAs($user)->postJson("/posts/{$post->id}/like", ['type' => 'like'])
            ->assertOk()->assertJsonPath('reacted', false);
        $this->assertSame(0, $post->reactions()->count());

        $this->actingAs($user)->postJson("/posts/{$post->id}/like", ['type' => 'wave'])
            ->assertOk()->assertJsonPath('reacted', true);
        $this->actingAs($user)->postJson("/posts/{$post->id}/like", ['type' => 'fire'])
            ->assertOk()->assertJsonPath('reacted', true);
        $this->assertSame(1, $post->reactions()->count());
        $this->assertSame('fire', $post->reactions()->first()->type);
    }

    public function test_poll_votes_can_change_without_doubling_total_votes(): void
    {
        $owner = User::factory()->create();
        $voter = User::factory()->create();
        $this->actingAs($owner)->post('/posts', [
            'content' => 'Choose your favorite',
            'visibility' => 'public',
            'poll_question' => 'Which is better?',
            'poll_options' => ['Option one', 'Option two'],
        ])->assertRedirect();

        $post = Post::where('user_id', $owner->id)->latest('id')->firstOrFail();
        $poll = $post->poll()->firstOrFail();
        $choices = $poll->options()->orderBy('id')->get();

        $this->actingAs($voter)->postJson("/polls/{$poll->id}/vote", [
            'option_id' => $choices[0]->id,
        ])->assertOk()->assertJsonPath('total_votes', 1);
        $this->actingAs($voter)->postJson("/polls/{$poll->id}/vote", [
            'option_id' => $choices[1]->id,
        ])->assertOk()->assertJsonPath('total_votes', 1);

        $this->assertSame(1, PollVote::where('poll_id', $poll->id)->count());
        $this->assertSame(0, (int) $choices[0]->fresh()->votes_count);
        $this->assertSame(1, (int) $choices[1]->fresh()->votes_count);
    }

    public function test_private_posts_cannot_be_reposted_or_bookmarked_by_outsiders(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'Private notes',
            'visibility' => 'private',
        ]);

        $this->actingAs($outsider)->postJson("/posts/{$post->id}/repost")->assertForbidden();
        $this->actingAs($outsider)->postJson("/posts/{$post->id}/bookmark")->assertNotFound();
        $this->assertSame(0, Post::where('repost_of_id', $post->id)->count());
        $this->assertSame(0, Bookmark::where('post_id', $post->id)->count());
    }

    public function test_public_repost_toggle_reuses_existing_repost_record(): void
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $owner->id,
            'content' => 'Share this update',
            'visibility' => 'public',
        ]);

        $this->actingAs($user)->postJson("/posts/{$post->id}/repost")
            ->assertOk()->assertJsonPath('reposted', true);
        $this->actingAs($user)->postJson("/posts/{$post->id}/repost")
            ->assertOk()->assertJsonPath('reposted', false);
        $this->actingAs($user)->postJson("/posts/{$post->id}/repost")
            ->assertOk()->assertJsonPath('reposted', true);

        $this->assertSame(1, Post::where('user_id', $user->id)
            ->where('repost_of_id', $post->id)->count());
    }
}

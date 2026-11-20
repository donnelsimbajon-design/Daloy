<?php

namespace Tests\Feature;

use App\Models\Hashtag;
use App\Models\Post;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostDiscoveryPrivacyTest extends TestCase
{
    use RefreshDatabase;

    private function privateSchool(User $owner): School
    {
        $school = School::create([
            'name' => 'Private Club',
            'privacy' => 'private',
            'created_by' => $owner->id,
        ]);
        $school->members()->attach($owner->id, ['role' => 'admin']);

        return $school;
    }

    private function privateSchoolPost(User $owner, School $school, string $visibility = 'public'): Post
    {
        return Post::create([
            'user_id' => $owner->id,
            'school_id' => $school->id,
            'content' => 'SecretCampusUpdate #campusprivacy',
            'visibility' => $visibility,
        ]);
    }

    public function test_search_does_not_leak_private_school_posts_to_nonmembers(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $member = User::factory()->create();
        $school = $this->privateSchool($owner);
        $school->members()->attach($member->id, ['role' => 'member']);
        $post = $this->privateSchoolPost($owner, $school);

        $outsideSearch = $this->actingAs($outsider)->getJson('/api/search?type=posts&q=SecretCampusUpdate')
            ->assertOk();
        $this->assertNotContains($post->id, array_column($outsideSearch->json('posts'), 'id'));

        $insideSearch = $this->actingAs($member)->getJson('/api/search?type=posts&q=SecretCampusUpdate')
            ->assertOk();
        $this->assertContains($post->id, array_column($insideSearch->json('posts'), 'id'));
    }

    public function test_follower_outside_private_school_cannot_see_school_post_in_feed(): void
    {
        $owner = User::factory()->create();
        $follower = User::factory()->create();
        $school = $this->privateSchool($owner);
        $post = $this->privateSchoolPost($owner, $school, 'followers');
        $follower->following()->attach($owner->id);

        $response = $this->actingAs($follower)->get('/app', ['X-Inertia' => 'true']);
        $response->assertOk();
        $this->assertNotContains($post->id, array_column($response->json('props.posts.data'), 'id'));
    }

    public function test_private_visibility_still_applies_within_a_school(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $school = $this->privateSchool($owner);
        $school->members()->attach($member->id, ['role' => 'member']);
        $post = $this->privateSchoolPost($owner, $school, 'private');

        $this->assertTrue($post->isVisibleTo($owner));
        $this->assertFalse($post->isVisibleTo($member));
        $this->actingAs($member)->get("/posts/{$post->id}")->assertNotFound();
    }

    public function test_private_school_post_is_not_exposed_through_hashtag(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $school = $this->privateSchool($owner);
        $post = $this->privateSchoolPost($owner, $school);
        $tag = Hashtag::firstOrCreate(['name' => 'campusprivacy']);
        $post->hashtags()->attach($tag->id);

        $response = $this->actingAs($outsider)->get('/hashtag/campusprivacy', ['X-Inertia' => 'true']);
        $response->assertOk();
        $this->assertNotContains($post->id, array_column($response->json('props.posts.data'), 'id'));
    }

    public function test_featured_private_school_post_is_hidden_on_public_profile(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $school = $this->privateSchool($owner);
        $post = $this->privateSchoolPost($owner, $school);
        $owner->forceFill(['featured_post_id' => $post->id])->save();

        $response = $this->actingAs($outsider)->get("/users/{$owner->id}", ['X-Inertia' => 'true']);
        $response->assertOk()->assertJsonPath('props.featuredPost', null);
    }
}

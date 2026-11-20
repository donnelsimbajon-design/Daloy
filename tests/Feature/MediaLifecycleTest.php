<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function photos(int $number): array
    {
        return array_map(
            fn (int $i) => UploadedFile::fake()->image("gallery-{$i}.jpg"),
            range(1, $number)
        );
    }

    private function createPost(User $owner, int $count): Post
    {
        $this->actingAs($owner)->post('/posts', [
            'content' => 'Media ownership test',
            'visibility' => 'public',
            'media' => $this->photos($count),
        ])->assertRedirect();

        return Post::where('user_id', $owner->id)
            ->where('content', 'Media ownership test')->latest('id')->firstOrFail();
    }

    public function test_ten_photo_upload_saves_all_media_and_files(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $post = $this->createPost($owner, 10);

        $this->assertSame(10, $post->media()->count());
        $this->assertCount(10, $post->fresh()->media_urls);
        foreach ($post->media as $attachment) {
            $path = preg_replace('#^/storage/#', '', parse_url($attachment->url, PHP_URL_PATH));
            Storage::disk('public')->assertExists($path);
        }
    }

    public function test_removing_one_photo_only_removes_that_file_and_updates_gallery(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $post = $this->createPost($owner, 3);
        $media = $post->media()->orderBy('order')->get();
        $deleted = $media[1];
        $deletedPath = preg_replace('#^/storage/#', '', parse_url($deleted->url, PHP_URL_PATH));
        $remainingPaths = [$media[0]->url, $media[2]->url];

        $this->actingAs($owner)->deleteJson("/posts/{$post->id}/media/{$deleted->id}")
            ->assertOk()->assertJsonPath('media_count', 2);

        $this->assertDatabaseMissing('media', ['id' => $deleted->id]);
        Storage::disk('public')->assertMissing($deletedPath);
        $this->assertEqualsCanonicalizing($remainingPaths, $post->fresh()->media_urls);
        foreach ($post->fresh()->media as $left) {
            $path = preg_replace('#^/storage/#', '', parse_url($left->url, PHP_URL_PATH));
            Storage::disk('public')->assertExists($path);
        }
    }

    public function test_nonowners_cannot_remove_media_or_reference_another_post(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = $this->createPost($owner, 2);
        $otherPost = $this->createPost($other, 1);
        $media = $post->media()->firstOrFail();
        $otherMedia = $otherPost->media()->firstOrFail();

        $this->actingAs($other)->deleteJson("/posts/{$post->id}/media/{$media->id}")
            ->assertForbidden();

        $this->actingAs($owner)->deleteJson("/posts/{$post->id}/media/{$otherMedia->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('media', ['id' => $media->id]);
        $this->assertDatabaseHas('media', ['id' => $otherMedia->id]);
    }

    public function test_more_than_ten_photos_are_rejected_without_creating_a_post(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();

        $this->actingAs($owner)->postJson('/posts', [
            'content' => 'Eleven photos should fail',
            'visibility' => 'public',
            'media' => $this->photos(11),
        ])->assertUnprocessable()->assertJsonValidationErrors(['media']);

        $this->assertDatabaseMissing('posts', ['content' => 'Eleven photos should fail']);
    }
}

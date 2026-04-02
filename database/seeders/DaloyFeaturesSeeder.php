<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DaloyFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        // Interest Tags (20 defaults)
        $tags = ['Ocean', 'Music', 'Tech', 'Art', 'Sports', 'Travel', 'Food', 'Gaming',
                 'Photography', 'Science', 'Film', 'Books', 'Fashion', 'Nature', 'Fitness',
                 'Design', 'Business', 'Education', 'Culture', 'Community'];

        foreach ($tags as $tag) {
            DB::table('interest_tags')->insertOrIgnore(['label' => $tag]);
        }

        // Profile Badges
        $badges = [
            ['key' => 'early_voyager', 'label' => 'Early Voyager', 'description' => 'Registered in the first month of Daloy', 'icon' => '🚀', 'color' => '#3b82f6'],
            ['key' => 'top_contributor', 'label' => 'Top Contributor', 'description' => 'Created 50+ posts', 'icon' => '⭐', 'color' => '#f59e0b'],
            ['key' => 'event_host', 'label' => 'Event Host', 'description' => 'Created 5+ events', 'icon' => '🎪', 'color' => '#10b981'],
            ['key' => 'school_founder', 'label' => 'School Founder', 'description' => 'Created a school', 'icon' => '🏫', 'color' => '#8b5cf6'],
            ['key' => 'social_butterfly', 'label' => 'Social Butterfly', 'description' => '100+ friends', 'icon' => '🦋', 'color' => '#ec4899'],
            ['key' => 'deep_diver', 'label' => 'Deep Diver', 'description' => 'Active on Daloy for over 1 year', 'icon' => '🤿', 'color' => '#06b6d4'],
        ];

        foreach ($badges as $badge) {
            DB::table('profile_badges')->insertOrIgnore($badge);
        }

        // Explore Collections
        $collections = [
            ['name' => 'Tech', 'description' => 'Latest in technology and innovation', 'icon' => '💻', 'hashtag_ids' => json_encode([]), 'display_order' => 1, 'is_active' => true],
            ['name' => 'Music', 'description' => 'Rhythms and melodies from around the world', 'icon' => '🎵', 'hashtag_ids' => json_encode([]), 'display_order' => 2, 'is_active' => true],
            ['name' => 'Sports', 'description' => 'Athletic achievements and competitions', 'icon' => '⚽', 'hashtag_ids' => json_encode([]), 'display_order' => 3, 'is_active' => true],
            ['name' => 'Art', 'description' => 'Creative expressions and visual arts', 'icon' => '🎨', 'hashtag_ids' => json_encode([]), 'display_order' => 4, 'is_active' => true],
            ['name' => 'Travel', 'description' => 'Explore destinations and adventures', 'icon' => '✈️', 'hashtag_ids' => json_encode([]), 'display_order' => 5, 'is_active' => true],
            ['name' => 'Food', 'description' => 'Culinary delights and recipes', 'icon' => '🍜', 'hashtag_ids' => json_encode([]), 'display_order' => 6, 'is_active' => true],
            ['name' => 'Science', 'description' => 'Discoveries and scientific breakthroughs', 'icon' => '🔬', 'hashtag_ids' => json_encode([]), 'display_order' => 7, 'is_active' => true],
            ['name' => 'Culture', 'description' => 'Traditions, heritage, and cultural stories', 'icon' => '🌏', 'hashtag_ids' => json_encode([]), 'display_order' => 8, 'is_active' => true],
        ];

        foreach ($collections as $c) {
            DB::table('explore_collections')->insertOrIgnore($c);
        }
    }
}

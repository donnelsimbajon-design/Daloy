<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════════
        // PROMPT 4 — Safety & Privacy
        // ═══════════════════════════════════════════════════════════════

        // Content Warning on Posts
        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('has_content_warning')->default(false)->after('is_pinned');
            $table->string('content_warning_label', 100)->nullable()->after('has_content_warning');
            $table->string('comment_permission', 20)->default('everyone')->after('content_warning_label');
        });

        // Muted Keywords
        Schema::create('muted_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('keyword', 100);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'keyword']);
        });

        // Story Views
        Schema::create('story_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('story_id')->constrained()->cascadeOnDelete();
            $table->foreignId('viewer_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('viewed_at')->useCurrent();
            $table->unique(['story_id', 'viewer_id']);
        });

        // Restricted Users
        Schema::create('restricted_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restricted_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'restricted_user_id']);
        });

        // Login Activities
        Schema::create('login_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 20)->default('desktop');
            $table->string('location')->nullable();
            $table->timestamp('logged_in_at')->useCurrent();
            $table->timestamp('logged_out_at')->nullable();
            $table->string('session_token')->nullable();
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 1 — Post & Content Features
        // ═══════════════════════════════════════════════════════════════

        // Bookmarks
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'post_id']);
        });

        // Polls
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('question');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->unsignedInteger('votes_count')->default(0);
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('option_id')->constrained('poll_options')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['poll_id', 'user_id']);
        });

        // Mentions
        Schema::create('mentions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('comment_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('mentioned_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        // Repost column
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('repost_of_id')->nullable()->constrained('posts')->nullOnDelete()->after('comment_permission');
        });

        // Post Announcement columns
        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('is_announcement')->default(false)->after('repost_of_id');
            $table->timestamp('announcement_expires_at')->nullable()->after('is_announcement');
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 2 — Social & Connection Features
        // ═══════════════════════════════════════════════════════════════

        // Close Friends
        Schema::create('close_friends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('friend_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'friend_id']);
        });

        // Tide Scores
        Schema::create('tide_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->timestamp('updated_at')->nullable();
        });

        // Interest Tags
        Schema::create('interest_tags', function (Blueprint $table) {
            $table->id();
            $table->string('label')->unique();
        });

        Schema::create('user_interest_tags', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('interest_tags')->cascadeOnDelete();
            $table->primary(['user_id', 'tag_id']);
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 3 — Profile & Personalization Features
        // ═══════════════════════════════════════════════════════════════

        // Profile Badges
        Schema::create('profile_badges', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->text('description');
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained('profile_badges')->cascadeOnDelete();
            $table->timestamp('earned_at')->useCurrent();
            $table->primary(['user_id', 'badge_id']);
        });

        // Users table additions for Profile & Personalization
        Schema::table('users', function (Blueprint $table) {
            $table->string('pronouns', 30)->nullable()->after('name');
            $table->boolean('show_activity_status')->default(true)->after('dark_mode');
            $table->foreignId('featured_post_id')->nullable()->constrained('posts')->nullOnDelete()->after('show_activity_status');
            $table->string('profile_accent', 20)->nullable()->default('deep-blue')->after('featured_post_id');
            $table->timestamp('notifications_snoozed_until')->nullable()->after('profile_accent');
        });

        // Profile Visits
        Schema::create('profile_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visited_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('visitor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('visited_at')->useCurrent();
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 5 — Messaging Upgrades
        // ═══════════════════════════════════════════════════════════════

        // Message Reactions
        Schema::create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 10);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['message_id', 'user_id']);
        });

        // Message additions
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')->nullable()->constrained('messages')->nullOnDelete()->after('media_url');
            $table->timestamp('deleted_for_everyone_at')->nullable()->after('reply_to_id');
        });

        // Typing Indicators
        Schema::create('typing_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('updated_at')->useCurrent();
            $table->unique(['conversation_id', 'user_id']);
        });

        // Conversation participant role
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->string('role', 10)->default('member')->after('last_read_at');
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 7 — School & Event Upgrades
        // ═══════════════════════════════════════════════════════════════

        // School rules
        Schema::table('schools', function (Blueprint $table) {
            $table->text('rules')->nullable()->after('description');
            $table->string('invite_token', 32)->nullable()->unique()->after('rules');
        });

        // Event RSVP additions
        Schema::table('event_rsvps', function (Blueprint $table) {
            $table->timestamp('reminder_sent_at')->nullable()->after('status');
            $table->timestamp('checked_in_at')->nullable()->after('reminder_sent_at');
        });

        // ═══════════════════════════════════════════════════════════════
        // PROMPT 8 — Discovery & Search Upgrades
        // ═══════════════════════════════════════════════════════════════

        // Search History
        Schema::create('search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('query', 200);
            $table->timestamp('searched_at')->useCurrent();
        });

        // Explore Collections
        Schema::create('explore_collections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->json('hashtag_ids')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('explore_collections');
        Schema::dropIfExists('search_history');

        if (Schema::hasColumn('event_rsvps', 'checked_in_at')) {
            Schema::table('event_rsvps', function (Blueprint $table) {
                $table->dropColumn(['reminder_sent_at', 'checked_in_at']);
            });
        }

        if (Schema::hasColumn('schools', 'rules')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->dropColumn(['rules', 'invite_token']);
            });
        }

        if (Schema::hasColumn('conversation_participants', 'role')) {
            Schema::table('conversation_participants', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        Schema::dropIfExists('typing_indicators');

        if (Schema::hasColumn('messages', 'reply_to_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropForeign(['reply_to_id']);
                $table->dropColumn(['reply_to_id', 'deleted_for_everyone_at']);
            });
        }

        Schema::dropIfExists('message_reactions');
        Schema::dropIfExists('profile_visits');

        if (Schema::hasColumn('users', 'pronouns')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['featured_post_id']);
                $table->dropColumn(['pronouns', 'show_activity_status', 'featured_post_id', 'profile_accent', 'notifications_snoozed_until']);
            });
        }

        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('profile_badges');
        Schema::dropIfExists('user_interest_tags');
        Schema::dropIfExists('interest_tags');
        Schema::dropIfExists('tide_scores');
        Schema::dropIfExists('close_friends');

        if (Schema::hasColumn('posts', 'is_announcement')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropColumn(['is_announcement', 'announcement_expires_at']);
            });
        }

        if (Schema::hasColumn('posts', 'repost_of_id')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropForeign(['repost_of_id']);
                $table->dropColumn('repost_of_id');
            });
        }

        Schema::dropIfExists('mentions');
        Schema::dropIfExists('poll_votes');
        Schema::dropIfExists('poll_options');
        Schema::dropIfExists('polls');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('login_activities');
        Schema::dropIfExists('restricted_users');
        Schema::dropIfExists('story_views');
        Schema::dropIfExists('muted_keywords');

        if (Schema::hasColumn('posts', 'has_content_warning')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropColumn(['has_content_warning', 'content_warning_label', 'comment_permission']);
            });
        }
    }
};

<?php

namespace App\Jobs;

use App\Models\Announcement;
use App\Models\Ripple;
use App\Models\SchoolMember;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BroadcastAnnouncement implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Announcement $announcement
    ) {}

    public function handle(): void
    {
        $a = $this->announcement;

        // Build target user query
        $query = User::query();

        match ($a->target_audience) {
            'new_users'     => $query->where('created_at', '>=', now()->subDays(30)),
            'active_users'  => $query->where('updated_at', '>=', now()->subDays(7)),
            'specific_school' => $query->whereIn('id',
                SchoolMember::where('school_id', $a->school_id)->pluck('user_id')
            ),
            default         => null, // 'all' — no filter
        };

        $count = 0;

        $query->select('id')->chunk(200, function ($users) use ($a, &$count) {
            $ripples = $users->map(fn($user) => [
                'user_id'         => $user->id,
                'sender_id'       => null,
                'type'            => 'announcement',
                'notifiable_type' => Announcement::class,
                'notifiable_id'   => $a->id,
                'data'            => json_encode([
                    'announcement_id'   => $a->id,
                    'title'             => $a->title,
                    'message'           => $a->message,
                    'announcement_type' => $a->type,
                    'display_location'  => $a->display_location,
                ]),
                'read_at'         => null,
                'created_at'      => now(),
                'updated_at'      => now(),
            ])->toArray();

            Ripple::insert($ripples);
            $count += count($ripples);
        });

        $a->increment('sent_count', $count);
    }
}

<?php

namespace App\Console\Commands;

use App\Jobs\BroadcastAnnouncement;
use App\Models\Announcement;
use Illuminate\Console\Command;

class SendScheduledAnnouncements extends Command
{
    protected $signature   = 'announcements:send-scheduled';
    protected $description = 'Dispatch broadcast jobs for due scheduled announcements';

    public function handle(): int
    {
        $due = Announcement::where('is_active', true)
            ->where('sent_count', 0)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($due->isEmpty()) {
            $this->info('No scheduled announcements due.');
            return self::SUCCESS;
        }

        foreach ($due as $announcement) {
            BroadcastAnnouncement::dispatch($announcement);
            $this->info("Dispatched: [{$announcement->id}] {$announcement->title}");
        }

        return self::SUCCESS;
    }
}

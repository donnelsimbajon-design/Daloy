<?php

namespace App\Console\Commands;

use App\Models\UserActivityLog;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupOldActivityLogs extends Command
{
    protected $signature   = 'activity:cleanup {--days=90 : Number of days to retain}';
    protected $description = 'Archive activity logs older than N days (default 90)';

    public function handle(): int
    {
        $days   = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        $this->info("Archiving logs older than {$cutoff->toDateString()}...");

        $archived = 0;

        UserActivityLog::where('created_at', '<', $cutoff)
            ->chunk(500, function ($logs) use (&$archived) {
                $rows = $logs->map(fn($log) => [
                    'original_id'     => $log->id,
                    'user_id'         => $log->user_id,
                    'action_type'     => $log->action_type,
                    'action_category' => $log->action_category,
                    'target_type'     => $log->target_type,
                    'target_id'       => $log->target_id,
                    'metadata'        => json_encode($log->metadata),
                    'ip_address'      => $log->ip_address,
                    'created_at'      => $log->created_at,
                    'archived_at'     => now(),
                ])->toArray();

                DB::table('user_activity_logs_archive')->insert($rows);

                UserActivityLog::whereIn('id', $logs->pluck('id'))->delete();

                $archived += count($rows);
            });

        $this->info("✓ Archived {$archived} log records.");
        return self::SUCCESS;
    }
}

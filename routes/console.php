<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Archive activity logs older than 90 days — runs daily at 3 AM
Schedule::command('activity:cleanup')->dailyAt('03:00');

// Send scheduled announcements — runs every minute
Schedule::command('announcements:send-scheduled')->everyMinute();

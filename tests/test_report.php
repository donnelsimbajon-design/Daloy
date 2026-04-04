<?php
// Quick test script to verify reporting system
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Report;
use App\Models\Conversation;
use App\Models\User;

echo "=== Report System Test ===\n\n";

// 1. Check conversations exist
$convo = Conversation::with('participants')->first();
if (!$convo) {
    echo "❌ No conversations found. Create a conversation first.\n";
    exit;
}
echo "✅ Conversation #{$convo->id} found (type: {$convo->type})\n";
echo "   Participants: " . $convo->participants->pluck('name')->join(', ') . "\n";

// 2. Check if we can create a report
$user = User::first();
echo "\n✅ Reporter: {$user->name} (ID: {$user->id})\n";

// 3. Create a test report
$report = Report::updateOrCreate(
    [
        'reporter_id' => $user->id,
        'reportable_type' => 'App\\Models\\Conversation',
        'reportable_id' => $convo->id,
        'status' => 'pending',
    ],
    [
        'reason' => 'harassment: Test report - this user is sending inappropriate messages',
    ]
);

echo "\n✅ Report #{$report->id} created/updated:\n";
echo "   Reporter: {$user->name}\n";
echo "   Type: {$report->reportable_type}\n";
echo "   Target ID: {$report->reportable_id}\n";
echo "   Reason: {$report->reason}\n";
echo "   Status: {$report->status}\n";

// 4. Count reports
$totalReports = Report::where(function ($q) {
    $q->where('reportable_type', 'App\\Models\\Message')
      ->orWhere('reportable_type', 'App\\Models\\Conversation');
})->count();

$pendingReports = Report::where(function ($q) {
    $q->where('reportable_type', 'App\\Models\\Message')
      ->orWhere('reportable_type', 'App\\Models\\Conversation');
})->where('status', 'pending')->count();

echo "\n📊 Report Stats:\n";
echo "   Total: {$totalReports}\n";
echo "   Pending: {$pendingReports}\n";

echo "\n🎉 Done! Visit /admin/messages to see the report.\n";

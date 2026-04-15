<?php
$u = App\Models\User::where('username', 'exter')->first();
$a = App\Models\Admin::first();
try {
    $u->update(['banned_until' => now()->addDays(2)]);
    App\Models\ModerationAction::create([
        'admin_id' => $a->id,
        'action_type' => 'suspend_user',
        'target_type' => 'user',
        'target_id' => $u->id,
        'reason' => 'test'
    ]);
    echo "success\n";
} catch (\Exception $e) {
    echo $e->getMessage() . "\n";
}

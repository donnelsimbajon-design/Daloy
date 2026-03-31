<?php

namespace App\Traits;

use App\Services\UserActivityLogger;
use Illuminate\Support\Facades\Auth;

trait LogsUserActivity
{
    /**
     * Convenience method to log an activity for the current user.
     *
     * @param string $actionType     e.g. 'post_created', 'login', 'friend_request_sent'
     * @param string $actionCategory e.g. 'post', 'account', 'social'
     * @param string|null $targetType  e.g. 'Post', 'User'
     * @param int|null $targetId
     * @param array $metadata        Extra context (never log passwords or message content)
     */
    protected function logActivity(
        string $actionType,
        string $actionCategory,
        ?string $targetType = null,
        ?int $targetId = null,
        array $metadata = []
    ): void {
        $userId = Auth::id();
        if (!$userId) return;

        UserActivityLogger::log(
            $userId,
            $actionType,
            $actionCategory,
            $targetType,
            $targetId,
            $metadata
        );
    }
}

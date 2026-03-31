<?php

namespace App\Services;

use App\Models\UserActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Throwable;

class UserActivityLogger
{
    /**
     * Log a user activity. Silently fails — never breaks the parent action.
     */
    public static function log(
        int $userId,
        string $actionType,
        string $actionCategory,
        ?string $targetType = null,
        ?int $targetId = null,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        try {
            UserActivityLog::create([
                'user_id'         => $userId,
                'action_type'     => $actionType,
                'action_category' => $actionCategory,
                'target_type'     => $targetType,
                'target_id'       => $targetId,
                'metadata'        => empty($metadata) ? null : $metadata,
                'ip_address'      => $ipAddress ?? Request::ip(),
                'user_agent'      => $userAgent ?? substr(Request::userAgent() ?? '', 0, 512),
            ]);
        } catch (Throwable) {
            // Silently swallow — logging must never break the main flow
        }
    }

    /**
     * Log for the currently authenticated user.
     */
    public static function logForAuth(
        string $actionType,
        string $actionCategory,
        ?string $targetType = null,
        ?int $targetId = null,
        array $metadata = []
    ): void {
        $userId = Auth::id();
        if (!$userId) return;
        static::log($userId, $actionType, $actionCategory, $targetType, $targetId, $metadata);
    }
}

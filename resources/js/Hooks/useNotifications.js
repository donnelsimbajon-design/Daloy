import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * useNotifications — Real-time notification polling hook for Daloy 2.0
 *
 * Polls /api/ripples/unread-count every `interval` ms (default 3s)
 * and fetches new ripples since the last check for toast notifications.
 *
 * Returns:
 *   - unreadCount: total unread ripple count
 *   - newRipples: newly arrived ripples (for toasts)
 *   - clearNewRipples: function to dismiss toasts
 *   - markAllRead: function to mark everything as read
 *   - isPolling: whether polling is active
 */
export default function useNotifications({ interval = 3000, enabled = true } = {}) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [newRipples, setNewRipples] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    const lastCheckRef = useRef(new Date().toISOString());
    const intervalRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/ripples/unread-count');
            setUnreadCount(data.count || 0);
        } catch {
            // Silently fail — network hiccup
        }
    }, []);

    const fetchNewRipples = useCallback(async () => {
        try {
            const since = lastCheckRef.current;
            const { data } = await axios.get('/api/ripples/latest', {
                params: { since },
            });
            lastCheckRef.current = new Date().toISOString();

            if (data && data.length > 0) {
                setNewRipples(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const fresh = data.filter(r => !existingIds.has(r.id));
                    return [...fresh, ...prev].slice(0, 10);
                });
            }
        } catch {
            // Silently fail
        }
    }, []);

    const poll = useCallback(async () => {
        await Promise.all([fetchUnreadCount(), fetchNewRipples()]);
    }, [fetchUnreadCount, fetchNewRipples]);

    useEffect(() => {
        if (!enabled) return;

        // Initial fetch
        setIsPolling(true);
        poll();

        // Start polling
        intervalRef.current = setInterval(poll, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPolling(false);
        };
    }, [enabled, interval, poll]);

    const clearNewRipples = useCallback(() => {
        setNewRipples([]);
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await axios.post('/api/ripples/mark-all-read');
            setUnreadCount(0);
            setNewRipples([]);
        } catch {
            console.error('Failed to mark all as read');
        }
    }, []);

    const markOneRead = useCallback(async (rippleId) => {
        try {
            await axios.post(`/api/ripples/${rippleId}/mark-read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNewRipples(prev => prev.filter(r => r.id !== rippleId));
        } catch {
            console.error('Failed to mark ripple as read');
        }
    }, []);

    return {
        unreadCount,
        newRipples,
        clearNewRipples,
        markAllRead,
        markOneRead,
        isPolling,
        refresh: poll,
    };
}

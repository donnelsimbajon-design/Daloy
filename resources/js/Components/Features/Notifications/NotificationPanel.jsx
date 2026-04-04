import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
import axios from 'axios';

export default function NotificationPanel({ isOpen, onClose }) {
    const { t } = useLanguage();
    const { social } = usePage().props;
    const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
    const [pendingFollowRequests, setPendingFollowRequests] = useState([]);
    const [rippleNotifications, setRippleNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchPendingRequests();
            fetchRipples();
        }
    }, [isOpen]);

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const [friendRes, followRes] = await Promise.all([
                axios.get('/api/friend-requests/pending'),
                axios.get('/api/follow-requests/pending'),
            ]);
            setPendingFriendRequests(friendRes.data || []);
            setPendingFollowRequests(followRes.data || []);
        } catch {
            setPendingFriendRequests([]);
            setPendingFollowRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRipples = async () => {
        try {
            const { data } = await axios.get('/api/ripples/latest', {
                params: { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            });
            setRippleNotifications(data || []);
        } catch {
            setRippleNotifications([]);
        }
    };

    const handleFriendAction = async (requestId, action, index) => {
        setActionLoading(`friend-${requestId}`);
        try {
            await axios.post(`/api/friend-request/${action}`, { request_id: requestId });
            setPendingFriendRequests(prev => prev.filter((_, i) => i !== index));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFollowAction = async (requestId, action, index) => {
        setActionLoading(`follow-${requestId}`);
        try {
            await axios.post(`/api/follow-request/${action}`, { request_id: requestId });
            setPendingFollowRequests(prev => prev.filter((_, i) => i !== index));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRippleClick = (ripple) => {
        // Mark as read silently
        if (ripple.id) {
            axios.post(`/api/ripples/${ripple.id}/mark-read`).catch(() => {});
        }

        onClose();

        // Navigate based on type
        if (ripple.type === 'reaction' || ripple.type === 'like' || ripple.type === 'comment') {
            const postId = ripple.data?.post_id || ripple.notifiable_id;
            if (postId) {
                router.visit(`/posts/${postId}`);
                return;
            }
        }

        if (ripple.type === 'follow' || ripple.type === 'mention') {
            if (ripple.sender_id || ripple.sender?.id) {
                router.visit(`/users/${ripple.sender_id || ripple.sender?.id}`);
                return;
            }
        }

        if (ripple.type === 'group_deleted') {
            router.visit('/schools');
            return;
        }

        // Fallback — navigate to sender profile
        if (ripple.sender_id || ripple.sender?.id) {
            router.visit(`/users/${ripple.sender_id || ripple.sender?.id}`);
        }
    };

    // Ripple type → SVG icon + label
    const getRippleDisplay = (type) => {
        switch (type) {
            case 'reaction':
            case 'like':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    ),
                    color: 'text-rose-400',
                    bg: 'bg-rose-500/10',
                    label: 'reacted to your post',
                };
            case 'comment':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                    ),
                    color: 'text-sky-400',
                    bg: 'bg-sky-500/10',
                    label: 'commented on your post',
                };
            case 'mention':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                        </svg>
                    ),
                    color: 'text-violet-400',
                    bg: 'bg-violet-500/10',
                    label: 'mentioned you',
                };
            case 'follow':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                        </svg>
                    ),
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    label: 'started following you',
                };
            case 'group_deleted':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                    ),
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10',
                    label: 'A school was removed',
                };
            case 'repost':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                        </svg>
                    ),
                    color: 'text-teal-400',
                    bg: 'bg-teal-500/10',
                    label: 'shared your post',
                };
            default:
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                    ),
                    color: 'text-ocean-text-dim',
                    bg: 'bg-ocean-surface',
                    label: type || 'notification',
                };
        }
    };

    const totalPending = pendingFriendRequests.length + pendingFollowRequests.length;
    const hasRipples = rippleNotifications.length > 0;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

            <div className="absolute top-16 right-4 mt-2 w-full max-w-sm bg-ocean-deep border border-ocean-border rounded-2xl z-50 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="p-4 border-b border-ocean-border flex justify-between items-center bg-ocean-card/60 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-ocean-text tracking-wide">{t('Ripples')}</h3>
                        {(totalPending + rippleNotifications.length) > 0 && (
                            <span className="px-2 py-0.5 bg-biolum text-white text-xs font-bold rounded-full">
                                {totalPending + rippleNotifications.length}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-ocean-text-dim hover:bg-ocean-card hover:text-ocean-text transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-biolum border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Pending Friend Requests */}
                            {pendingFriendRequests.length > 0 && (
                                <div>
                                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-biolum/70">
                                        Friend Requests
                                    </p>
                                    {pendingFriendRequests.map((req, i) => (
                                        <div key={req.id} className="p-4 border-b border-ocean-border/40 hover:bg-ocean-card/40 transition-colors flex gap-3 items-start">
                                            <Link href={`/users/${req.sender?.id}`} onClick={onClose} className="shrink-0">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-biolum/10 text-biolum overflow-hidden">
                                                    {req.sender?.profile_picture ? (
                                                        <img src={req.sender.profile_picture} alt="" className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-ocean-text leading-snug">
                                                    <Link href={`/users/${req.sender?.id}`} onClick={onClose} className="font-bold text-ocean-text hover:underline">
                                                        {req.sender?.name || 'A user'}
                                                    </Link>
                                                    {' sent you a friend request'}
                                                </p>
                                                <p className="text-[10px] text-ocean-text-dim mt-1">
                                                    @{req.sender?.username || '?'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleFriendAction(req.id, 'accept', i)}
                                                        disabled={actionLoading === `friend-${req.id}`}
                                                        className="px-3 py-1 text-xs font-semibold bg-biolum text-white rounded-lg hover:bg-biolum-bright transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === `friend-${req.id}` ? '...' : 'Accept'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleFriendAction(req.id, 'reject', i)}
                                                        disabled={actionLoading === `friend-${req.id}`}
                                                        className="px-3 py-1 text-xs font-semibold bg-ocean-surface text-ocean-text-dim rounded-lg hover:bg-ocean-card transition-colors disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pending Follow Requests */}
                            {pendingFollowRequests.length > 0 && (
                                <div>
                                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-biolum/70">
                                        Follow Requests
                                    </p>
                                    {pendingFollowRequests.map((req, i) => (
                                        <div key={req.id} className="p-4 border-b border-ocean-border/40 hover:bg-ocean-card/40 transition-colors flex gap-3 items-start">
                                            <Link href={`/users/${req.follower?.id}`} onClick={onClose} className="shrink-0">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 overflow-hidden">
                                                    {req.follower?.profile_picture ? (
                                                        <img src={req.follower.profile_picture} alt="" className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-ocean-text leading-snug">
                                                    <Link href={`/users/${req.follower?.id}`} onClick={onClose} className="font-bold text-ocean-text hover:underline">
                                                        {req.follower?.name || 'A user'}
                                                    </Link>
                                                    {' wants to follow you'}
                                                </p>
                                                <p className="text-[10px] text-ocean-text-dim mt-1">
                                                    @{req.follower?.username || '?'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleFollowAction(req.id, 'accept', i)}
                                                        disabled={actionLoading === `follow-${req.id}`}
                                                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === `follow-${req.id}` ? '...' : 'Accept'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleFollowAction(req.id, 'reject', i)}
                                                        disabled={actionLoading === `follow-${req.id}`}
                                                        className="px-3 py-1 text-xs font-semibold bg-ocean-surface text-ocean-text-dim rounded-lg hover:bg-ocean-card transition-colors disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Activity / Ripple Notifications (Likes, Comments, etc.) */}
                            {hasRipples && (
                                <div>
                                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-biolum/70">
                                        Activity
                                    </p>
                                    {rippleNotifications.map((ripple) => {
                                        const display = getRippleDisplay(ripple.type);
                                        return (
                                            <div
                                                key={ripple.id}
                                                onClick={() => handleRippleClick(ripple)}
                                                className="p-4 border-b border-ocean-border/40 hover:bg-ocean-card/40 transition-colors flex gap-3 items-start cursor-pointer group"
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${display.bg} ${display.color}`}>
                                                    {ripple.sender?.profile_picture ? (
                                                        <img src={ripple.sender.profile_picture} alt="" className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        display.icon
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-ocean-text leading-snug">
                                                        <span className="font-bold text-ocean-text group-hover:underline">
                                                            {ripple.sender?.name || 'System'}
                                                        </span>
                                                        {' '}
                                                        {ripple.type === 'group_deleted' && ripple.data?.group_name
                                                            ? <>removed school "<span className="font-semibold">{ripple.data.group_name}</span>"</>
                                                            : display.label
                                                        }
                                                    </p>
                                                    <p className="text-[10px] text-ocean-text-dim mt-1">
                                                        {ripple.created_at
                                                            ? new Date(ripple.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                            : 'Just now'
                                                        }
                                                    </p>
                                                </div>
                                                <svg className="w-4 h-4 text-ocean-text-dim/30 group-hover:text-ocean-text-dim shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty state */}
                            {pendingFriendRequests.length === 0 && pendingFollowRequests.length === 0 && !hasRipples && (
                                <div className="flex flex-col items-center justify-center py-12 text-ocean-text-dim">
                                    <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                    <p className="text-sm font-medium">{t("The waters are calm")}</p>
                                    <p className="text-xs text-ocean-text-dim/50 mt-1">No new ripples for now</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

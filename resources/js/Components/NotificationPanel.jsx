import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
import axios from 'axios';

export default function NotificationPanel({ isOpen, onClose }) {
    const { t } = useLanguage();
    const { social } = usePage().props;
    const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
    const [pendingFollowRequests, setPendingFollowRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // id of item being actioned

    useEffect(() => {
        if (isOpen) {
            fetchPendingRequests();
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
        } catch (err) {
            // endpoints may not exist yet; graceful fallback
            setPendingFriendRequests([]);
            setPendingFollowRequests([]);
        } finally {
            setLoading(false);
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

    const totalPending = pendingFriendRequests.length + pendingFollowRequests.length;

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

            <div className="absolute top-16 right-4 mt-2 w-full max-w-sm bg-ocean-deep border border-ocean-border rounded-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-ocean-border flex justify-between items-center bg-ocean-card/60 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-ocean-text tracking-wide">{t('Notifications')}</h3>
                        {totalPending > 0 && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                                {totalPending}
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
                        <div className="p-8 text-center text-ocean-text-dim text-sm">Loading...</div>
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
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-biolum/10 text-biolum">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-ocean-text leading-snug">
                                                    <span className="font-bold text-ocean-text">{req.sender?.name || 'A user'}</span>
                                                    {' sent you a friend request'}
                                                </p>
                                                <p className="text-[10px] text-ocean-text-muted mt-1">
                                                    @{req.sender?.username || '?'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleFriendAction(req.id, 'accept', i)}
                                                        disabled={actionLoading === `friend-${req.id}`}
                                                        className="px-3 py-1 text-xs bg-biolum text-white rounded-lg hover:bg-biolum/80 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === `friend-${req.id}` ? '...' : 'Accept'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleFriendAction(req.id, 'reject', i)}
                                                        disabled={actionLoading === `friend-${req.id}`}
                                                        className="px-3 py-1 text-xs bg-ocean-surface text-ocean-text-dim rounded-lg hover:bg-ocean-card transition-colors disabled:opacity-50"
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
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-ocean-text leading-snug">
                                                    <span className="font-bold text-ocean-text">{req.follower?.name || 'A user'}</span>
                                                    {' wants to follow you'}
                                                </p>
                                                <p className="text-[10px] text-ocean-text-muted mt-1">
                                                    @{req.follower?.username || '?'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleFollowAction(req.id, 'accept', i)}
                                                        disabled={actionLoading === `follow-${req.id}`}
                                                        className="px-3 py-1 text-xs bg-emerald-600 text-ocean-text rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === `follow-${req.id}` ? '...' : 'Accept'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleFollowAction(req.id, 'reject', i)}
                                                        disabled={actionLoading === `follow-${req.id}`}
                                                        className="px-3 py-1 text-xs bg-ocean-surface text-ocean-text-dim rounded-lg hover:bg-ocean-card transition-colors disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {pendingFriendRequests.length === 0 && pendingFollowRequests.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-ocean-text-dim">
                                    <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                    <p className="text-sm">{t("You're all caught up!")}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-ocean-border bg-ocean-card/30 backdrop-blur-sm">
                    <Link
                        href="/ripples"
                        onClick={onClose}
                        className="block w-full text-center py-2.5 rounded-xl bg-ocean-surface text-ocean-text font-semibold text-sm hover:bg-ocean-card hover:text-ocean-text transition-all"
                    >
                        {t('View all notifications')} →
                    </Link>
                </div>
            </div>
        </>
    );
}

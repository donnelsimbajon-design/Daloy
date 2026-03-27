import React, { useState } from 'react';
import axios from 'axios';

export default function FriendRequestButton({ user, onUpdate, className = "", customText = false }) {
    const [loading, setLoading] = useState(false);

    const status = user.friendship_status || 'none';

    const handleSend = async () => {
        setLoading(true);
        try {
            await axios.post('/api/friend-request/send', { receiver_id: user.id });
            onUpdate({ ...user, friendship_status: 'sent' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        setLoading(true);
        try {
            await axios.post('/api/friend-request/accept', { request_id: user.friend_request_id });
            onUpdate({ ...user, friendship_status: 'friends' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'friends') {
        return (
            <button
                onClick={async () => {
                    if (!confirm('Unfriend ' + user.name + '?')) return;
                    setLoading(true);
                    await axios.delete('/api/friend/remove', { data: { friend_id: user.id } });
                    onUpdate({ ...user, friendship_status: 'none' });
                    setLoading(false);
                }}
                disabled={loading}
                className={className || "px-3 py-1.5 flex items-center justify-center gap-1.5 bg-ocean-surface border border-ocean-border text-ocean-text rounded-lg text-xs font-semibold hover:border-biolum/40 hover:text-biolum transition-all"}
            >
                {customText && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                {loading ? '...' : 'Friends'}
            </button>
        );
    }

    if (status === 'sent') {
        return (
            <button
                onClick={async () => {
                    setLoading(true);
                    if (user.friend_request_id) {
                        await axios.delete('/api/friend-request/cancel', { data: { request_id: user.friend_request_id } });
                        onUpdate({ ...user, friendship_status: 'none' });
                    }
                    setLoading(false);
                }}
                disabled={loading}
                className={className || "px-3 py-1.5 flex items-center justify-center gap-1.5 bg-ocean-surface border border-ocean-border text-ocean-text-dim rounded-lg text-xs font-semibold hover:border-ocean-text-dim hover:text-ocean-text transition-all"}
            >
                {loading ? '...' : (customText ? 'Cancel Req' : 'Sent')}
            </button>
        );
    }

    if (status === 'received') {
        return (
            <div className={`flex gap-1.5 ${customText ? 'w-full' : ''}`}>
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className={className ? className.replace('bg-ocean-surface text-ocean-text hover:bg-ocean-hover', 'bg-biolum text-white hover:bg-biolum-bright flex-1') : "px-3 py-1.5 flex items-center justify-center gap-1.5 bg-biolum text-white rounded-lg text-xs font-semibold hover:bg-biolum-bright transition-all flex-1"}
                >
                    Accept
                </button>
                <button
                    onClick={async () => {
                        setLoading(true);
                        await axios.post('/api/friend-request/reject', { request_id: user.friend_request_id });
                        onUpdate({ ...user, friendship_status: 'none' }); // or rejected
                        setLoading(false);
                    }}
                    disabled={loading}
                    className={className ? className.replace('bg-biolum hover:bg-biolum-bright', 'bg-ocean-surface hover:bg-ocean-hover text-ocean-text w-10 shrink-0 border border-ocean-border') : "px-3 py-1.5 flex items-center justify-center bg-ocean-surface border border-ocean-border text-ocean-text rounded-lg text-xs font-semibold hover:border-rose-500/50 hover:text-rose-400 transition-all shrink-0"}
                    title="Reject"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSend}
            disabled={loading}
            className={className || "px-3 py-1.5 flex items-center justify-center gap-1.5 bg-biolum text-white rounded-lg text-xs font-semibold hover:bg-biolum-bright border border-transparent shadow-[0_2px_8px_rgba(25,25,112,0.25)] transition-all"}
        >
            {customText && <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
            {loading ? '...' : (customText ? 'Connect' : 'Add')}
        </button>
    );
}

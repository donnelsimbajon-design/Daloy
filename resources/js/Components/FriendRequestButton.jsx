import React, { useState } from 'react';
import axios from 'axios';

export default function FriendRequestButton({ user, onUpdate }) {
    const [loading, setLoading] = useState(false);

    // Derive initial status from user object. 
    // Expect user to have: is_friend (bool), friend_request_sent (bool), friend_request_received (bool)
    // Or a single status field.
    // For now, let's assume the parent component passes the processed status or we use the flags.

    // Simplification: We use a derived state helper or props.
    // Let's assume user object has:
    // user.friendship_status: 'friends', 'sent', 'received', 'none'

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
            // we need request_id? Or just receiver_id logic in backend?
            // backend expects request_id. 
            // We need to fetch it or pass it. 
            // If the user object comes from a list, it might not have the request_id easily unless we eager loaded it.
            // Alternative: Backend accepts sender_id and finds the request.
            // Let's assume we have request_id in user.friend_request_id OR we change backend to accept sender_id.
            // Changing backend to accept sender_id is easier for frontend.
            // But let's assume we pass request_id if available.
            // Actually, for "Accept", usually we are in a list of requests.
            // If we are on a profile, we might need to find the request.
            // Let's update backend 'accept' to take sender_id from current context? No, valid request_id is safer.
            // I'll assume we have it. If not, I'll update backend to find by user_id.

            await axios.post('/api/friend-request/accept', { request_id: user.friend_request_id });
            onUpdate({ ...user, friendship_status: 'friends' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ... Implement Reject, Cancel, Remove ...

    // For brevity, only Send/Cancel/Remove for now if generic.
    // But 'received' state needs Accept/Reject.

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
                className="px-3 py-1 bg-green-600 text-ocean-text rounded text-sm hover:bg-green-700"
            >
                {loading ? '...' : 'Friends'}
            </button>
        );
    }

    if (status === 'sent') {
        return (
            <button
                onClick={async () => {
                    setLoading(true);
                    // Need request id usually. 
                    // Fallback: search backend or use sender logic?
                    // I will implemented 'cancel' in backend to user request_id.
                    if (user.friend_request_id) {
                        await axios.delete('/api/friend-request/cancel', { data: { request_id: user.friend_request_id } });
                        onUpdate({ ...user, friendship_status: 'none' });
                    }
                    setLoading(false);
                }}
                disabled={loading}
                className="px-3 py-1 bg-gray-500 text-ocean-text rounded text-sm"
            >
                {loading ? '...' : 'Request Sent'}
            </button>
        );
    }

    if (status === 'received') {
        return (
            <div className="flex gap-1">
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-ocean-text rounded text-sm hover:bg-blue-700"
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
                    className="px-3 py-1 bg-red-600 text-ocean-text rounded text-sm hover:bg-red-700"
                >
                    Reject
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSend}
            disabled={loading}
            className="px-3 py-1 bg-biolum text-white rounded text-sm hover:bg-biolum-dark"
        >
            {loading ? '...' : 'Add Friend'}
        </button>
    );
}

import React, { useState } from 'react';
import axios from 'axios';

export default function FollowButton({ user, onUpdate }) {
    const [loading, setLoading] = useState(false);

    // Expect: user.is_following (bool), user.follow_request_sent (bool)
    const isFollowing = user.is_following;
    const isRequested = user.follow_request_sent;

    const handleFollow = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/follow', { user_id: user.id });
            if (res.data.message === 'Follow request sent.') {
                onUpdate({ ...user, follow_request_sent: true });
            } else {
                onUpdate({ ...user, is_following: true });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async () => {
        setLoading(true);
        try {
            await axios.delete('/api/unfollow', { data: { user_id: user.id } });
            onUpdate({ ...user, is_following: false, follow_request_sent: false });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (isFollowing) {
        return (
            <button
                onClick={handleUnfollow}
                disabled={loading}
                className="px-3 py-1 bg-ocean-surface text-ocean-text-dim border border-ocean-border rounded text-sm hover:text-ocean-text"
            >
                {loading ? '...' : 'Following'}
            </button>
        );
    }

    if (isRequested) {
        return (
            <button
                onClick={handleUnfollow} // Cancel request
                disabled={loading}
                className="px-3 py-1 bg-gray-500 text-ocean-text rounded text-sm"
            >
                {loading ? '...' : 'Requested'}
            </button>
        );
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className="px-3 py-1 bg-transparent border border-biolum text-biolum rounded text-sm hover:bg-biolum hover:text-ocean-text transition-colors"
        >
            {loading ? '...' : 'Follow'}
        </button>
    );
}

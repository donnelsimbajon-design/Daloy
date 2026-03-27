import React, { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import UserCard from '@/Components/UserCard';
import FriendRequestButton from '@/Components/FriendRequestButton';
import axios from 'axios';

export default function Voyagers() {
    const { pendingRequests, allFriends, suggestedUsers, pendingCount, friendCount } = usePage().props;
    const [activeTab, setActiveTab] = useState('suggested');
    const [suggested, setSuggested] = useState(suggestedUsers || []);
    const [requests, setRequests] = useState(pendingRequests || []);
    const [friends, setFriends] = useState(allFriends || []);

    const handleAcceptReq = async (requestId, userId) => {
        try {
            await axios.post('/api/friend-request/accept', { request_id: requestId });
            // Move from requests to friends
            const accepted = requests.find(r => r.friend_request_id === requestId || r.id === userId);
            if (accepted) {
                setRequests(prev => prev.filter(r => r.friend_request_id !== requestId && r.id !== userId));
                setFriends(prev => [...prev, { ...accepted, friendship_status: 'friends' }]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectReq = async (requestId) => {
        try {
            await axios.post('/api/friend-request/reject', { request_id: requestId });
            setRequests(prev => prev.filter(r => r.friend_request_id !== requestId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            await axios.delete('/api/friend/remove', { data: { friend_id: friendId } });
            setFriends(prev => prev.filter(f => f.id !== friendId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setSuggested(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    };

    const tabs = [
        { key: 'suggested', label: 'Suggestions', count: suggested.length },
        { key: 'requests', label: 'Requests', count: requests.length, badge: requests.length > 0 },
        { key: 'friends', label: 'All Friends', count: friends.length },
    ];

    return (
        <MainLayout>
            <Head title="Friends & Connections" />

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                    <div>
                        <p className="text-sm font-semibold text-biolum mb-1">Connections</p>
                        <h1 className="text-3xl font-bold text-ocean-text tracking-tight">Friends & Voyagers</h1>
                        <p className="text-ocean-text-dim mt-1.5 text-sm md:text-base max-w-xl">
                            Discover new connections, manage requests, and see all your friends.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button className="flex items-center gap-2 px-5 py-2 bg-biolum text-ocean-deep text-sm font-semibold rounded-xl hover:bg-biolum-bright transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0ZM4 19.235v-.11a6.375 6.375 0 0112.662 0v.109A12.318 12.318 0 0110.331 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                            Invite Friends
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 border-b border-ocean-border pb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-biolum text-ocean-deep'
                                    : 'bg-ocean-surface border border-ocean-border text-ocean-text hover:bg-ocean-card'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1.5 text-xs font-semibold ${activeTab === tab.key ? 'text-ocean-deep/70' : 'text-ocean-text-dim'}`}>
                                    {tab.count}
                                </span>
                            )}
                            {tab.badge && activeTab !== tab.key && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Suggestions Tab */}
                {activeTab === 'suggested' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {suggested.map(user => (
                            <UserCard key={user.id} user={user} onUpdate={handleUserUpdate} />
                        ))}
                        {suggested.length === 0 && (
                            <div className="col-span-full text-center py-16 text-ocean-text-dim">
                                <p className="text-sm">No new suggestions right now. Check back later!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <div className="text-center py-16 text-ocean-text-dim">
                                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                                <p className="text-sm font-semibold">No pending requests</p>
                            </div>
                        ) : (
                            requests.map(user => (
                                <div key={user.id} className="flex items-center gap-4 p-4 bg-ocean-card border border-ocean-border rounded-[20px] hover:border-ocean-divider transition-all">
                                    <Link href={`/users/${user.id}`} className="w-14 h-14 rounded-full bg-biolum/20 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center font-bold text-ocean-text shrink-0">
                                        {user.profile_picture
                                            ? <img src={user.profile_picture} className="w-full h-full object-cover" />
                                            : user.name?.charAt(0)}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/users/${user.id}`} className="font-semibold text-ocean-text hover:text-biolum transition-colors">{user.name}</Link>
                                        <p className="text-xs text-ocean-text-dim truncate">@{user.username || 'user'} {user.location && `• ${user.location}`}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAcceptReq(user.friend_request_id, user.id)}
                                            className="px-5 py-2 rounded-xl bg-biolum text-ocean-deep text-sm font-semibold hover:bg-biolum-bright transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectReq(user.friend_request_id)}
                                            className="px-5 py-2 rounded-xl border border-ocean-border text-ocean-text text-sm font-semibold hover:bg-ocean-surface transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <div className="space-y-3">
                        {friends.length === 0 ? (
                            <div className="text-center py-16 text-ocean-text-dim">
                                <p className="text-sm font-semibold">No friends yet. Start connecting!</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.id} className="flex items-center gap-4 p-4 bg-ocean-card border border-ocean-border rounded-[20px] hover:border-ocean-divider transition-all group">
                                    <Link href={`/users/${friend.id}`} className="w-14 h-14 rounded-full bg-biolum/20 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center font-bold text-ocean-text shrink-0">
                                        {friend.profile_picture
                                            ? <img src={friend.profile_picture} className="w-full h-full object-cover" />
                                            : friend.name?.charAt(0)}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/users/${friend.id}`} className="font-semibold text-ocean-text hover:text-biolum transition-colors">{friend.name}</Link>
                                        <p className="text-xs text-ocean-text-dim truncate">@{friend.username || 'user'} {friend.location && `• ${friend.location}`}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/conversations?user_id=${friend.id}`} className="p-2 rounded-xl border border-ocean-border text-ocean-text-dim hover:text-biolum hover:border-biolum/50 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveFriend(friend.id)}
                                            className="p-2 rounded-xl border border-ocean-border text-ocean-text-dim hover:text-red-500 hover:border-red-500/50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove friend"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

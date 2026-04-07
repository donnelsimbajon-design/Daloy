import React, { useState, useRef } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/UI/Cards/PostCard';
import CreatePostModal from '@/Components/Features/Posts/CreatePostModal';
import axios from 'axios';

/* ── Stat Pill ──────────────────────────────────────────────────────────── */
function StatPill({ label, value }) {
    return (
        <button className="flex items-baseline gap-1.5 px-3 py-1 hover:opacity-70 transition-opacity">
            <span className="text-base font-bold text-ocean-text">{value ?? 0}</span>
            <span className="text-sm font-medium text-ocean-text-dim capitalize">{label}</span>
        </button>
    );
}

/* ── Icon helpers ───────────────────────────────────────────────────────── */
const CameraIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);

const SpinnerIcon = ({ className = "w-4 h-4" }) => (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);



export default function UserProfile() {
    const {
        profileUser, isSelf,
        isFollowing: initIsFollowing, followRequestSent: initFollowReq,
        friendshipStatus: initStatus, friendRequestId: initReqId,
        canViewProfile, posts, friends, schools,
        isBlocked: initIsBlocked, isBlockedBy,
    } = usePage().props;

    const [friendshipStatus, setFriendshipStatus] = useState(initStatus);
    const [friendRequestId, setFriendRequestId] = useState(initReqId);
    const [isFollowing, setIsFollowing] = useState(initIsFollowing);
    const [followRequested, setFollowRequested] = useState(initFollowReq);
    const [loading, setLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [blocked, setBlocked] = useState(initIsBlocked || false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const coverInputRef = useRef(null);
    const avatarInputRef = useRef(null);

    const [showMediaModal, setShowMediaModal] = useState(false);
    const [isEditingIntro, setIsEditingIntro] = useState(false);
    const [introData, setIntroData] = useState({
        bio: profileUser.bio || '',
        location: profileUser.location || '',
        about: profileUser.about || '',
    });

    // ── Friend actions ──────────────────────────────────────────────────
    const sendFriendRequest = async () => {
        setLoading('friend');
        try {
            const res = await axios.post('/api/friend-request/send', { receiver_id: profileUser.id });
            setFriendRequestId(res.data.request?.id);
            setFriendshipStatus('sent');
        } catch (e) { console.error(e); }
        setLoading(null);
    };
    const cancelFriendRequest = async () => {
        setLoading('friend');
        try {
            await axios.delete('/api/friend-request/cancel', { data: { request_id: friendRequestId } });
            setFriendshipStatus('none'); setFriendRequestId(null);
        } catch (e) { console.error(e); }
        setLoading(null);
    };
    const acceptFriendRequest = async () => {
        setLoading('friend');
        try {
            await axios.post('/api/friend-request/accept', { request_id: friendRequestId });
            setFriendshipStatus('friends');
        } catch (e) { console.error(e); }
        setLoading(null);
    };
    const removeFriend = async () => {
        if (!confirm(`Unfriend ${profileUser.name}?`)) return;
        setLoading('friend');
        try {
            await axios.delete('/api/friend/remove', { data: { friend_id: profileUser.id } });
            setFriendshipStatus('none');
        } catch (e) { console.error(e); }
        setLoading(null);
    };

    // ── Follow actions ──────────────────────────────────────────────────
    const handleFollow = async () => {
        setLoading('follow');
        try {
            const res = await axios.post('/api/follow', { user_id: profileUser.id });
            if (res.data.message?.includes('request')) setFollowRequested(true);
            else setIsFollowing(true);
        } catch (e) { console.error(e); }
        setLoading(null);
    };
    const handleUnfollow = async () => {
        setLoading('follow');
        try {
            await axios.delete('/api/unfollow', { data: { user_id: profileUser.id } });
            setIsFollowing(false); setFollowRequested(false);
        } catch (e) { console.error(e); }
        setLoading(null);
    };
    const handleMessage = () => router.visit(`/conversations?user_id=${profileUser.id}`);

    // ── Block actions ──────────────────────────────────────────────────
    const handleBlock = () => {
        if (!confirm(`Block ${profileUser.name}? They won't be able to see your profile, posts, or message you. Your friendship and follow connections will be removed.`)) return;
        setLoading('block');
        router.post(`/users/${profileUser.id}/block`, {}, {
            preserveScroll: true,
            onSuccess: () => { setBlocked(true); setShowMoreMenu(false); setFriendshipStatus('none'); setIsFollowing(false); },
            onFinish: () => setLoading(null),
        });
    };
    const handleUnblock = () => {
        setLoading('block');
        router.delete(`/users/${profileUser.id}/unblock`, {
            preserveScroll: true,
            onSuccess: () => { setBlocked(false); setShowMoreMenu(false); },
            onFinish: () => setLoading(null),
        });
    };

    const saveIntro = async () => {
        try {
            await axios.put(`/profile/${profileUser.id}/update-intro`, introData);
            setIsEditingIntro(false);
            router.reload({ only: ['profileUser'] });
        } catch (err) {
            console.error(err);
            alert('Failed to update intro. Please try again.');
        }
    };

    // ── Cover & Avatar upload ───────────────────────────────────────────
    const handleCoverChange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadingCover(true);
        const fd = new FormData(); fd.append('background_picture', file);
        try { await axios.post('/settings/background-picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); router.reload({ only: ['profileUser'] }); }
        catch (err) { console.error(err); }
        setUploadingCover(false);
    };
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadingAvatar(true);
        const fd = new FormData(); fd.append('profile_picture', file);
        try { await axios.post('/settings/profile-picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); router.reload({ only: ['profileUser'] }); }
        catch (err) { console.error(err); }
        setUploadingAvatar(false);
    };

    // ── Derived ─────────────────────────────────────────────────────────
    const avatarText = profileUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isPrivateAndLocked = profileUser.privacy_setting === 'private' && !canViewProfile;
    const tabs = [
        { id: 'posts', label: 'Feed', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
        { id: 'articles', label: 'Articles', icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25V8.625c0-.621.504-1.125 1.125-1.125H6.75' },
        { id: 'gallery', label: 'Gallery', icon: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 21h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12.75a2.25 2.25 0 002.25 2.25z' },
    ];
    const joinedDate = profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

    /* ── Render action buttons ───────────────────────────────────────── */
    const renderActions = () => {
        if (isSelf) return null; // Removed Edit Profile button as requested
        return (
            <div className="flex flex-wrap items-center gap-2">
                {/* Follow */}
                {!blocked && (isFollowing ? (
                    <button onClick={handleUnfollow} disabled={loading === 'follow'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-ocean-text-dim text-sm font-medium hover:text-ocean-text transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        {loading === 'follow' ? '...' : 'Following'}
                    </button>
                ) : followRequested ? (
                    <button onClick={handleUnfollow} disabled={loading === 'follow'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-ocean-text-dim text-sm font-medium hover:text-ocean-text transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {loading === 'follow' ? '...' : 'Pending'}
                    </button>
                ) : (
                    <button onClick={handleFollow} disabled={loading === 'follow'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-biolum text-white text-sm font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        {loading === 'follow' ? '...' : 'Follow'}
                    </button>
                ))}
                {/* Friend */}
                {!blocked && (friendshipStatus === 'friends' ? (
                    <button onClick={removeFriend} disabled={loading === 'friend'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-emerald-500 text-sm font-medium hover:border-rose-500/50 hover:text-rose-500 transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                        {loading === 'friend' ? '...' : 'Friends'}
                    </button>
                ) : friendshipStatus === 'sent' ? (
                    <button onClick={cancelFriendRequest} disabled={loading === 'friend'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-ocean-text-dim text-sm font-medium hover:text-ocean-text transition-colors disabled:opacity-50">
                        {loading === 'friend' ? '...' : 'Request Sent'}
                    </button>
                ) : friendshipStatus === 'received' ? (
                    <button onClick={acceptFriendRequest} disabled={loading === 'friend'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-biolum text-white text-sm font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-50">
                        {loading === 'friend' ? '...' : 'Accept Request'}
                    </button>
                ) : (
                    <button onClick={sendFriendRequest} disabled={loading === 'friend'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-ocean-text text-sm font-medium hover:bg-ocean-surface transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                        {loading === 'friend' ? '...' : 'Add Friend'}
                    </button>
                ))}
                {/* Message */}
                {!blocked && (
                    <button onClick={handleMessage} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-ocean-text text-sm font-medium hover:bg-ocean-surface transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                        Message
                    </button>
                )}
                {/* Blocked indicator */}
                {blocked && (
                    <button onClick={handleUnblock} disabled={loading === 'block'} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-ocean-border text-rose-400 text-sm font-medium hover:border-rose-500/50 transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        {loading === 'block' ? '...' : 'Unblock'}
                    </button>
                )}
                {/* More options menu */}
                <div className="relative">
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-xl border border-ocean-border text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                    </button>
                    {showMoreMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                            <div className="absolute right-0 top-14 w-52 bg-ocean-card border border-ocean-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                                {!blocked ? (
                                    <button onClick={handleBlock} disabled={loading === 'block'} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-all text-left">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        {loading === 'block' ? 'Blocking...' : `Block ${profileUser.name?.split(' ')[0]}`}
                                    </button>
                                ) : (
                                    <button onClick={handleUnblock} disabled={loading === 'block'} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ocean-text hover:bg-ocean-surface transition-all text-left">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                        {loading === 'block' ? 'Unblocking...' : `Unblock ${profileUser.name?.split(' ')[0]}`}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title={profileUser.name} />



            {/* ── ═══════ FULL-WIDTH HEADER ═══════ ── */}
            <div className="absolute top-0 left-0 w-full h-[200px] sm:h-[320px] md:h-[380px]">
                {profileUser.background_picture ? (
                    <img src={profileUser.background_picture} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-ocean-deep to-biolum/10"></div>
                )}
                {/* White gradient overlay as requested, merging with the page background */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ocean-deep via-ocean-deep/60 to-transparent" />
            </div>

            <div className="max-w-6xl mx-auto pt-[120px] sm:pt-[220px] md:pt-[260px] text-ocean-text px-4 relative z-10">
                
                {/* ── ═══════ CENTERED PROFILE INFO ═══════ ── */}
                <div className="flex flex-col items-center text-center -mt-16 sm:-mt-20">
                    {/* Avatar positioned "inside" the background */}
                    <div className="relative group/avatar">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ring-ocean-deep bg-ocean-card flex items-center justify-center text-ocean-text font-bold text-4xl overflow-hidden shadow-sm">
                            {profileUser.profile_picture
                                ? <img src={profileUser.profile_picture} alt={profileUser.name} className="w-full h-full object-cover" />
                                : <span className="text-ocean-text-dim">{avatarText}</span>}
                        </div>

                        {isSelf && (
                            <button onClick={() => setShowMediaModal(true)}
                                className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-biolum border-[3px] border-white flex items-center justify-center text-ocean-deep hover:bg-biolum-bright transition-all shadow-lg">
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Name */}
                    <div className="mt-6">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-ocean-text tracking-tight mb-1">
                            {profileUser.name}
                            {profileUser.privacy_setting === 'private' && (
                                <svg className="w-6 h-6 text-ocean-text-dim inline-block ml-2 -translate-y-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            )}
                        </h1>
                    </div>

                    {/* Bio */}
                    {profileUser.bio && (
                        <p className="mt-2 text-ocean-text font-medium text-[17px] leading-relaxed max-w-xl">
                            {profileUser.bio}
                        </p>
                    )}

                    {/* Stats Section with separators */}
                    <div className="w-full max-w-2xl mt-4">
                        <div className="flex items-center justify-center space-x-6">
                            <StatPill label="friends" value={profileUser.friend_count} />
                            <StatPill label="followers" value={profileUser.follower_count} />
                            <StatPill label="following" value={profileUser.following_count} />
                        </div>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                        <div className="mt-4">
                            {renderActions()}
                        </div>
                    )}
                    
                    {/* Tabs */}
                    <div className={`${isSelf ? 'mt-2' : 'mt-4'} flex items-center justify-center border-b border-ocean-border w-full py-1 gap-10`}>
                        {tabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative ${activeTab === tab.id
                                    ? 'text-ocean-text'
                                    : 'text-ocean-text-dim hover:text-ocean-text'
                                    }`}>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-ocean-text" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── ═══════ TAB CONTENT ═══════ ── */}
                <div className="mt-6 animate-[fadeIn_0.3s_ease-out]" key={activeTab}>
                    {isPrivateAndLocked ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-ocean-card/60 backdrop-blur border border-ocean-border rounded-2xl text-center px-6">
                            <div className="w-20 h-20 rounded-2xl bg-ocean-surface/60 flex items-center justify-center mb-5 rotate-6">
                                <svg className="w-10 h-10 text-ocean-text-dim -rotate-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h2 className="text-ocean-text font-bold text-xl">This account is private</h2>
                            <p className="text-ocean-text-dim text-sm mt-2 max-w-xs">Follow {profileUser.name} to see their posts, photos, and activity.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── POSTS ── */}
                            {activeTab === 'posts' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-20">
                                    {/* Sidebar - Sticky on Desktop */}
                                    <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start z-10">
                                        {/* Journalist Bio Card */}
                                        <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                            <h3 className="text-sm font-bold text-ocean-text mb-4">Bio</h3>
                                            
                                            {isEditingIntro ? (
                                                <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                                                    <div>
                                                        <label className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest mb-1 block">Bio</label>
                                                        <textarea 
                                                            value={introData.bio}
                                                            onChange={(e) => setIntroData({...introData, bio: e.target.value})}
                                                            className="w-full bg-ocean-surface border border-ocean-border rounded-xl p-3 text-sm text-ocean-text focus:ring-1 focus:ring-biolum/50 focus:border-biolum transition-all h-20 resize-none"
                                                            placeholder="Tell us about yourself..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest mb-1 block">Location</label>
                                                        <input 
                                                            type="text"
                                                            value={introData.location}
                                                            onChange={(e) => setIntroData({...introData, location: e.target.value})}
                                                            className="w-full bg-ocean-surface border border-ocean-border rounded-xl p-3 text-sm text-ocean-text focus:ring-1 focus:ring-biolum/50 focus:border-biolum transition-all"
                                                            placeholder="Where are you based?"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={saveIntro} className="flex-1 py-2.5 bg-biolum text-white font-bold text-xs rounded-xl hover:bg-biolum-bright transition-all">Save</button>
                                                        <button onClick={() => setIsEditingIntro(false)} className="flex-1 py-2.5 bg-ocean-surface border border-ocean-border text-ocean-text-dim font-bold text-xs rounded-xl hover:bg-ocean-card transition-all">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-ocean-text-muted leading-relaxed">
                                                        {profileUser.bio || 'Add a short bio to tell people more about you.'}
                                                    </p>
                                                    
                                                    {profileUser.location && (
                                                        <div className="flex items-center gap-2 text-sm text-ocean-text">
                                                            <svg className="w-4 h-4 text-biolum shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                                            <span className="font-medium">{profileUser.location}</span>
                                                        </div>
                                                    )}
                                                    {profileUser.website && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <svg className="w-4 h-4 text-biolum shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                                            <span className="text-biolum font-medium truncate">{profileUser.website}</span>
                                                        </div>
                                                    )}

                                                    {isSelf && (
                                                        <button onClick={() => setIsEditingIntro(true)} className="w-full mt-1 py-2.5 bg-ocean-surface border border-ocean-border rounded-xl text-xs font-bold text-ocean-text hover:bg-ocean-card hover:border-biolum/30 transition-all">Edit Details</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Friends Card */}
                                        <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-sm font-bold text-ocean-text">Friends</h3>
                                                    <span className="text-xs font-semibold text-ocean-text-dim">{profileUser.friend_count ?? 0}</span>
                                                </div>
                                                <button onClick={() => setActiveTab('friends')} className="text-xs font-bold text-biolum hover:text-biolum-bright transition-colors">View All</button>
                                            </div>
                                            
                                            <div className="grid grid-cols-4 gap-2">
                                                {friends && friends.length > 0 ? friends.slice(0, 8).map(friend => (
                                                    <Link key={friend.id} href={`/users/${friend.id}`} className="group text-center">
                                                        <div className="aspect-square rounded-xl bg-ocean-surface overflow-hidden border border-ocean-border group-hover:border-biolum/40 transition-all shadow-sm">
                                                            {friend.profile_picture ? (
                                                                <img src={friend.profile_picture} alt={friend.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-biolum/10 text-biolum font-bold text-xs">
                                                                    {friend.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="block text-[9px] font-bold text-ocean-text-dim truncate mt-1 group-hover:text-biolum transition-colors">{friend.name?.split(' ')[0]}</span>
                                                    </Link>
                                                )) : (
                                                    <div className="col-span-4 py-4 text-center">
                                                        <p className="text-[11px] font-bold text-ocean-text-dim">No friends yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Groups Joined */}
                                        {schools && schools.length > 0 && (
                                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                                <h3 className="text-sm font-bold text-ocean-text mb-4">Groups Joined</h3>
                                                <div className="space-y-2">
                                                    {schools.map((school, idx) => {
                                                        const colors = [
                                                            'bg-biolum text-white',
                                                            'bg-emerald-600 text-white',
                                                            'bg-violet-600 text-white',
                                                            'bg-amber-600 text-white',
                                                            'bg-rose-600 text-white',
                                                        ];
                                                        return (
                                                            <Link key={school.id} href={`/schools/${school.id}`} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${colors[idx % colors.length]} hover:opacity-90 hover:shadow-md transition-all group`}>
                                                                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                                                    {school.profile_image || school.cover_image ? (
                                                                        <img src={school.profile_image || school.cover_image} alt="" className="w-full h-full rounded-full object-cover" />
                                                                    ) : (
                                                                        school.name?.charAt(0)
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-bold truncate">{school.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Posts feed */}
                                    <div className="lg:col-span-2 space-y-4">
                                        {/* Post Composer - reference style */}
                                        {isSelf && (
                                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-4 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-ocean-surface overflow-hidden ring-1 ring-ocean-border flex items-center justify-center text-ocean-text font-bold text-sm shrink-0">
                                                        {profileUser.profile_picture ? <img src={profileUser.profile_picture} alt="" className="w-full h-full object-cover" /> : avatarText}
                                                    </div>
                                                    <button onClick={() => setShowCreatePost(true)} className="flex-1 text-left px-4 py-2.5 bg-transparent border border-ocean-border hover:border-biolum/50 rounded-xl text-sm text-ocean-text-dim transition-all">
                                                        Share a new voyage update...
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 mt-3 ml-[52px]">
                                                    <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ocean-text-dim hover:text-biolum hover:bg-biolum/8 transition-all text-xs font-bold">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                                                    </button>
                                                    <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ocean-text-dim hover:text-biolum hover:bg-biolum/8 transition-all text-xs font-bold">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                                    </button>
                                                    <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ocean-text-dim hover:text-biolum hover:bg-biolum/8 transition-all text-xs font-bold">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                                                    </button>
                                                    <div className="flex-1" />
                                                    <button onClick={() => setShowCreatePost(true)} className="px-5 py-2 bg-biolum text-white font-bold text-xs rounded-full hover:bg-biolum-bright transition-all shadow-sm">
                                                        Post
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : (
                                            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-ocean-border rounded-[20px] text-center">
                                                <div className="w-12 h-12 rounded-xl bg-ocean-surface flex items-center justify-center mb-4">
                                                    <svg className="w-6 h-6 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 21h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                                </div>
                                                <h3 className="text-base font-semibold text-ocean-text mb-1">No posts yet</h3>
                                                <p className="text-ocean-text-dim text-sm mb-5">Start sharing your world today.</p>
                                                {isSelf && <button onClick={() => setShowCreatePost(true)} className="px-5 py-2 bg-biolum text-ocean-deep font-semibold text-sm rounded-xl hover:bg-biolum-bright transition-all">Create Post</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── ARTICLES ── */}
                            {activeTab === 'articles' && (
                                <div className="max-w-3xl mx-auto space-y-5">
                                    {/* Featured article from about */}
                                    <div className="bg-ocean-card border border-ocean-border rounded-[20px] overflow-hidden shadow-sm relative">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-biolum/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                                        <div className="p-8 relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-xl font-bold text-ocean-text tracking-tight">About {profileUser.name?.split(' ')[0]}</h2>
                                                {isSelf && !isEditingIntro && (
                                                    <button onClick={() => setIsEditingIntro(true)} className="px-4 py-2 bg-biolum/10 text-biolum font-bold text-xs rounded-lg hover:bg-biolum/20 transition-all flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                                        Edit
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingIntro ? (
                                                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                                    <textarea 
                                                        value={introData.about}
                                                        onChange={(e) => setIntroData({...introData, about: e.target.value})}
                                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl p-4 text-sm text-ocean-text focus:ring-1 focus:ring-biolum/30 resize-none min-h-[160px]"
                                                        placeholder="Write something about yourself..."
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setIsEditingIntro(false)} className="px-4 py-2 text-ocean-text-dim font-bold text-xs rounded-lg hover:text-ocean-text transition-colors">Discard</button>
                                                        <button onClick={saveIntro} className="px-5 py-2 bg-biolum text-white font-bold text-xs rounded-lg hover:bg-biolum-bright transition-all">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-ocean-surface/50 border border-ocean-border rounded-2xl p-6 min-h-[120px]">
                                                    {profileUser.about ? (
                                                        <p className="text-sm text-ocean-text leading-[1.8] whitespace-pre-wrap">{profileUser.about}</p>
                                                    ) : (
                                                        <p className="text-sm text-ocean-text-dim italic">No article written yet. Share your story with the world.</p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 mt-6">
                                                <div className="p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:border-biolum/20 transition-all group">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-biolum/10 flex items-center justify-center text-biolum shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-ocean-text-dim mb-0.5">Location</p>
                                                            <p className="text-sm font-semibold text-ocean-text">{profileUser.location || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:border-biolum/20 transition-all group">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-ocean-text-dim mb-0.5">Joined</p>
                                                            <p className="text-sm font-semibold text-ocean-text">{joinedDate || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── GALLERY ── */}
                            {activeTab === 'gallery' && (
                                <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-6 shadow-sm">
                                    <h2 className="text-sm font-bold text-ocean-text mb-4">Gallery</h2>
                                    {posts.filter(p => p.media && p.media.length > 0).length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {posts.filter(p => p.media && p.media.length > 0).flatMap(post =>
                                                post.media.map((media, idx) => (
                                                    <div key={`${post.id}-${idx}`} className="aspect-square bg-ocean-surface rounded-xl overflow-hidden relative group border border-ocean-border hover:border-biolum/30 transition-all cursor-pointer shadow-sm">
                                                        {media.type === 'video' ? (
                                                            <video src={media.url} className="w-full h-full object-cover" muted />
                                                        ) : (
                                                            <img src={media.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                                                            <div className="flex gap-3 text-white text-[10px] font-bold">
                                                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>{post.reactions_count ?? 0}</span>
                                                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>{post.comments_count ?? 0}</span>
                                                                {media.type === 'video' && <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] uppercase">Video</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 21h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                            </div>
                                            <p className="text-ocean-text-dim text-sm font-medium">No photos or videos shared yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── ═══════ MEDIA EDIT MODAL ═══════ ── */}
            {showMediaModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.2s_ease-out]">
                    <div className="absolute inset-0 bg-ocean-deep/60 backdrop-blur-md" onClick={() => setShowMediaModal(false)} />
                    
                    <div className="relative bg-ocean-card border border-ocean-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-ocean-text tracking-tight">Edit Media</h2>
                            <button onClick={() => setShowMediaModal(false)} className="w-10 h-10 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text-dim hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 pt-4 space-y-10">
                            {/* Profile Picture Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-ocean-text ml-2">Profile Picture</h3>
                                <div className="flex items-center gap-8 bg-ocean-surface/40 p-6 rounded-3xl border border-ocean-border/50">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-1 ring-ocean-border bg-ocean-card shrink-0">
                                        {profileUser.profile_picture 
                                            ? <img src={profileUser.profile_picture} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-ocean-text-dim bg-ocean-surface">{avatarText}</div>}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-sm text-ocean-text-dim leading-relaxed">Your profile picture is the face of your profile. Make sure it represents you well!</p>
                                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                                            className="px-5 py-2.5 bg-biolum text-ocean-deep font-semibold text-sm rounded-xl transition-all flex items-center gap-2 hover:bg-biolum-bright w-fit">
                                            {uploadingAvatar ? <SpinnerIcon /> : <CameraIcon className="w-4 h-4" />}
                                            {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Photo Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-ocean-text ml-2">Cover Photo</h3>
                                <div className="space-y-4 bg-ocean-surface/40 p-6 rounded-3xl border border-ocean-border/50">
                                    <div className="relative h-32 sm:h-40 w-full rounded-2xl overflow-hidden bg-ocean-deep border border-ocean-border/60 shadow-inner">
                                        {profileUser.background_picture 
                                            ? <img src={profileUser.background_picture} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full bg-gradient-to-br from-ocean-deep to-biolum/10" />}
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm text-ocean-text-dim flex-1">This appears at the top of your profile as a full-width banner.</p>
                                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                                        <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                                            className="px-5 py-2.5 bg-ocean-card border border-ocean-border text-ocean-text font-medium text-sm rounded-xl hover:bg-ocean-surface transition-all flex items-center gap-2 shrink-0">
                                            {uploadingCover ? <SpinnerIcon /> : <CameraIcon className="w-4 h-4" />}
                                            {uploadingCover ? 'Uploading...' : 'Change Cover'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 pt-0 flex justify-end">
                            <button onClick={() => setShowMediaModal(false)} className="px-8 py-3 bg-biolum text-ocean-deep font-semibold rounded-xl hover:bg-biolum-bright transition-all flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
        </MainLayout>
    );
}

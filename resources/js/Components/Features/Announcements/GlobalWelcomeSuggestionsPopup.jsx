import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { X, Users, Compass, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function GlobalWelcomeSuggestionsPopup() {
    const { auth, reef } = usePage().props;
    const user = auth?.user;
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);
    const [followingUsers, setFollowingUsers] = useState({});
    const [friendingUsers, setFriendingUsers] = useState({});
    const [joiningGroups, setJoiningGroups] = useState({});
    
    // Track successful actions permanently during this session
    const [successFollows, setSuccessFollows] = useState({});
    const [successFriends, setSuccessFriends] = useState({});
    const [successGroups, setSuccessGroups] = useState({});

    useEffect(() => {
        if (!user || user.role === 'admin' || user.role === 'moderator') return;
        const userCreated = new Date(user.created_at);
        const fortyEightHoursAgo = new Date(Date.now() - (48 * 60 * 60 * 1000));
        const isNewUser = userCreated > fortyEightHoursAgo;
        if (!isNewUser) return;

        const hasSeen = localStorage.getItem(`daloy_welcome_shown_${user.id}`);
        if (!hasSeen) {
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    if (!show || !user) return null;

    const friends = reef?.suggested_friends || [];
    const groups = reef?.suggested_groups || [];

    if (friends.length === 0 && groups.length === 0) return null;

    const groupColors = ['bg-amber-600', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600', 'bg-cyan-600'];

    const handleDismiss = () => {
        localStorage.setItem(`daloy_welcome_shown_${user.id}`, 'true');
        setShow(false);
    };

    const handleFollow = async (userId) => {
        setFollowingUsers(prev => ({ ...prev, [userId]: true }));
        try {
            await axios.post('/api/follow', { user_id: userId });
            setSuccessFollows(prev => ({ ...prev, [userId]: true }));
        } catch (err) {
            console.error(err);
        } finally {
            setFollowingUsers(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleFriendRequest = async (userId) => {
        setFriendingUsers(prev => ({ ...prev, [userId]: true }));
        try {
            await axios.post('/api/friend-request/send', { receiver_id: userId });
            setSuccessFriends(prev => ({ ...prev, [userId]: true }));
        } catch (err) {
            console.error(err);
        } finally {
            setFriendingUsers(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleJoinGroup = async (groupId) => {
        setJoiningGroups(prev => ({ ...prev, [groupId]: true }));
        try {
            await axios.post(`/schools/${groupId}/toggle-membership`);
            setSuccessGroups(prev => ({ ...prev, [groupId]: true }));
            router.reload({ only: ['reef'] });
        } catch (err) {
            console.error(err);
        } finally {
            setJoiningGroups(prev => ({ ...prev, [groupId]: false }));
        }
    };

    const isStep1 = step === 1 && friends.length > 0;
    const isStep2 = step === 2 || (step === 1 && friends.length === 0);

    const handleNext = () => {
        if (isStep1 && groups.length > 0) {
            setStep(2);
        } else {
            handleDismiss();
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
            padding: '16px',
            animation: 'welcomeFadeIn 0.4s ease-out',
        }}>
            <style>{`
                @keyframes welcomeFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes welcomeSlideUp { from { opacity:0; transform:scale(0.95) translateY(30px) } to { opacity:1; transform:scale(1) translateY(0) } }
            `}</style>
            
            <div style={{
                width: '100%', maxWidth: 500,
                maxHeight: '90dvh',
                borderRadius: 24, overflow: 'hidden',
                background: 'linear-gradient(180deg, #111116 0%, #0a0a0d 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                animation: 'welcomeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
            }}>
                <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    position: 'relative', zIndex: 1,
                }}>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
                            {isStep1 ? `Welcome, ${user.name.split(' ')[0]}` : 'Find Your Community'}
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, maxWidth: '90%' }}>
                            {isStep1 ? 'Connect with other voyagers to start flowing.' : 'Join groups to share and discover content.'}
                        </p>
                    </div>
                    
                    <button onClick={handleDismiss} style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', flexShrink: 0,
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        <X size={18} color="rgba(255,255,255,0.7)" />
                    </button>
                </div>
                
                {/* Content area */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '24px 28px',
                    display: 'flex', flexDirection: 'column', gap: 24,
                }}>
                    {isStep1 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={16} color="#a78bfa" />
                                </div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested Voyagers</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {friends.slice(0, 5).map((friend, i) => (
                                    <div key={friend.id} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2"
                                        style={{
                                        padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, width: '100%' }}>
                                            {friend.profile_picture ? (
                                                <img src={friend.profile_picture} alt={friend.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div className={groupColors[i % groupColors.length]} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                                                    {friend.initial}
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.name}</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.username}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 sm:ml-2 sm:shrink-0 w-full sm:w-auto">
                                            <button 
                                                onClick={() => handleFriendRequest(friend.id)}
                                                disabled={friendingUsers[friend.id] || successFriends[friend.id]}
                                                className="flex-1 sm:flex-none"
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                                                    padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: successFriends[friend.id] ? 0.5 : 1
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            >
                                                {successFriends[friend.id] ? 'Requested' : (friendingUsers[friend.id] ? 'Sending...' : 'Add Friend')}
                                            </button>
                                            <button 
                                                onClick={() => handleFollow(friend.id)}
                                                disabled={followingUsers[friend.id] || successFollows[friend.id]}
                                                className="flex-1 sm:flex-none"
                                                style={{
                                                    background: '#fff', color: '#0A0A0D', border: 'none', borderRadius: 20,
                                                    padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    opacity: successFollows[friend.id] ? 0.5 : 1
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                            >
                                                {successFollows[friend.id] ? 'Following' : (followingUsers[friend.id] ? 'Wait...' : 'Follow')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {isStep2 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Compass size={16} color="#34d399" />
                                </div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested Groups</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {groups.slice(0, 5).map((group, i) => (
                                    <div key={group.id} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2"
                                        style={{
                                        padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, width: '100%' }}>
                                            {group.profile_image ? (
                                                <img src={group.profile_image} alt={group.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
                                            ) : (
                                                <div className={groupColors[(i+3) % groupColors.length]} style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                                                    {group.initial}
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.members} members</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleJoinGroup(group.id)}
                                            disabled={joiningGroups[group.id] || successGroups[group.id]}
                                            className="w-full sm:w-auto sm:ml-2 sm:shrink-0"
                                            style={{
                                                background: '#fff', color: '#000', border: 'none', borderRadius: 20,
                                                padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                opacity: successGroups[group.id] ? 0.5 : 1
                                            }}
                                        >
                                            {successGroups[group.id] ? 'Joined' : (joiningGroups[group.id] ? 'Joining...' : 'Join')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isStep1 ? '#fff' : 'rgba(255,255,255,0.2)' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isStep2 ? '#fff' : 'rgba(255,255,255,0.2)', display: groups.length === 0 ? 'none' : 'block' }} />
                    </div>
                    
                    <button onClick={handleNext} style={{
                        background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 24,
                        padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s',
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        {isStep1 ? 'Skip / Next' : 'Dive In'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import NavDrawer, { WavyBurgerIcon } from '@/Components/UI/Navigation/NavDrawer';
import { useLanguage } from '@/Contexts/LanguageContext';
import { useCurrents } from '@/Contexts/CurrentsContext';
import axios from 'axios';

export default function TopNav() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { t } = useLanguage();
    const { auth } = usePage().props;
    const user = auth?.user;
    const searchTimeout = useRef(null);
    const profileRef = useRef(null);
    const dropdownRef = useRef(null);
    const [liveResults, setLiveResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Notification state
    const { social } = usePage().props;
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifSearch, setNotifSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const notifRef = useRef(null);
    const notifications = social?.recent_notifications || [];
    const unreadNotifCount = (social?.unread_notifications || 0) + (social?.pending_friend_requests || 0) + (social?.pending_follow_requests || 0);

    // Update notification and message badges in visible tabs.
    // Polling is a fallback until a push/WebSocket transport is configured.
    useEffect(() => {
        if (!user?.id) return;
        let pending = false;
        const refreshSocial = () => {
            if (document.visibilityState !== 'visible' || pending) return;
            pending = true;
            router.reload({
                only: ['social'],
                preserveState: true,
                preserveScroll: true,
                onFinish: () => { pending = false; },
            });
        };
        const interval = window.setInterval(refreshSocial, 8000);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') refreshSocial();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [user?.id]);

    // Dark mode state
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return user?.dark_mode || false;
    });

    // Currents context for stopping music on logout
    const currentsCtx = useCurrents();

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        clearTimeout(searchTimeout.current);

        if (value.trim()) {
            setShowDropdown(true);
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const res = await axios.get(`/api/search?q=${encodeURIComponent(value.trim())}`);
                    setLiveResults(res.data);
                } catch (err) {
                    console.error("Live search failed:", err);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setLiveResults(null);
            setShowDropdown(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
        if (searchQuery.trim()) {
            clearTimeout(searchTimeout.current);
            router.visit(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        setIsProfileOpen(false);
        // Stop music playback before logging out
        if (currentsCtx?.isInSession) {
            try { await currentsCtx.leaveSession(); } catch (e) { console.error(e); }
        }
        router.post('/logout');
    };

    const toggleTheme = () => {
        const root = document.documentElement;
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.removeAttribute('data-theme');
        }
        // Persist to server
        axios.patch('/settings/accessibility', { dark_mode: newDark }).catch(console.error);
    };

    return (
        <>
            <nav className="daloy-topnav fixed top-0 left-0 right-0 z-40 bg-ocean-deep border-b border-ocean-divider shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 relative w-full">

                        {/* Logo & Burger (Left Corner) */}
                        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="p-2 rounded-xl text-ocean-text group hover:bg-ocean-surface transition-colors focus:outline-none"
                                aria-label="Open menu"
                                aria-expanded={isDrawerOpen}
                                id="topnav-burger-btn"
                            >
                                <WavyBurgerIcon isOpen={isDrawerOpen} />
                            </button>

                            <Link href="/" className="flex items-center gap-0 group">
                                <span className="text-2xl sm:text-3xl font-medium text-ocean-text tracking-wide group-hover:opacity-80 transition-colors ml-1 sm:ml-2" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</span>
                            </Link>
                        </div>

                        {/* Search Bar — desktop (Perfectly Centered) with Live Dropdown */}
                        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-[min(36vw,28rem)] max-w-md transition-all" ref={dropdownRef}>
                            <form onSubmit={handleSearchSubmit} className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                                <input
                                    id="topnav-search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    onFocus={() => { if (searchQuery.trim() && liveResults) setShowDropdown(true); }}
                                    placeholder={t('Maghanap sa alon...')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-ocean-surface/60 border border-ocean-border rounded-full text-sm text-ocean-text placeholder-ocean-text-dim/50 focus:outline-none focus:bg-ocean-surface transition-all font-medium"
                                />
                            </form>

                            {/* Live Search Dropdown */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-ocean-card border border-ocean-border rounded-2xl max-h-[80vh] overflow-y-auto z-50" style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm text-ocean-text-dim animate-pulse">Searching...</div>
                                    ) : liveResults ? (() => {
                                        const hasPeople = liveResults.people?.length > 0;
                                        const hasPosts = liveResults.posts?.length > 0;
                                        const hasSchools = liveResults.schools?.length > 0;
                                        const hasHashtags = liveResults.hashtags?.length > 0;
                                        const hasAny = hasPeople || hasPosts || hasSchools || hasHashtags;

                                        return (
                                        <div className="p-2 space-y-3">
                                            {hasPeople && (
                                                <div>
                                                    <h3 className="px-2 pb-1 text-[10px] font-bold text-ocean-text-dim uppercase tracking-wider">People</h3>
                                                    {liveResults.people.slice(0, 4).map(u => (
                                                        <Link key={u.id} href={`/users/${u.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ocean-surface/50 transition-colors" onClick={() => setShowDropdown(false)}>
                                                            {u.profile_picture ? (
                                                                <img src={u.profile_picture} alt={u.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-ocean-border" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-ocean-text truncate">{u.name}</p>
                                                                <p className="text-[11px] text-ocean-text-dim truncate">@{u.username}{u.is_friend ? ' · Friend' : u.is_following ? ' · Following' : ''}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {hasPosts && (
                                                <div>
                                                    <h3 className="px-2 pb-1 text-[10px] font-bold text-ocean-text-dim uppercase tracking-wider">Posts</h3>
                                                    {liveResults.posts.slice(0, 3).map(p => (
                                                        <Link key={p.id} href={`/posts/${p.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ocean-surface/50 transition-colors" onClick={() => setShowDropdown(false)}>
                                                            {p.media?.[0]?.url ? (
                                                                <img src={p.media[0].url} alt="" className="w-9 h-9 rounded-lg object-cover ring-1 ring-ocean-border" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-ocean-surface flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs text-ocean-text line-clamp-1">{p.content?.substring(0, 60) || 'Post'}</p>
                                                                <p className="text-[10px] text-ocean-text-dim">{p.user?.name} · {p.reactions_count || 0} reactions</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {hasHashtags && (
                                                <div>
                                                    <h3 className="px-2 pb-1 text-[10px] font-bold text-ocean-text-dim uppercase tracking-wider">Tags</h3>
                                                    <div className="flex flex-wrap gap-1.5 px-2">
                                                        {liveResults.hashtags.slice(0, 5).map(tag => (
                                                            <Link key={tag.id} href={`/hashtag/${tag.name.replace('#', '')}`} className="px-3 py-1.5 bg-ocean-surface/50 border border-ocean-border rounded-full text-xs font-bold text-biolum hover:bg-biolum/15 transition-colors" onClick={() => setShowDropdown(false)}>
                                                                {tag.name} <span className="text-ocean-text-dim font-normal ml-1">{tag.posts_count}</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {hasSchools && (
                                                <div>
                                                    <h3 className="px-2 pb-1 text-[10px] font-bold text-ocean-text-dim uppercase tracking-wider">Groups</h3>
                                                    {liveResults.schools.slice(0, 2).map(s => (
                                                        <Link key={s.id} href={`/schools/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ocean-surface/50 transition-colors" onClick={() => setShowDropdown(false)}>
                                                            {s.profile_image ? (
                                                                <img src={`/storage/${s.profile_image}`} alt={s.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-ocean-border" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">#</div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-ocean-text truncate">{s.name}</p>
                                                                <p className="text-[11px] text-ocean-text-dim">{s.members_count} members</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="border-t border-ocean-border/50 pt-1">
                                                {hasAny ? (
                                                    <button onClick={handleSearchSubmit} className="w-full flex items-center justify-center gap-2 text-sm text-biolum hover:bg-ocean-surface/30 p-2.5 rounded-lg font-bold transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                                                        See all results for "{searchQuery}"
                                                    </button>
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-ocean-text-dim">No results for "{searchQuery}"</div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })() : null}
                                </div>
                            )}
                        </div>

                        {/* Mobile Search Overlay Toggle */}
                        {isMobileSearchOpen && (
                            <div className="lg:hidden absolute inset-x-0 top-0 h-16 bg-ocean-deep z-50 flex items-center px-4 animate-in slide-in-from-top duration-300">
                                <form onSubmit={handleSearchSubmit} className="flex-1 mr-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        placeholder={t('Search...')}
                                        className="w-full pl-4 pr-10 py-2 bg-ocean-surface border border-ocean-border rounded-full text-sm text-ocean-text focus:outline-none"
                                    />
                                </form>
                                <button onClick={() => setIsMobileSearchOpen(false)} className="text-ocean-text-dim text-xs font-bold uppercase tracking-wider">Cancel</button>
                            </div>
                        )}

                        {/* Right Icons (Pushed to the Far Right) */}
                        <div className="flex items-center gap-0 sm:gap-2 ml-auto shrink-0">
                            {/* Mobile Search Button */}
                            <button
                                onClick={() => setIsMobileSearchOpen(true)}
                                className="lg:hidden p-2.5 text-ocean-text-muted hover:text-ocean-text"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                            </button>

                            {/* Dark / Light Mode Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface/50 transition-colors"
                                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                id="topnav-theme-btn"
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                )}
                            </button>

                            {/* Notification Bell */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => {
                                        setIsNotifOpen(!isNotifOpen);
                                        if (!isNotifOpen && social?.unread_notifications > 0) {
                                            axios.post('/api/ripples/mark-all-read').then(() => {
                                                router.reload({ only: ['social'] });
                                            }).catch(console.error);
                                        }
                                    }}
                                    className={`p-2.5 rounded-xl transition-colors relative ${isNotifOpen ? 'text-biolum bg-biolum/10' : 'text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface/50'}`}
                                    id="topnav-notif-btn"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                    {unreadNotifCount > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-1rem)] max-h-[80vh] bg-ocean-deep border border-ocean-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out] topnav-notif-dropdown">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-ocean-divider-subtle flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-biolum/15 flex items-center justify-center">
                                                    <svg className="w-3.5 h-3.5 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-sm font-bold text-ocean-text">Notifications</h3>
                                            </div>
                                        </div>

                                        {/* Search */}
                                        <div className="px-3 py-2 border-b border-ocean-divider-subtle">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="w-3.5 h-3.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={notifSearch}
                                                    onChange={(e) => setNotifSearch(e.target.value)}
                                                    placeholder="Search activity..."
                                                    className="w-full pl-9 h-8 bg-ocean-surface/50 border border-ocean-border/60 rounded-lg text-xs text-ocean-text placeholder-ocean-text-dim/50 focus:outline-none focus:border-biolum/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Notification Items */}
                                        <div className="overflow-y-auto max-h-[60vh] p-2 space-y-0.5">
                                            {(() => {
                                                const typeColors = {
                                                    friend: 'bg-blue-500', follow: 'bg-emerald-500', like: 'bg-rose-500',
                                                    story_like: 'bg-rose-500', story_reply: 'bg-emerald-600',
                                                    comment: 'bg-amber-500', share: 'bg-purple-500', mention: 'bg-cyan-500',
                                                };
                                                const filtered = notifications.filter(n =>
                                                    (n.user || '').toLowerCase().includes(notifSearch.toLowerCase()) ||
                                                    (n.action || '').toLowerCase().includes(notifSearch.toLowerCase())
                                                );

                                                const handleAction = async (e, type, rawId) => {
                                                    e.stopPropagation();
                                                    setActionLoading(rawId);
                                                    try {
                                                        if (rawId.startsWith('fr_')) {
                                                            const id = rawId.replace('fr_', '');
                                                            if (type === 'accept') await axios.post('/api/friend-request/accept', { request_id: id });
                                                            else await axios.post('/api/friend-request/reject', { request_id: id });
                                                        } else if (rawId.startsWith('flr_')) {
                                                            const id = rawId.replace('flr_', '');
                                                            if (type === 'accept') await axios.post('/api/follow-request/accept', { request_id: id });
                                                            else await axios.post('/api/follow-request/reject', { request_id: id });
                                                        }
                                                        router.reload({ only: ['social'] });
                                                    } catch (error) { console.error(error); }
                                                    finally { setActionLoading(null); }
                                                };

                                                const navigateToTarget = (notif) => {
                                                    setIsNotifOpen(false);
                                                    if (['reaction', 'comment', 'share', 'mention'].includes(notif.type) && notif.data?.post_id) {
                                                        router.visit(`/posts/${notif.data.post_id}`);
                                                    } else if (notif.user_id) {
                                                        router.visit(`/users/${notif.user_id}`);
                                                    }
                                                };

                                                if (filtered.length === 0) return (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                        <svg className="w-10 h-10 text-ocean-text-dim mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                                                        <p className="text-xs text-ocean-text-dim">{notifSearch ? `No activity matching "${notifSearch}"` : 'No notifications yet.'}</p>
                                                    </div>
                                                );

                                                return filtered.map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => navigateToTarget(notif)}
                                                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${notif.is_unread ? 'bg-biolum/10' : 'hover:bg-ocean-surface/30'}`}
                                                    >
                                                        <div className="relative shrink-0 flex items-center gap-2">
                                                            <div className="relative">
                                                                {notif.avatar ? (
                                                                    <img src={notif.avatar} alt={notif.user} className="w-8 h-8 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className={`w-8 h-8 flex justify-center items-center rounded-full ${typeColors[notif.type] || 'bg-biolum'}`} />
                                                                )}
                                                                {notif.is_unread && (
                                                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-biolum border-2 border-ocean-card rounded-full" />
                                                                )}
                                                            </div>
                                                            {(notif.type === 'story_like' || notif.type === 'story_reply') && notif.data?.story_image && (
                                                                <div className="w-8 h-10 rounded overflow-hidden shadow-sm shrink-0 bg-black/20">
                                                                    <img src={notif.data.story_image} alt="Story" className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-xs leading-relaxed ${notif.is_unread ? 'text-ocean-text font-medium' : 'text-ocean-text-dim/90'}`}>
                                                                <span className="font-bold text-ocean-text">{notif.user}</span>{' '}
                                                                {notif.action}
                                                            </p>
                                                            <p className={`text-[10px] mt-0.5 ${notif.is_unread ? 'text-biolum font-medium' : 'text-ocean-text-dim'}`}>{notif.time}</p>
                                                            {notif.type === 'friend' && (
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    <button onClick={(e) => handleAction(e, 'accept', notif.id)} disabled={actionLoading === notif.id} className="px-3 py-1 bg-biolum text-white text-[11px] font-medium rounded hover:bg-biolum-bright transition-colors disabled:opacity-50">{actionLoading === notif.id ? '...' : 'Accept'}</button>
                                                                    <button onClick={(e) => handleAction(e, 'decline', notif.id)} disabled={actionLoading === notif.id} className="px-3 py-1 bg-transparent border border-ocean-border text-ocean-text-muted text-[11px] font-medium rounded hover:bg-ocean-surface transition-colors disabled:opacity-50">Decline</button>
                                                                </div>
                                                            )}
                                                            {notif.type === 'follow' && (
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    <button onClick={(e) => handleAction(e, 'accept', notif.id)} disabled={actionLoading === notif.id} className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-medium rounded hover:bg-emerald-700 transition-colors disabled:opacity-50">{actionLoading === notif.id ? '...' : 'Accept'}</button>
                                                                    <button onClick={(e) => handleAction(e, 'decline', notif.id)} disabled={actionLoading === notif.id} className="px-3 py-1 bg-transparent border border-ocean-border text-ocean-text-muted text-[11px] font-medium rounded hover:bg-ocean-surface transition-colors disabled:opacity-50">Decline</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Avatar + Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 ml-1 focus:outline-none group cursor-pointer"
                                    id="topnav-profile-trigger"
                                >
                                    <div className="text-right hidden lg:block">
                                        <p className="text-sm font-bold text-ocean-text leading-tight group-hover:opacity-80 transition-opacity tracking-[-0.01em]">{user?.name || 'Guest'}</p>
                                        <p className="text-[11px] text-ocean-text-dim font-medium">{t('Pro Manlalakbay')}</p>
                                    </div>
                                    <div
                                        id="topnav-profile-avatar"
                                        className={`w-9 h-9 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text font-bold text-sm ring-2 transition-all overflow-hidden shadow-sm ${isProfileOpen ? 'ring-biolum' : 'ring-transparent hover:ring-ocean-border'}`}
                                    >
                                        {user?.profile_picture
                                            ? <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                            : (user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?')
                                        }
                                    </div>
                                    {/* Chevron */}
                                    <svg className={`w-3.5 h-3.5 text-ocean-text-dim transition-transform duration-200 hidden lg:block ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-ocean-card/80 border border-ocean-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                                        {/* User Info Header */}
                                        <div className="px-4 py-3.5 border-b border-ocean-divider-subtle bg-ocean-surface/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text font-bold text-sm overflow-hidden ring-2 ring-biolum/20">
                                                    {user?.profile_picture
                                                        ? <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                                        : (user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?')
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-ocean-text truncate">{user?.name}</p>
                                                    <p className="text-[11px] text-ocean-text-dim">@{user?.username}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-1.5">
                                            <Link
                                                href={user ? `/users/${user.id}` : '#'}
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ocean-text hover:bg-ocean-surface/50 transition-colors"
                                            >
                                                <svg className="w-4.5 h-4.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                </svg>
                                                <span className="font-medium">My Profile</span>
                                            </Link>

                                            <Link
                                                href="/settings"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ocean-text hover:bg-ocean-surface/50 transition-colors"
                                            >
                                                <svg className="w-4.5 h-4.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                                <span className="font-medium">Settings</span>
                                            </Link>

                                            <Link
                                                href="/bookmarks"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ocean-text hover:bg-ocean-surface/50 transition-colors"
                                            >
                                                <svg className="w-4.5 h-4.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                                </svg>
                                                <span className="font-medium">Bookmarks</span>
                                            </Link>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-ocean-divider-subtle mx-3" />

                                        {/* Logout */}
                                        <div className="py-1.5">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors w-full text-left"
                                            >
                                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                                </svg>
                                                <span className="font-medium">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Nav Drawer */}
            <NavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
}


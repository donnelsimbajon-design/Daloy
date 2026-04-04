import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import NavDrawer, { WavyBurgerIcon } from '@/Components/UI/Navigation/NavDrawer';
import { useLanguage } from '@/Contexts/LanguageContext';
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

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
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
        router.post('/logout');
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 bg-ocean-card border-b border-ocean-divider shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]" style={{ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}>
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 relative w-full">

                        {/* Logo & Burger (Left Corner) */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="p-2 rounded-xl text-ocean-text group hover:bg-ocean-surface transition-colors focus:outline-none"
                                aria-label="Open menu"
                                id="topnav-burger-btn"
                            >
                                <WavyBurgerIcon isOpen={isDrawerOpen} />
                            </button>

                            <Link href="/" className="flex items-center gap-0 group">
                                <span className="text-3xl font-medium text-ocean-text tracking-wide group-hover:opacity-80 transition-colors ml-2" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</span>
                            </Link>
                        </div>

                        {/* Search Bar — desktop (Perfectly Centered) with Live Dropdown */}
                        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-md transition-all" ref={dropdownRef}>
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
                            <div className="md:hidden absolute inset-x-0 top-0 h-16 bg-ocean-deep z-50 flex items-center px-4 animate-in slide-in-from-top duration-300">
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
                        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                            {/* Mobile Search Button */}
                            <button
                                onClick={() => setIsMobileSearchOpen(true)}
                                className="md:hidden p-2.5 text-ocean-text-muted hover:text-ocean-text"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                            </button>

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
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-ocean-card border border-ocean-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
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


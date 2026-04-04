import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import NavDrawer, { WavyBurgerIcon } from '@/Components/NavDrawer';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function TopNav() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [liveResults, setLiveResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { t } = useLanguage();
    const { auth } = usePage().props;
    const user = auth?.user;
    const searchTimeout = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 bg-ocean-deep/95 backdrop-blur-md border-b border-ocean-divider shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.015)]">
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

                        {/* Search Bar — desktop (Perfectly Centered) */}
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
                                    onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
                                    placeholder={t('Maghanap sa alon...')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-ocean-surface border border-ocean-border rounded-full text-sm text-ocean-text placeholder-ocean-text-dim/60 focus:outline-none focus:border-opacity-50 transition-all font-medium"
                                />
                            </form>

                            {/* Dropdown Results */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-ocean-deep/95 backdrop-blur-md border border-ocean-border rounded-xl shadow-lg max-h-[80vh] overflow-y-auto z-50">
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
                                            {/* People */}
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

                                            {/* Posts */}
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

                                            {/* Hashtags */}
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
                                            
                                            {/* Schools */}
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

                                            {/* Divider + See All */}
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

                            {/* Profile Avatar */}
                            <div className="flex items-center gap-3 ml-1">
                                <Link href={user ? `/users/${user.id}` : '#'} className="text-right hidden lg:block group">
                                    <p className="text-sm font-bold text-ocean-text leading-tight group-hover:opacity-80 transition-opacity tracking-[-0.01em]">{user?.name || 'Guest'}</p>
                                    <p className="text-[11px] text-ocean-text-dim font-medium">{t('Pro Manlalakbay')}</p>
                                </Link>
                                <Link
                                    href={user ? `/users/${user.id}` : '#'}
                                    id="topnav-profile-avatar"
                                    className="w-9 h-9 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text font-bold text-sm ring-2 ring-transparent hover:ring-ocean-border transition-all overflow-hidden shadow-sm"
                                >
                                    {user?.profile_picture
                                        ? <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                        : (user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?')
                                    }
                                </Link>
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

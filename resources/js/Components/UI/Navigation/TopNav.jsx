import React, { useState, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import NavDrawer, { WavyBurgerIcon } from '@/Components/UI/Navigation/NavDrawer';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function TopNav() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const { t } = useLanguage();
    const { auth } = usePage().props;
    const user = auth?.user;
    const searchTimeout = useRef(null);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        clearTimeout(searchTimeout.current);
        if (value.trim()) {
            searchTimeout.current = setTimeout(() => {
                router.visit(`/voyagers?q=${encodeURIComponent(value.trim())}`);
            }, 500);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            clearTimeout(searchTimeout.current);
            router.visit(`/voyagers?q=${encodeURIComponent(searchQuery.trim())}`);
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
                        <form onSubmit={handleSearchSubmit} className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-md transition-all">
                            <div className="relative w-full">
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
                                    placeholder={t('Maghanap sa alon...')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-ocean-surface border border-ocean-border rounded-full text-sm text-ocean-text placeholder-ocean-text-dim/60 focus:outline-none focus:border-opacity-50 transition-all font-medium"
                                />
                            </div>
                        </form>

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

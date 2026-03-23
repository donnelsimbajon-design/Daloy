import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';

// Wavy burger icon — three animated wave lines
function WavyBurgerIcon({ isOpen }) {
    return (
        <svg
            width="24"
            height="20"
            viewBox="0 0 24 20"
            fill="none"
            className="text-biolum transition-all duration-300"
        >
            {/* Top wave */}
            <path
                d={isOpen
                    ? "M4 10L20 10"
                    : "M1 3C3 1 5 5 7 3C9 1 11 5 13 3C15 1 17 5 19 3C21 1 23 3 23 3"
                }
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-all duration-300 origin-center ${isOpen ? 'translate-y-0 rotate-45' : ''}`}
            />
            {/* Middle wave */}
            <path
                d={isOpen
                    ? "M4 10L20 10"
                    : "M1 10C3 8 5 12 7 10C9 8 11 12 13 10C15 8 17 12 19 10C21 8 23 10 23 10"
                }
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100'}`}
            />
            {/* Bottom wave */}
            <path
                d={isOpen
                    ? "M4 10L20 10"
                    : "M1 17C3 15 5 19 7 17C9 15 11 19 13 17C15 15 17 19 19 17C21 15 23 17 23 17"
                }
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-all duration-300 origin-center ${isOpen ? 'translate-y-0 -rotate-45' : ''}`}
            />
        </svg>
    );
}

export default function NavDrawer({ isOpen, onClose }) {
    const drawerRef = useRef(null);
    const { url } = usePage();
    const { t } = useLanguage();
    const user = usePage().props?.auth?.user;

    const handleLogout = () => {
        router.post('/logout');
    };

    const navItems = [
        {
            name: 'Deep Flow',
            href: '/',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            ),
            description: t('Your main feed'),
        },
        {
            name: 'My Profile',
            href: user ? `/users/${user.id}` : '#',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            description: t('View your profile'),
        },
        {
            name: 'Explore',
            href: '/explore',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
            ),
            description: t('Discover new currents'),
        },
        {
            name: 'Groups',
            href: '/schools',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            ),
            description: t('Your groups & communities'),
        },
        {
            name: 'Voyagers',
            href: '/voyagers',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            description: t('Friends & connections'),
        },
        {
            name: 'Conversations',
            href: '/conversations',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
            ),
            description: t('Direct messages'),
        },
        {
            name: 'Events',
            href: '/events',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            ),
            description: t('Meetups & live sessions'),
        },
        {
            name: 'River Flow',
            href: '/river-flow',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            ),
            description: t('Your saved notes & bookmarks'),
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            description: t('Account & preferences'),
        },
    ];

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            setTimeout(() => window.addEventListener('click', handleClickOutside), 50);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed top-0 left-0 z-50 h-full w-80 bg-ocean-deep border-r border-ocean-border transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header - fixed at top */}
                <div className="flex items-center justify-between p-5 border-b border-ocean-border shrink-0">
                    <div className="flex items-center gap-0">
                        <div className="ml-2">
                            <span className="text-3xl font-medium text-ocean-text tracking-wide" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</span>
                            <p className="text-[10px] text-biolum tracking-widest uppercase mt-[-4px]">{t('Navigate the deep')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-ocean-text-dim hover:text-biolum hover:bg-ocean-card transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Items - scrollable middle section */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item, index) => {
                        const isActive = url === item.href || (item.href !== '/' && url.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-biolum/15 text-biolum border border-biolum/20'
                                    : 'text-ocean-text-muted hover:bg-ocean-card hover:text-ocean-text border border-transparent'
                                    }`}
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className={`p-2 rounded-lg transition-all ${isActive
                                    ? 'bg-biolum/20 text-biolum'
                                    : 'bg-ocean-surface text-ocean-text-dim group-hover:bg-ocean-hover group-hover:text-biolum'
                                    }`}>
                                    {item.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold ${isActive ? 'text-biolum' : 'text-ocean-text'}`}>
                                        {t(item.name)}
                                    </p>
                                    <p className="text-[11px] text-ocean-text-dim truncate">
                                        {t(item.description)}
                                    </p>
                                </div>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-6 rounded-full bg-biolum" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section - fixed at bottom */}
                <div className="shrink-0 p-4 border-t border-ocean-border space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-ocean-card/50 border border-ocean-border">
                        <Link
                            href={user ? `/users/${user.id}` : '#'}
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-white font-bold text-sm ring-2 ring-biolum/30 hover:ring-biolum/60 transition-all overflow-hidden shrink-0"
                        >
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'
                            )}
                        </Link>
                        <Link href={user ? `/users/${user.id}` : '#'} onClick={onClose} className="min-w-0 flex-1 group">
                            <p className="text-sm font-semibold text-ocean-text truncate group-hover:text-biolum transition-colors">{user ? user.name : 'Guest'}</p>
                            <p className="text-xs text-biolum">{t('Pro Voyager')}</p>
                        </Link>
                        <button
                            onClick={() => { onClose(); router.visit('/settings'); }}
                            className="p-2 rounded-lg text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface transition-all"
                            title="Settings"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        {t('Sign out')}
                    </button>
                </div>
            </div>
        </>
    );
}

export { WavyBurgerIcon };

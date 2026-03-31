import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';

const DraggableMobileActionMenu = ({
    mobileMenuExpanded,
    setMobileMenuExpanded,
    unreadMessages,
    totalNotifications,
    activePanel,
    switchPanel
}) => {
    // Start with a safe default at the top-right
    const [position, setPosition] = useState({
        x: typeof window !== 'undefined' ? window.innerWidth - 72 : 0,
        y: 80
    });
    const isDragging = useRef(false);
    const hasMoved = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const posStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                // Keep it active but offscreen for large screens if necessary, 
                // but the lg:hidden class usually handles this.
                setMobileMenuExpanded(false);
            } else {
                // If it's lost, reset to top-right
                setPosition(prev => {
                    if (prev.x < 0 || prev.x > window.innerWidth) {
                        return { x: window.innerWidth - 72, y: 80 };
                    }
                    return prev;
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setMobileMenuExpanded]);

    const handlePointerDown = (e) => {
        isDragging.current = true;
        hasMoved.current = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragOffset.current = { x: clientX, y: clientY };
        posStart.current = { ...position };
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragOffset.current.x;
        const dy = clientY - dragOffset.current.y;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasMoved.current = true;
            if (e.cancelable) e.preventDefault(); // Prevent page scroll while dragging menu
        }

        let nextX = posStart.current.x + dx;
        let nextY = posStart.current.y + dy;

        // Prevent it from going entirely offscreen
        nextX = Math.max(10, Math.min(window.innerWidth - 66, nextX));
        nextY = Math.max(10, Math.min(window.innerHeight - 66, nextY));

        setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
    };

    // Global listeners for letting go of mouse outside button bounds
    useEffect(() => {
        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);
        return () => {
            window.removeEventListener('mouseup', handlePointerUp);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, []);

    const handleClick = (e) => {
        if (hasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            setMobileMenuExpanded(!mobileMenuExpanded);
        }
    };

    // Hide the entire draggable menu if a panel is currently open
    if (activePanel) return null;

    return (
        <div
            className="lg:hidden fixed z-[100] flex flex-col items-center"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                touchAction: 'none'
            }}
        >
            {/* Overlay */}
            {mobileMenuExpanded && (
                <div className="fixed inset-0 z-[-1] bg-transparent" onClick={() => setMobileMenuExpanded(false)} />
            )}

            {/* Main Menu Toggle FAB */}
            <button
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onMouseMove={handlePointerMove}
                onTouchMove={handlePointerMove}
                onClick={handleClick}
                style={{ touchAction: 'none' }}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 relative select-none ${mobileMenuExpanded ? 'bg-ocean-card border border-ocean-border text-ocean-text' : 'bg-biolum text-ocean-deep'}`}
            >
                <svg className={`w-7 h-7 transition-transform duration-300 ${mobileMenuExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {mobileMenuExpanded ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    )}
                </svg>

                {/* Main FAB Badge */}
                {!mobileMenuExpanded && (unreadMessages + totalNotifications) > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full animate-pulse border-2 border-ocean-deep"></span>
                )}
            </button>

            {/* Secondary Actions */}
            <div className={`flex flex-col gap-3 transition-all duration-300 origin-top ${mobileMenuExpanded ? 'scale-y-100 opacity-100 mt-4' : 'scale-y-0 opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                <button onClick={() => switchPanel('language')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${activePanel === 'language' ? 'bg-biolum text-ocean-deep' : 'bg-ocean-card border border-ocean-border text-ocean-text'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>
                </button>
                <button onClick={() => switchPanel('notifications')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all relative ${activePanel === 'notifications' ? 'bg-biolum text-ocean-deep' : 'bg-ocean-card border border-ocean-border text-ocean-text'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                    {totalNotifications > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">{totalNotifications}</span>}
                </button>
                <button onClick={() => switchPanel('messages')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all relative ${activePanel === 'messages' ? 'bg-biolum text-ocean-deep' : 'bg-ocean-card border border-ocean-border text-ocean-text'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                    {unreadMessages > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 bg-biolum rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">{unreadMessages}</span>}
                </button>
                <button onClick={() => switchPanel('groups')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${activePanel === 'groups' ? 'bg-biolum text-ocean-deep' : 'bg-ocean-card border border-ocean-border text-ocean-text'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                </button>
                <button onClick={() => switchPanel('trending')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${activePanel === 'trending' ? 'bg-biolum text-ocean-deep' : 'bg-ocean-card border border-ocean-border text-ocean-text'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" /></svg>
                </button>
            </div>
        </div>
    );
};
import MainLayout from '@/Layouts/MainLayout';
import Feed from '@/Components/UI/Misc/Feed';
import ReefPanel from '@/Components/UI/Panels/ReefPanel';
import StoryRail from '@/Components/Features/Stories/StoryRail';

export default function Dashboard({ posts }) {
    const postItems = posts?.data || [];
    const { social } = usePage().props;
    const unreadMessages = social?.unread_messages || 0;
    const totalNotifications = (social?.pending_friend_requests || 0) + (social?.pending_follow_requests || 0);

    // Which panel is open: 'trending' | 'groups' | 'messages' | 'language' | 'notifications' | null
    const [activePanel, setActivePanel] = useState('trending');
    const [mobileMenuExpanded, setMobileMenuExpanded] = useState(false);

    const switchPanel = (panel) => {
        setActivePanel(prev => prev === panel ? null : panel);
        setMobileMenuExpanded(false);
    };

    // Shared button builder for the icon rail
    const RailButton = ({ panel, title, icon, badge }) => (
        <button
            onClick={() => switchPanel(panel)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors group relative ${activePanel === panel
                ? 'bg-biolum text-ocean-card'
                : 'bg-ocean-card text-ocean-text-dim hover:bg-ocean-surface hover:text-ocean-text'
                }`}
            title={title}
        >
            <svg className="w-5 h-5 transition-colors"
                fill="none" viewBox="0 0 24 24" strokeWidth={icon.strokeWidth || 2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
            </svg>
            {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-biolum text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );

    return (
        <MainLayout>
            <Head title="Deep Flow" />

            {/* ── Fixed Left Rail: Stories (Desktop only) ── */}
            <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-24 xl:w-28 border-r border-ocean-border z-20 bg-ocean-deep/50 backdrop-blur-sm shadow-[1px_0_3px_rgba(0,0,0,0.025)]">
                <div className="pt-3 px-1.5 h-full flex flex-col items-center w-full overflow-hidden">
                    <div className="bg-ocean-card rounded-2xl border border-ocean-border w-full h-[calc(100%-8px)] overflow-hidden">
                        <StoryRail />
                    </div>
                </div>
            </aside>

            {/* Dashboard Content — Main Area ───────────────────── */}
            <div className={`transition-all duration-500 ease-in-out md:ml-24 xl:ml-28 ${activePanel ? 'lg:pr-[300px]' : 'lg:pr-0'} pr-0 w-full md:w-auto overflow-x-hidden`}>
                <div className="flex flex-col items-start w-full min-h-screen">

                    {/* Main Area: Feed & Mobile Stories */}
                    <div className="flex-1 w-full pt-4 md:pt-6 px-2 sm:px-4 md:pl-3 xl:pl-4 md:pr-12 xl:pr-17">

                        {/* Mobile/Tablet Stories - shown only on small screens */}
                        <div className="md:hidden mb-6 bg-ocean-card border border-ocean-border rounded-[20px] py-4 shadow-sm overflow-hidden">
                            <StoryRail horizontal={true} />
                        </div>

                        {/* Feed Container */}
                        <div className="w-full">
                            <Feed posts={postItems} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Fixed Right Rail (desktop only) ───────────────── */}
            <div className="hidden lg:block fixed right-0 top-16 bottom-0 z-20 flex">
                <div className="flex h-full">
                    {/* Expandable Panel */}
                    <div className={`h-full overflow-y-auto overflow-x-hidden transition-all duration-400 ease-in-out ${activePanel ? 'w-[300px]' : 'w-0'}`}>
                        <div className="w-[300px] h-full border-l border-ocean-border bg-ocean-deep/97 backdrop-blur-md shadow-[-1px_0_3px_rgba(0,0,0,0.025)]">
                            <div className="p-3 space-y-3">
                                <ReefPanel activePanel={activePanel} />
                            </div>
                        </div>
                    </div>

                    {/* Icon Buttons Rail — always visible */}
                    <div className="flex flex-col items-center px-1.5 pt-3 pb-3 bg-ocean-deep border-l border-ocean-border h-full shadow-[-1px_0_3px_rgba(0,0,0,0.025)]">
                        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-2 flex flex-col items-center gap-2.5">
                            <RailButton panel="trending" title="Trending Currents" icon={{ path: "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" }} />
                            <RailButton panel="groups" title="Suggested Groups" icon={{ path: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" }} />

                            {/* Divider */}
                            <div className="w-7 h-[1px] bg-ocean-border my-0.5" />

                            <RailButton panel="messages" title="Messages" badge={unreadMessages} icon={{ strokeWidth: 1.5, path: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" }} />
                            <RailButton panel="notifications" title="Notifications" badge={totalNotifications} icon={{ strokeWidth: 1.5, path: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" }} />
                            <RailButton panel="language" title="Language" icon={{ strokeWidth: 1.5, path: "m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mobile/Tablet Panel Overlay ───────────────────── */}
            <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${activePanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePanel(null)} />
                <div className={`absolute right-0 top-0 bottom-0 w-[280px] bg-ocean-deep border-l border-ocean-divider transition-transform duration-300 transform ${activePanel ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-ocean-text capitalize">{activePanel}</h2>
                            <button onClick={() => setActivePanel(null)} className="p-2 text-ocean-text-dim hover:text-ocean-text">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <ReefPanel activePanel={activePanel} />
                    </div>
                </div>
            </div>

            {/* Mobile Draggable Menu Action Bar for Quick Access */}
            <DraggableMobileActionMenu
                mobileMenuExpanded={mobileMenuExpanded}
                setMobileMenuExpanded={setMobileMenuExpanded}
                unreadMessages={unreadMessages}
                totalNotifications={totalNotifications}
                activePanel={activePanel}
                switchPanel={switchPanel}
            />
        </MainLayout>
    );
}

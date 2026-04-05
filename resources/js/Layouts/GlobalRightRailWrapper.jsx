import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import ReefPanel from '@/Components/UI/Panels/ReefPanel';

const DraggableMobileActionMenu = ({
    mobileMenuExpanded,
    setMobileMenuExpanded,
    unreadMessages,
    totalNotifications,
    activePanel,
    switchPanel
}) => {
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
                setMobileMenuExpanded(false);
            } else {
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
        // We do not prevent default here so clicks work normally, but we handle drag logic carefully.
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragOffset.current.x;
        const dy = clientY - dragOffset.current.y;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
        
        let newX = posStart.current.x + dx;
        let newY = posStart.current.y + dy;
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);
        return () => {
            window.removeEventListener('mouseup', handlePointerUp);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, []);

    const handleClick = () => {
        if (!hasMoved.current) {
            setMobileMenuExpanded(!mobileMenuExpanded);
        }
    };

    if (activePanel) return null;

    return (
        <div
            className="lg:hidden fixed z-[100] flex flex-col items-center"
            style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
        >
            {mobileMenuExpanded && (
                <div className="fixed inset-0 z-[-1] bg-transparent" onClick={() => setMobileMenuExpanded(false)} />
            )}
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
                {!mobileMenuExpanded && (unreadMessages + totalNotifications) > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full animate-pulse border-2 border-ocean-deep"></span>
                )}
            </button>
            <div className={`absolute top-16 flex flex-col gap-3 transition-all duration-300 ${mobileMenuExpanded ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
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

export default function GlobalRightRailWrapper({ children }) {
    const { social } = usePage().props;
    const unreadMessages = social?.unread_messages || 0;
    const totalNotifications = (social?.unread_notifications || 0) + (social?.pending_friend_requests || 0) + (social?.pending_follow_requests || 0);

    const [activePanel, setActivePanel] = useState('trending');
    const [mobileMenuExpanded, setMobileMenuExpanded] = useState(false);

    const switchPanel = (panel) => {
        setActivePanel(prev => prev === panel ? null : panel);
        setMobileMenuExpanded(false);
    };

    // Global Background Polling for Live Notifications & Messages
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ 
                only: ['social', 'reef'], 
                preserveScroll: true, 
                preserveState: true 
            });
        }, 10000); // 10 seconds background heartbeat
        return () => clearInterval(interval);
    }, []);

    const RailButton = ({ panel, title, icon, badge }) => (
        <button
            onClick={() => switchPanel(panel)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors group relative ${activePanel === panel
                ? 'bg-biolum text-ocean-card shadow-md'
                : 'bg-ocean-card/60 border border-ocean-border text-ocean-text-dim hover:bg-ocean-surface hover:text-ocean-text'
                }`}
            title={title}
        >
            <svg className="w-5 h-5 transition-colors"
                fill="none" viewBox="0 0 24 24" strokeWidth={icon.strokeWidth || 2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
            </svg>
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-md">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );

    return (
        <div className="flex w-full min-h-[calc(100vh-4rem)] relative items-stretch">
            {/* 
                This main content div automatically pushes away from the right rail.
                If activePanel is open, we add pr-[300px] + 80px(rail) = 380px dynamically!
            */}
            <div className={`flex-1 transition-all duration-400 ease-in-out w-full max-w-full ${activePanel ? 'lg:pr-[380px]' : 'lg:pr-[80px]'}`}>
                {children}
            </div>

            {/* Fixed Desktop Right Rail */}
            <div className="hidden lg:flex fixed right-0 top-16 bottom-0 z-20 pointer-events-none">
                {/* Panel Container */}
                <div className={`pointer-events-auto h-full overflow-hidden transition-all duration-400 ease-in-out bg-ocean-deep/97 backdrop-blur-md shadow-[-1px_0_10px_rgba(0,0,0,0.1)] border-l border-ocean-border ${activePanel ? 'w-[300px]' : 'w-0'}`}>
                    <div className="w-[300px] h-full overflow-y-auto">
                        <div className="p-3">
                            <ReefPanel activePanel={activePanel} />
                        </div>
                    </div>
                </div>

                {/* Always-visible Icon Rail */}
                <div className="pointer-events-auto flex flex-col items-center py-4 bg-ocean-deep/90 backdrop-blur-md border-l border-ocean-border h-full shadow-[-2px_0_10px_rgba(0,0,0,0.1)] w-[80px]">
                    <div className="flex flex-col items-center gap-4 w-full">
                        <RailButton panel="trending" title="Trending Currents" icon={{ strokeWidth: 2, path: "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" }} />
                        <RailButton panel="groups" title="Suggested Groups" icon={{ strokeWidth: 2, path: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" }} />
                        <div className="w-8 h-px bg-ocean-border/80 my-1" />
                        <RailButton panel="currents" title="Live Currents" icon={{ strokeWidth: 2, path: "M9 19.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 0V4.688c0-.264.218-.475.48-.475h9.04c.262 0 .48.211.48.475v10.312M18.5 15a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" }} />
                        <RailButton panel="messages" title="Messages" badge={unreadMessages} icon={{ strokeWidth: 1.5, path: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" }} />
                        <RailButton panel="notifications" title="Notifications" badge={totalNotifications} icon={{ strokeWidth: 1.5, path: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" }} />
                        <div className="w-8 h-px bg-ocean-border/80 my-1" />
                        <RailButton panel="announcements" title="Announcements" icon={{ strokeWidth: 1.5, path: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" }} />
                    </div>
                </div>
            </div>

            {/* Mobile/Tablet Panel Overlay */}
            <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${activePanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePanel(null)} />
                <div className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-ocean-deep border-l border-ocean-divider transition-transform duration-300 transform ${activePanel ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 h-[100dvh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 pt-4">
                            <h2 className="text-lg font-bold text-ocean-text capitalize">{activePanel}</h2>
                            <button onClick={() => setActivePanel(null)} className="p-2 text-ocean-text-dim hover:text-ocean-text">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <ReefPanel activePanel={activePanel} />
                    </div>
                </div>
            </div>

            {/* Mobile Draggable Menu */}
            <DraggableMobileActionMenu
                mobileMenuExpanded={mobileMenuExpanded}
                setMobileMenuExpanded={setMobileMenuExpanded}
                unreadMessages={unreadMessages}
                totalNotifications={totalNotifications}
                activePanel={activePanel}
                switchPanel={switchPanel}
            />
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function GlobalAnnouncementBanner() {
    const { announcements } = usePage().props;
    const [visibleAnnouncements, setVisibleAnnouncements] = useState([]);

    useEffect(() => {
        if (!announcements || announcements.length === 0) {
            setVisibleAnnouncements([]);
            return;
        }

        // Filter out announcements that the user has already dismissed
        const dismissed = JSON.parse(localStorage.getItem('daloy_dismissed_announcements') || '[]');
        
        const active = announcements.filter(ann => 
            !dismissed.includes(ann.id) && 
            (ann.display_location === 'banner' || ann.display_location === 'all')
        );
        
        setVisibleAnnouncements(active);
    }, [announcements]);

    const handleDismiss = (id) => {
        setVisibleAnnouncements(prev => prev.filter(ann => ann.id !== id));
        const dismissed = JSON.parse(localStorage.getItem('daloy_dismissed_announcements') || '[]');
        localStorage.setItem('daloy_dismissed_announcements', JSON.stringify([...dismissed, id]));
    };

    if (visibleAnnouncements.length === 0) return null;

    // Just show the highest priority one that hasn't been dismissed
    const announcement = visibleAnnouncements[0];

    const colors = {
        info: 'bg-ocean-surface border-biolum text-ocean-text',
        success: 'bg-emerald-900/50 border-emerald-500 text-emerald-100',
        warning: 'bg-amber-900/50 border-amber-500 text-amber-100',
        critical: 'bg-rose-900/60 border-rose-500 text-rose-100',
    };

    const icons = {
        info: <svg className="w-5 h-5 text-biolum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        success: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        warning: <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
        critical: <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };

    return (
        <div className={`w-full border-b backdrop-blur-md px-4 py-3 flex items-start gap-4 z-50 animate-in slide-in-from-top-full duration-500 shadow-md ${colors[announcement.type] || colors.info}`}>
            <div className="shrink-0 mt-0.5">
                {icons[announcement.type] || icons.info}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate pr-4">{announcement.title}</h4>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed overflow-hidden text-ellipsis display-webkit-box webkit-box-orient-vertical webkit-line-clamp-2">
                    {announcement.message}
                </p>
            </div>
            
            <button 
                onClick={() => handleDismiss(announcement.id)}
                className="shrink-0 p-1.5 hover:bg-black/20 rounded-full transition-colors opacity-70 hover:opacity-100"
                aria-label="Dismiss announcement"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

import React, { useState } from 'react';

/**
 * FeedAnnouncementCard — A pinned "System Post" that appears at the top of the user feed.
 * Styled distinctly from normal posts so users immediately recognise it as official.
 */
export default function FeedAnnouncementCard({ announcement }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || !announcement) return null;

    const handleDismiss = () => {
        setDismissed(true);
        const key = 'daloy_dismissed_feed_announcements';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([...list, announcement.id]));
    };

    const typeConfig = {
        info:     { accent: 'border-biolum/40',  bg: 'bg-biolum/[0.04]',      icon: 'text-biolum',       badge: 'bg-biolum/15 text-biolum' },
        success:  { accent: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.04]', icon: 'text-emerald-400',  badge: 'bg-emerald-500/15 text-emerald-400' },
        warning:  { accent: 'border-amber-500/40',   bg: 'bg-amber-500/[0.04]',   icon: 'text-amber-400',    badge: 'bg-amber-500/15 text-amber-400' },
        critical: { accent: 'border-rose-500/40',    bg: 'bg-rose-500/[0.04]',    icon: 'text-rose-400',     badge: 'bg-rose-500/15 text-rose-400' },
    };

    const cfg = typeConfig[announcement.type] || typeConfig.info;

    return (
        <div className={`relative rounded-[18px] border-l-4 ${cfg.accent} ${cfg.bg} backdrop-blur-sm overflow-hidden mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-in slide-in-from-top-3 duration-500`}>
            {/* Subtle glow line at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-biolum/20 to-transparent" />

            <div className="px-5 py-4 flex items-start gap-4">
                {/* Icon */}
                <div className={`shrink-0 mt-0.5 w-10 h-10 rounded-xl ${cfg.badge} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${cfg.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${cfg.badge}`}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                            Official
                        </span>
                        <span className="text-[10px] text-ocean-text-dim/50 font-medium">System Announcement</span>
                    </div>
                    <h4 className="text-sm font-bold text-ocean-text leading-snug tracking-tight">{announcement.title}</h4>
                    <p className="text-xs text-ocean-text-dim/80 mt-1.5 leading-relaxed line-clamp-3">{announcement.message}</p>
                </div>

                {/* Dismiss */}
                <button
                    onClick={handleDismiss}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-ocean-surface/50 text-ocean-text-dim/40 hover:text-ocean-text-dim transition-colors"
                    aria-label="Dismiss"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

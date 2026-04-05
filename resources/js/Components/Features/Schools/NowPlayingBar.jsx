import React, { useState, useEffect } from 'react';
import { useCurrents } from '@/Contexts/CurrentsContext';
import { ThumbsUp, ThumbsDown, Radio, X, ChevronUp, Users } from 'lucide-react';

/**
 * NowPlayingBar — A centered pill bar below the top nav (like Spotify/Discord).
 * Shows: 👍 | "Now playing — TRACK TITLE" | 👎
 *
 * Features:
 * - Toggled via a small floating play button when hidden
 * - Always visible when toggled on (persists across navigation)
 * - Can be dismissed with the X button
 */
export default function NowPlayingBar() {
    const ctx = useCurrents();
    const [isVisible, setIsVisible] = useState(true);
    const [userDisabled, setUserDisabled] = useState(false);

    // Read user preference
    useEffect(() => {
        const checkStorage = () => {
            setUserDisabled(localStorage.getItem('daloy_hide_now_playing') === 'true');
        };
        checkStorage();
        window.addEventListener('storage', checkStorage);
        return () => window.removeEventListener('storage', checkStorage);
    }, []);

    // Auto-show when joining a session, unless disabled globally
    useEffect(() => {
        if (ctx?.isInSession && !userDisabled) setIsVisible(true);
    }, [ctx?.isInSession, userDisabled]);

    if (!ctx?.isInSession || !ctx.session || userDisabled) return null;

    const { session, listenerCount, votes, myVote, castVote } = ctx;

    // ── Hidden state: show a small floating toggle button ──────────────
    if (!isVisible) {
        return (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-[170] animate-[fadeIn_0.2s_ease-out]">
                <button
                    onClick={() => setIsVisible(true)}
                    className="flex items-center gap-2 bg-ocean-card/90 backdrop-blur-xl border border-biolum/30 rounded-full px-4 py-2 shadow-lg hover:border-biolum/50 hover:shadow-[0_4px_16px_rgba(0,255,240,0.15)] transition-all group"
                >
                    <div className="relative">
                        <Radio className="w-4 h-4 text-biolum" />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-biolum rounded-full animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-ocean-text group-hover:text-biolum transition-colors">Now Playing</span>
                    <ChevronUp className="w-3 h-3 text-ocean-text-dim rotate-180" />
                </button>
            </div>
        );
    }

    // ── Visible state: full bar ───────────────────────────────────────────
    return (
        <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-[170] animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-ocean-card/90 backdrop-blur-xl border border-ocean-divider/60 rounded-full px-2 py-1.5 shadow-2xl flex items-center gap-1 min-w-[320px] max-w-[520px]">

                {/* Thumbs Up */}
                <button
                    onClick={() => castVote('good')}
                    className={`p-2 rounded-full transition-all shrink-0 ${
                        myVote === 'good'
                            ? 'bg-biolum/20 text-biolum'
                            : 'text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface/50'
                    }`}
                    title="Vibes ✓"
                >
                    <ThumbsUp className="w-4 h-4" />
                </button>

                {/* Center: Now Playing info */}
                <div className="flex-1 min-w-0 text-center px-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className="relative shrink-0">
                            <Radio className="w-3.5 h-3.5 text-biolum" />
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-biolum rounded-full animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black text-biolum uppercase tracking-widest shrink-0">Now Playing</span>
                    </div>
                    <p className="text-sm font-bold text-ocean-text truncate leading-tight mt-0.5">
                        {session.current_track_title || session.session_name || 'Live Broadcast'}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                        <span className="text-[10px] text-ocean-text-dim flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {listenerCount}
                        </span>
                        <span className="text-[10px] text-ocean-text-dim flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {votes.good?.length || 0}</span>
                            <span>&middot;</span>
                            <span className="flex items-center gap-0.5"><ThumbsDown className="w-2.5 h-2.5" /> {votes.bad?.length || 0}</span>
                        </span>
                    </div>
                </div>

                {/* Thumbs Down */}
                <button
                    onClick={() => castVote('bad')}
                    className={`p-2 rounded-full transition-all shrink-0 ${
                        myVote === 'bad'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface/50'
                    }`}
                    title="Skip ✗"
                >
                    <ThumbsDown className="w-4 h-4" />
                </button>

                {/* Close / Hide */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface/50 transition-all shrink-0 ml-1"
                    title="Hide bar (still playing)"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

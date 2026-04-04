import React, { useState, useRef, useEffect } from 'react';
import { Waves, Flame, Smile, Frown, Sparkles } from 'lucide-react';

const REACTION_TYPES = [
    { type: 'wave', emoji: <Waves className="w-[1.2em] h-[1.2em] inline text-blue-400" />, label: 'Wave', color: 'text-blue-400' },
    { type: 'fire', emoji: <Flame className="w-[1.2em] h-[1.2em] inline text-orange-400" />, label: 'Fire', color: 'text-orange-400' },
    { type: 'haha', emoji: <Smile className="w-[1.2em] h-[1.2em] inline text-yellow-300" />, label: 'Haha', color: 'text-yellow-300' },
    { type: 'sad',  emoji: <Frown className="w-[1.2em] h-[1.2em] inline text-indigo-300" />, label: 'Sad',  color: 'text-indigo-300' },
    { type: 'wow',  emoji: <Sparkles className="w-[1.2em] h-[1.2em] inline text-fuchsia-400" />, label: 'Wow',  color: 'text-fuchsia-400' },
];

export default function PostActions({
    reactionsCount,
    commentsCount,
    isLiked,
    userReaction,
    reactionCounts = {},
    onReact,
    onCommentClick,
    onShareClick,
    onBookmark,
    isBookmarked = false,
}) {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);
    const btnRef = useRef(null);
    const hoverTimeoutRef = useRef(null);

    const currentReaction = userReaction
        ? REACTION_TYPES.find(r => r.type === userReaction)
        : null;

    useEffect(() => {
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMouseEnter = () => {
        hoverTimeoutRef.current = setTimeout(() => setShowPicker(true), 400);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => setShowPicker(false), 300);
    };

    const handleReact = (type) => {
        onReact(type);
        setShowPicker(false);
    };

    // Summary of top reactions for display
    const topReactions = Object.entries(reactionCounts || {})
        .filter(([_, c]) => c > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // Calculate total excluding the 'total' field if it exists, or just use the field if it's there
    const totalReactions = reactionCounts?.total !== undefined 
        ? reactionCounts.total 
        : Object.values(reactionCounts || {}).reduce((a, b) => a + b, 0) || reactionsCount || 0;

    return (
        <div className="flex items-center gap-4 text-sm font-medium w-full">
            {/* Reaction Button with Picker */}
            <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Reaction Picker Popup */}
                {showPicker && (
                    <div
                        ref={pickerRef}
                        className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-ocean-deep/95 backdrop-blur-xl border border-ocean-divider rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                        onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {REACTION_TYPES.map((r) => (
                            <button
                                key={r.type}
                                onClick={() => handleReact(r.type)}
                                className={`relative group/emoji px-1.5 py-1 rounded-full transition-all duration-200 hover:scale-[1.35] hover:bg-ocean-surface/60 ${userReaction === r.type ? 'bg-ocean-surface/80 scale-110' : ''
                                    }`}
                                title={r.label}
                            >
                                <span className="text-xl flex items-center justify-center p-0.5">{r.emoji}</span>
                                {/* Label tooltip */}
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-ocean-text bg-ocean-deep border border-ocean-divider px-1.5 py-0.5 rounded opacity-0 group-hover/emoji:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {r.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Main reaction button */}
                <button
                    ref={btnRef}
                    onClick={() => {
                        if (currentReaction) {
                            onReact(currentReaction.type); // Toggle off
                        } else {
                            onReact('wave'); // Default to wave
                        }
                    }}
                    className={`flex items-center gap-1.5 transition-all group ${currentReaction ? currentReaction.color : 'text-ocean-text-dim hover:text-blue-400'
                        }`}
                >
                    <div className={`p-1.5 rounded-full transition-all ${currentReaction ? 'bg-current/10 scale-105' : 'group-hover:bg-blue-500/10'
                        }`}>
                        {currentReaction ? (
                            <span className="text-lg leading-none flex items-center justify-center">{currentReaction.emoji}</span>
                        ) : (
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Top reaction emojis */}
                        {topReactions.length > 0 && (
                            <span className="flex -space-x-0.5 text-xs">
                                {topReactions.map(([type]) => {
                                    const r = REACTION_TYPES.find(rt => rt.type === type);
                                    return r ? <span key={type} className="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3 z-10 p-px rounded-full bg-ocean-surface ring-1 ring-ocean-deep relative -ml-1 first:ml-0">{r.emoji}</span> : null;
                                })}
                            </span>
                        )}
                        <span className="text-[13px]">
                            {totalReactions > 0 ? totalReactions : (currentReaction ? currentReaction.label : 'React')}
                        </span>
                    </div>
                </button>
            </div>

            {/* Comment Button */}
            <button
                onClick={onCommentClick}
                className="flex items-center gap-1.5 text-ocean-text-dim hover:text-biolum transition-colors group"
            >
                <div className="p-1.5 rounded-full group-hover:bg-biolum/10 transition-colors">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                    </svg>
                </div>
                <span className="text-[13px]">{commentsCount > 0 ? commentsCount : 'Comment'}</span>
            </button>

            {/* Share Button */}
            <button
                onClick={onShareClick}
                className="flex items-center gap-1.5 text-ocean-text-dim hover:text-emerald-400 transition-colors group"
            >
                <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                </div>
                <span className="text-[13px]">Share</span>
            </button>

            {/* Bookmark Button — pushed right */}
            <button
                onClick={onBookmark}
                className={`ml-auto flex items-center gap-1 transition-all group ${isBookmarked ? 'text-amber-400' : 'text-ocean-text-dim hover:text-amber-400'
                    }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
                <div className={`p-1.5 rounded-full transition-colors ${isBookmarked ? 'bg-amber-400/10' : 'group-hover:bg-amber-400/10'
                    }`}>
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                </div>
            </button>
        </div>
    );
}

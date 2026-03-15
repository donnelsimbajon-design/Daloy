import React, { useState } from 'react';

export default function PostActions({
    reactionsCount,
    commentsCount,
    isLiked,
    onLike,
    onCommentClick,
    onShareClick
}) {
    // Local optimistic state for immediate feedback if needed, currently controlled by parent

    return (
        <div className="flex items-center gap-6 text-sm font-medium">
            {/* Like Button */}
            <button
                onClick={onLike}
                className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-rose-500' : 'text-ocean-text-dim hover:text-rose-400'
                    }`}
            >
                <div className={`p-1.5 rounded-full transition-colors ${isLiked ? 'bg-rose-500/10' : 'group-hover:bg-rose-500/10'
                    }`}>
                    <svg
                        className={`w-5 h-5 transition-transform ${isLiked ? 'scale-110 fill-current' : 'group-hover:scale-110'}`}
                        fill={isLiked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </div>
                <span>{reactionsCount > 0 ? reactionsCount : 'Like'}</span>
            </button>

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
                <span>{commentsCount > 0 ? commentsCount : 'Comment'}</span>
            </button>

            {/* Share Button */}
            <button
                onClick={onShareClick}
                className="flex items-center gap-1.5 text-ocean-text-dim hover:text-emerald-400 transition-colors group ml-auto"
            >
                <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                </div>
                <span>Share</span>
            </button>
        </div>
    );
}

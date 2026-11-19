import React from 'react';

/**
 * Three equal-weight, minimum 44px actions. Use only the existing Daloy
 * black/white/gray design tokens; photos themselves remain in full color.
 */
export default function PostActions({
    reactionsCount = 0,
    commentsCount = 0,
    isLiked,
    onLike,
    onCommentClick,
    onShareClick,
}) {
    const common = 'daloy-post-action flex min-w-0 min-h-[44px] items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';
    const active = 'daloy-post-action-active bg-ocean-surface text-ocean-text';
    const inactive = 'text-ocean-text-muted hover:bg-ocean-surface hover:text-ocean-text';

    return (
        <div className="daloy-post-actions grid w-full grid-cols-3 gap-1.5 sm:gap-2" aria-label="Post actions">
            <button
                type="button"
                onClick={onLike}
                aria-pressed={Boolean(isLiked)}
                aria-label={isLiked ? 'Unlike post' : 'Like post'}
                className={`${common} ${isLiked ? active : inactive}`}
            >
                <svg aria-hidden="true" className="h-[19px] w-[19px] shrink-0" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>Like</span>
                {reactionsCount > 0 && <span className="text-[11px] font-medium tabular-nums text-ocean-text-dim">{reactionsCount}</span>}
            </button>
            <button
                type="button"
                onClick={onCommentClick}
                aria-label="Comment"
                className={`${common} ${inactive}`}
            >
                <svg aria-hidden="true" className="h-[19px] w-[19px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641A4.483 4.483 0 0 1 4.936 20.906 5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                <span>Comment</span>
                {commentsCount > 0 && <span className="text-[11px] font-medium tabular-nums text-ocean-text-dim">{commentsCount}</span>}
            </button>
            <button
                type="button"
                onClick={onShareClick}
                aria-label="Share"
                className={`${common} ${inactive}`}
            >
                <svg aria-hidden="true" className="h-[19px] w-[19px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                <span>Share</span>
            </button>
        </div>
    );
}

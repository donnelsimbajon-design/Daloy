import React, { useState } from 'react';

/**
 * Display media without leaving a broken-image icon when the file has been
 * deleted or the preview server has been redeployed.
 *
 * This is only a presentation fallback, not a replacement for permanent
 * storage. Deleted or lost files cannot be reconstructed in the browser.
 */
export default function SafeMediaImage({
    src,
    alt = 'Photo',
    className = '',
    fallbackText = 'Photo unavailable',
    fallbackHelp = 'This photo may have been removed. Ask its owner to upload it again.',
    loading = 'lazy',
    ...props
}) {
    const [failedSrc, setFailedSrc] = useState(null);
    const unavailable = !src || failedSrc === src;

    if (unavailable) {
        return (
            <div
                role="img"
                aria-label={`${alt}. ${fallbackText}`}
                data-testid="media-unavailable"
                className={`flex min-w-0 flex-col items-center justify-center gap-2 bg-ocean-surface p-3 text-center text-ocean-text-muted ${className}`}
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 flex-none" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="m3 16 5-5 4 4 2-2 7 7M8 8h.01M3 3l18 18" />
                </svg>
                <span className="text-xs font-semibold">{fallbackText}</span>
                <span className="max-w-[18rem] text-[11px] leading-relaxed opacity-80">{fallbackHelp}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading={loading}
            decoding="async"
            onError={() => setFailedSrc(src)}
            {...props}
        />
    );
}

import React from 'react';
import { useCurrents } from '@/Contexts/CurrentsContext';

/**
 * GlobalAudioLayer — Renders the hidden audio embeds at the MainLayout level
 * so they persist across ALL navigation and panel switches.
 * This component is invisible but keeps the music playing.
 */
export default function GlobalAudioLayer() {
    const ctx = useCurrents();

    if (!ctx?.isInSession || !ctx.session) return null;

    const { session } = ctx;

    return (
        <div className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none" aria-hidden="true">
            {session.track_type === 'youtube' && session.track_url && (
                <iframe
                    key={`yt-${session.track_url}`}
                    width="1" height="1"
                    src={`https://www.youtube.com/embed/${getYouTubeID(session.track_url)}?autoplay=1&controls=0&fs=0`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            )}
            {session.track_type === 'spotify' && session.track_url && (
                <iframe
                    key={`sp-${session.track_url}`}
                    src={getSpotifyEmbed(session.track_url)}
                    width="1" height="1"
                    frameBorder="0"
                    allow="encrypted-media"
                />
            )}
            {session.track_type === 'mp3' && session.track_url && (
                <audio key={`mp3-${session.track_url}`} autoPlay>
                    <source src={session.track_url} type="audio/mpeg" />
                </audio>
            )}
        </div>
    );
}

function getYouTubeID(url) {
    if (!url) return '';
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match?.[2]?.length === 11 ? match[2] : '';
}

function getSpotifyEmbed(url) {
    if (!url) return '';
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
}

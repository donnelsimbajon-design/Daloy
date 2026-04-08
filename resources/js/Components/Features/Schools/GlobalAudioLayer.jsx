import React, { useState, useEffect, useRef } from 'react';
import { useCurrents } from '@/Contexts/CurrentsContext';

export default function GlobalAudioLayer() {
    const ctx = useCurrents();
    const audioRef = useRef(null);
    const lastUrlRef = useRef(null);

    const isInSession = ctx?.isInSession && ctx.session;
    const session = ctx?.session;
    const trackElapsed = ctx?.trackElapsed || 0;
    const isHost = ctx?.isHost;
    
    const isLocalPaused = ctx?.isLocalMusicPaused;
    const isLocalMuted = ctx?.isLocalMusicMuted;

    const [syncedYtUrl, setSyncedYtUrl] = useState('');

    // We only force-sync if the URL changes OR we are newly joining
    useEffect(() => {
        if (!isInSession || !session?.track_url) return;

        if (lastUrlRef.current !== session.track_url) {
            // A new track has loaded! 
            lastUrlRef.current = session.track_url;

            if (session.track_type === 'youtube') {
                const id = getYouTubeID(session.track_url);
                // We set the URL ONCE with the current elapsed time so it starts perfectly,
                // but doesn't re-render every second when trackElapsed ticks up!
                setSyncedYtUrl(`https://www.youtube.com/embed/${id}?autoplay=1&controls=0&fs=0&start=${Math.floor(trackElapsed)}`);
            } else if (session.track_type === 'mp3' && audioRef.current) {
                audioRef.current.currentTime = trackElapsed;
            }
        } else {
            // Routine sync for MP3s if they drift too far out of phase
            if (session.track_type === 'mp3' && audioRef.current) {
                // TIGHT SYNC: Correct EVERYONE (even the host) if they are more than 1.5 seconds off the global server live time.
                // This acts like true Live Radio.
                if (Math.abs(audioRef.current.currentTime - trackElapsed) > 1.5 && !isLocalPaused) {
                    audioRef.current.currentTime = trackElapsed;
                }
            }
        }
    }, [isInSession, session?.track_url, trackElapsed, isHost, session?.track_type, isLocalPaused]);

    // Effect to apply pause/play/mute dynamically to MP3 files
    useEffect(() => {
        if (session?.track_type === 'mp3' && audioRef.current) {
            audioRef.current.muted = isLocalMuted;
            if (isLocalPaused) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(() => {});
                // Optional: Re-sync time when unpausing
                if (Math.abs(audioRef.current.currentTime - trackElapsed) > 1.5) {
                    audioRef.current.currentTime = trackElapsed;
                }
            }
        }
    }, [isLocalPaused, isLocalMuted, session?.track_type, trackElapsed]);

    // Don't render anything if paused for iframe embeds (to stop playback)
    if (!isInSession || (isLocalPaused && session?.track_type !== 'mp3')) return null;

    return (
        <div className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none" aria-hidden="true">
            {session.track_type === 'youtube' && syncedYtUrl && !isLocalPaused && (
                <iframe
                    key={`yt-${session.track_url}`}
                    width="1" height="1"
                    src={`${syncedYtUrl}${isLocalMuted ? '&mute=1' : ''}`}
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
                <audio ref={audioRef} key={`mp3-${session.track_url}`} autoPlay>
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

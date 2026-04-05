import React from 'react';
import { useCurrents } from '@/Contexts/CurrentsContext';
import { Radio, Mic, MicOff, LogOut, Users } from 'lucide-react';

/**
 * PersistentMiniPlayer — A small floating pill in the bottom-left that shows
 * when the user is in a Currents session. Visible on ALL pages/panels.
 * Provides quick mic toggle and leave button without needing the full player.
 */
export default function PersistentMiniPlayer() {
    const ctx = useCurrents();

    if (!ctx?.isInSession || !ctx.session) return null;

    const { session, listenerCount, isMicEnabled, isMicMuted, toggleMic, leaveSession } = ctx;

    return (
        <div className="fixed bottom-6 left-6 z-[180] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-ocean-card/90 backdrop-blur-xl border border-biolum/30 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 hover:border-biolum/50 transition-all">
                {/* Pulsing indicator */}
                <div className="relative shrink-0">
                    <Radio className="w-5 h-5 text-biolum" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-biolum rounded-full animate-pulse" />
                </div>

                {/* Info */}
                <div className="min-w-0">
                    <p className="text-xs font-bold text-ocean-text truncate max-w-[140px] leading-tight">
                        {session.session_name || session.current_track_title || 'Live'}
                    </p>
                    <span className="text-[10px] text-ocean-text-dim flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5" /> {listenerCount} listening
                    </span>
                </div>

                {/* Quick controls */}
                <button
                    onClick={toggleMic}
                    className={`p-1.5 rounded-lg transition-all ${
                        isMicEnabled && !isMicMuted ? 'text-biolum' : 'text-ocean-text-dim'
                    }`}
                    title={!isMicEnabled ? 'Enable Mic' : isMicMuted ? 'Unmute' : 'Mute'}
                >
                    {isMicEnabled && !isMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                    onClick={leaveSession}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Leave session"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useCurrents } from '@/Contexts/CurrentsContext';
import { Radio, Headphones, Play, Crown, Users, Music, Mic, MicOff, LogOut, MessageCircle, ListMusic } from 'lucide-react';

/**
 * CurrentsTabContent — SchoolProfile page currents tab.
 * Handles creating sessions (admin), joining (member), and showing active state.
 */
export default function CurrentsTabContent({ school, activeSession, isAdmin, blockedIds }) {
    const currents = useCurrents();
    const [joiningCall, setJoiningCall] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');

    const handleStartSession = async (e) => {
        if (e) e.preventDefault();
        try {
            setJoiningCall(true);
            await currents.startSession(school, currentUrl, sessionName || 'Live Broadcast', blockedIds);
            setShowModal(false);
            setCurrentUrl('');
            setSessionName('');
        } catch (err) {
            console.error(err);
        }
        setJoiningCall(false);
    };

    const handleJoinSession = async () => {
        try {
            setJoiningCall(true);
            await currents.joinSession(school, blockedIds);
        } catch (err) {
            console.error(err);
        }
        setJoiningCall(false);
    };

    const isConnectedHere = currents.isInSession && currents.currentSchool?.id === school.id;

    return (
        <div className="space-y-6">
            {isConnectedHere ? (
                /* ── Connected State ── */
                <div className="flex flex-col items-center justify-center py-12 bg-ocean-card border border-ocean-border rounded-[20px] text-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-biolum/5 to-transparent pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-biolum/10 border border-biolum/30 flex items-center justify-center mb-4 relative z-10">
                        <span className="absolute inset-0 rounded-2xl bg-biolum/10 animate-ping" />
                        <Radio className="w-8 h-8 text-biolum relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-ocean-text tracking-tight mb-2 z-10">You're Connected</h3>
                    <p className="text-sm text-ocean-text-dim mb-1 z-10">
                        {currents.session?.session_name && <span className="font-bold text-biolum">{currents.session.session_name} — </span>}
                        Playing: {currents.session?.current_track_title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 z-10 mb-4 mt-2">
                        <div className="flex -space-x-2">
                            {currents.participants.slice(0, 5).map(u => (
                                <img key={u.id} src={u.profile_picture || '/images/default-avatar.png'} className="w-8 h-8 rounded-full border-2 border-ocean-card object-cover" title={u.name} />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-ocean-text-dim">{currents.listenerCount} listening</span>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-3 z-10">
                        <button onClick={currents.toggleMic}
                            className={`p-3 rounded-xl transition-all ${
                                !currents.isMicEnabled ? 'bg-ocean-surface text-ocean-text-dim border border-ocean-border' :
                                currents.isMicMuted ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                                'bg-biolum/15 text-biolum border border-biolum/30'
                            }`}
                            title={!currents.isMicEnabled ? "Enable Mic" : currents.isMicMuted ? "Unmute" : "Mute"}>
                            {currents.isMicEnabled && !currents.isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button onClick={currents.leaveSession}
                            className="px-5 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Leave
                        </button>
                    </div>

                    <p className="text-xs text-ocean-text-dim/60 z-10 mt-4">Full player available in the Right Rail Currents panel.</p>
                </div>
            ) : activeSession && activeSession.is_active ? (
                /* ── Active Session — Join ── */
                <div className="flex flex-col items-center justify-center py-12 bg-ocean-card border border-ocean-border rounded-[20px] text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-biolum/5 to-transparent pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-biolum/10 border border-biolum/20 flex items-center justify-center mb-4 relative z-10">
                        <div className="absolute inset-0 rounded-2xl bg-biolum/10 animate-pulse" />
                        <Radio className="w-8 h-8 text-biolum relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-ocean-text tracking-tight mb-1 z-10">
                        {activeSession.session_name || 'Live Session Active'}
                    </h3>
                    <p className="text-sm text-ocean-text-dim mb-1 z-10">Now Playing: {activeSession.current_track_title || 'Music'}</p>
                    <p className="text-xs text-ocean-text-dim/60 mb-5 z-10">Hop into the audio stream with your group.</p>
                    <button onClick={handleJoinSession} disabled={joiningCall}
                        className="px-8 py-3 bg-biolum text-biolum-foreground font-bold text-sm rounded-xl hover:bg-biolum-bright transition-all shadow-[0_4px_16px_rgba(0,255,240,0.25)] hover:shadow-[0_6px_24px_rgba(0,255,240,0.35)] z-10 flex items-center gap-2 disabled:opacity-50">
                        <Headphones className="w-5 h-5" />
                        {joiningCall ? 'Connecting...' : 'Join This Current'}
                    </button>
                </div>
            ) : (
                /* ── No Active Session ── */
                <div className="flex flex-col items-center justify-center py-16 bg-ocean-card border border-ocean-border rounded-[20px] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                        <Radio className="w-8 h-8 text-ocean-text-dim" />
                    </div>
                    <h3 className="text-lg font-bold text-ocean-text mb-1">No Active Currents</h3>
                    <p className="text-sm text-ocean-text-dim mb-4">
                        {isAdmin ? 'Start a broadcast to stream music and chat with members.' : 'Waiting for an admin to start the stream.'}
                    </p>
                    {isAdmin && school.is_member && (
                        <button onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-biolum text-biolum-foreground font-bold text-sm rounded-xl hover:bg-biolum-bright transition-all shadow-[0_4px_16px_rgba(0,255,240,0.25)] flex items-center gap-2">
                            <Play className="w-4 h-4" /> Start Broadcasting
                        </button>
                    )}
                </div>
            )}

            {/* ═══════ CURRENTS SETUP MODAL ═══════ */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-ocean-card border border-ocean-border w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-ocean-border shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-biolum/10 flex items-center justify-center">
                                    <Radio className="w-5 h-5 text-biolum" />
                                </div>
                                <h2 className="text-xl font-black text-ocean-text tracking-tight">Start a Broadcast</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text-dim hover:text-ocean-text transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleStartSession}>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-ocean-text block mb-1.5">Session Name</label>
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder:text-ocean-text-dim"
                                        placeholder="e.g. Late Night Lofi, Study Beats..."
                                    />
                                    <p className="text-[10px] text-ocean-text-dim/60 mt-1 pl-1">Give your broadcast a name so members know what to expect</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-ocean-text block mb-1.5">Music Link</label>
                                    <input
                                        type="url"
                                        value={currentUrl}
                                        onChange={(e) => setCurrentUrl(e.target.value)}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder:text-ocean-text-dim"
                                        placeholder="https://youtube.com/watch?v=..."
                                        required
                                    />
                                    <p className="text-[10px] text-ocean-text-dim/60 mt-1 pl-1">Supports YouTube, Spotify, and direct MP3 links</p>
                                </div>
                            </div>
                            <div className="px-6 pb-6 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-ocean-border text-ocean-text text-sm font-semibold hover:bg-ocean-surface transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={joiningCall || !currentUrl.trim()}
                                    className="px-6 py-2.5 rounded-xl bg-biolum text-biolum-foreground text-sm font-bold hover:bg-biolum-bright transition-colors disabled:opacity-50 shadow-[0_4px_16px_rgba(0,255,240,0.25)] flex items-center gap-2">
                                    <Play className="w-4 h-4" />
                                    {joiningCall ? 'Starting...' : 'Go Live'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

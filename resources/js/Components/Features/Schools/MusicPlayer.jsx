import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import { useCurrents } from '@/Contexts/CurrentsContext';
import { SkipForward, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Users, Music, LogOut, Crown, X, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown, ListMusic, Radio, Maximize2, Minimize2 } from 'lucide-react';

/**
 * MusicPlayer — Bottom-docked bar inside the CurrentsPanel card.
 *
 * Architecture:
 *  - Audio embeds are in GlobalAudioLayer (MainLayout) → persist across navigation
 *  - This component is ONLY the UI controls
 *  - Compact bar at bottom → expands to FULL PANEL takeover for Playlist/Users/Chat
 */
export default function MusicPlayer() {
    const { auth } = usePage().props;
    const ctx = useCurrents();
    const [activeTab, setActiveTab] = useState('music');
    const [chatInput, setChatInput] = useState('');
    const [newTrackUrl, setNewTrackUrl] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChatPopout, setIsChatPopout] = useState(false);
    const chatEndRef = useRef(null);
    const chatPopoutEndRef = useRef(null);

    if (!ctx?.isInSession || !ctx.session) return null;

    const { session, participants, listenerCount, votes, myVote, chatMessages,
        isMicEnabled, isMicMuted, locallyMutedUsers,
        leaveSession, endSession, toggleMic, toggleLocalMute,
        sendChat, castVote, addTrack, playNext } = ctx;

    const isHost = session.admin_id === auth?.user?.id;

    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        await sendChat(chatInput);
        setChatInput('');
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            chatPopoutEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleAddTrack = async (e, forcedUrl = null) => {
        e.preventDefault();
        const urlToUse = forcedUrl || newTrackUrl;
        if (!urlToUse.trim()) return;
        
        try {
            await addTrack(urlToUse);
            setNewTrackUrl('');
        } catch (err) {
            console.error('Failed to add track:', err);
            alert(err.response?.data?.error || "Failed to add track or playlist. Mute ensure it is a valid Spotify or YouTube link.");
        }
    };

    const tabs = [
        { key: 'music', icon: ListMusic, label: 'Playlist' },
        { key: 'users', icon: Users, label: 'Listeners' },
        { key: 'chat', icon: MessageCircle, label: 'Chat' },
    ];

    // ── EXPANDED: Full panel takeover ─────────────────────────────────
    if (isExpanded) {
        return (
            <>
            <div className="absolute inset-0 z-50 bg-ocean-deep flex flex-col animate-[fadeIn_0.15s_ease-out] border border-ocean-divider shadow-2xl rounded-2xl overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b border-ocean-divider/50 flex items-center justify-between shrink-0 bg-ocean-card/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-biolum/25 to-ocean-divider shrink-0 flex items-center justify-center relative">
                            <Radio className="w-4 h-4 text-biolum" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-biolum rounded-full animate-pulse border border-ocean-card" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-ocean-text truncate">{session.session_name || session.current_track_title || 'Live Broadcast'}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-biolum uppercase tracking-widest">Live</span>
                                <span className="text-xs text-ocean-text-dim flex items-center gap-1"><Users className="w-3 h-3" /> {listenerCount}</span>
                                {isHost && <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5"><Crown className="w-3 h-3" /> DJ</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={toggleMic}
                            className={`p-2 rounded-xl transition-all ${!isMicEnabled ? 'text-ocean-text-dim bg-ocean-surface/50' : isMicMuted ? 'text-rose-400 bg-rose-500/10' : 'text-biolum bg-biolum/10'}`}>
                            {isMicEnabled && !isMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                        <button onClick={leaveSession} className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all" title="Leave">
                            <LogOut className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsExpanded(false)} className="p-2 rounded-xl text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-all" title="Minimize">
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Now Playing strip */}
                <div className="px-4 py-2.5 bg-ocean-surface/30 border-b border-ocean-divider/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-biolum/10 border border-biolum/20 flex items-center justify-center shrink-0">
                            <Music className="w-5 h-5 text-biolum" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-biolum uppercase tracking-wider">Now Playing</p>
                            <p className="text-sm font-bold text-ocean-text truncate">{session.current_track_title || 'Untitled'}</p>
                        </div>
                    </div>
                    {/* Votes */}
                    <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => castVote('good')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${myVote === 'good' ? 'bg-biolum/20 text-biolum border border-biolum/30' : 'text-ocean-text-dim bg-ocean-surface/40 border border-ocean-border/30 hover:text-ocean-text'}`}>
                            <ThumbsUp className="w-4 h-4" /> {votes.good.length}
                        </button>
                        <button onClick={() => castVote('bad')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${myVote === 'bad' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-ocean-text-dim bg-ocean-surface/40 border border-ocean-border/30 hover:text-ocean-text'}`}>
                            <ThumbsDown className="w-4 h-4" /> {votes.bad.length}
                        </button>
                        <div className="flex -space-x-2 ml-auto">
                            {[...votes.good, ...votes.bad].slice(0, 5).map(v => (
                                <img key={v.id} src={v.avatar || '/images/default-avatar.png'} className="w-5 h-5 rounded-full border-2 border-ocean-card object-cover" title={v.name} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Selector — pill style */}
                <div className="px-3 py-2 shrink-0 bg-ocean-surface/10">
                    <div className="flex bg-ocean-surface/40 rounded-xl p-1 gap-1">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-ocean-card text-biolum shadow-sm border border-ocean-divider'
                                        : 'text-ocean-text-dim hover:text-ocean-text'
                                }`}>
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.key === 'users' && <span className="text-[10px] opacity-70">({listenerCount})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content — FULL remaining height */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-ocean-deep/50">

                    {/* ─── Playlist Tab ─── */}
                    {activeTab === 'music' && (
                        <div className="p-4 space-y-4">
                            {/* Spotify visible embed */}
                            {session.track_type === 'spotify' && session.track_url && (
                                <div className="rounded-xl overflow-hidden shadow-lg border border-ocean-border">
                                    <iframe src={getSpotifyEmbed(session.track_url)} width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>
                                </div>
                            )}

                            {/* DJ Controls */}
                            {isHost && (
                                <div className="space-y-3 bg-ocean-card border border-ocean-border rounded-xl p-3 shadow-sm">
                                    <h4 className="text-xs font-bold text-ocean-text-dim uppercase tracking-wider px-1">DJ Controls</h4>
                                    <form onSubmit={(e) => {
                                        let finalUrl = newTrackUrl.trim();
                                        if (finalUrl && !finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
                                        setNewTrackUrl(finalUrl);
                                        handleAddTrack(e, finalUrl);
                                    }} className="flex gap-2">
                                        <input type="text" placeholder="Paste music link (Spotify, MP3)..." value={newTrackUrl}
                                            onChange={(e) => setNewTrackUrl(e.target.value)}
                                            className="flex-1 min-w-0 bg-ocean-surface border border-ocean-border rounded-xl px-3.5 py-2.5 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 placeholder:text-ocean-text-dim/60 shadow-inner" />
                                        <button type="submit" disabled={!newTrackUrl} className="shrink-0 px-4 py-2.5 bg-biolum text-biolum-foreground rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-40 transition-shadow">Add</button>
                                    </form>
                                    <div className="flex gap-2 pt-1 border-t border-ocean-divider/30">
                                        <button onClick={() => playNext()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-ocean-surface text-ocean-text border border-ocean-border rounded-xl text-sm font-bold hover:bg-ocean-card hover:border-ocean-border/80 transition-all shadow-sm">
                                            <SkipForward className="w-4 h-4" /> Skip Track
                                        </button>
                                        <button onClick={endSession} className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all">
                                            <X className="w-4 h-4" /> End Session
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Queue and History */}
                            <div className="space-y-4">
                                {/* UP NEXT */}
                                <div className="bg-ocean-surface/20 rounded-xl border border-ocean-border/50 p-1">
                                    <div className="px-3 py-2 border-b border-ocean-divider/30 flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-ocean-text-dim uppercase tracking-wider">Up Next</h4>
                                    </div>
                                    {session.tracks?.filter(t => t.status === 'pending').length > 0 ? (
                                        <div className="flex flex-col p-1 gap-1">
                                            {session.tracks.filter(t => t.status === 'pending').map((track, i) => (
                                                <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-ocean-card/50 border border-ocean-border/30 group hover:border-biolum/30 transition-all hover:shadow-sm">
                                                    <span className="text-xs font-bold text-ocean-text-dim w-5 text-center shrink-0">{i + 1}</span>
                                                    <Music className="w-4 h-4 text-ocean-text-dim shrink-0" />
                                                    <span className="text-sm font-semibold text-ocean-text truncate flex-1">{track.track_title}</span>
                                                    {isHost && (
                                                        <button onClick={() => playNext(track.id)} className="text-biolum bg-biolum/10 hover:bg-biolum/20 p-2 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-all shadow-sm" title="Play now">
                                                            <SkipForward className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center text-center opacity-60">
                                            <ListMusic className="w-8 h-8 text-ocean-text-dim mb-2 opacity-50" />
                                            <p className="text-sm text-ocean-text-dim font-medium">Queue is empty</p>
                                            {isHost ? <p className="text-xs text-ocean-text-dim mt-1">Add tracks using the input above.</p> : <p className="text-xs text-ocean-text-dim mt-1">Wait for the DJ to add tracks.</p>}
                                        </div>
                                    )}
                                </div>

                                {/* PLAYED HISTORY */}
                                {session.tracks?.filter(t => t.status === 'played').length > 0 && (
                                    <div className="bg-ocean-surface/10 rounded-xl border border-ocean-border/30 p-1 opacity-70">
                                        <div className="px-3 py-2 border-b border-ocean-divider/20 flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-ocean-text-dim uppercase tracking-wider">Recently Played</h4>
                                        </div>
                                        <div className="flex flex-col p-1 gap-1">
                                            {session.tracks.filter(t => t.status === 'played').sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5).map((track) => (
                                                <div key={track.id} className="flex items-center gap-3 p-2 px-3 rounded-lg bg-ocean-card/30 border border-transparent">
                                                    <Music className="w-3.5 h-3.5 text-ocean-text-dim/60 shrink-0" />
                                                    <span className="text-xs font-medium text-ocean-text-dim truncate flex-1 line-through decoration-ocean-text-dim/40">{track.track_title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Listeners Tab ─── */}
                    {activeTab === 'users' && (
                        <div className="p-4 flex flex-col gap-2">
                            {participants.length === 0 ? (
                                <p className="text-sm text-ocean-text-dim text-center py-8 italic">No listeners yet.</p>
                            ) : (
                                participants.map(u => {
                                    const isMe = u.id === auth?.user?.id;
                                    const isMuted = locallyMutedUsers.includes(u.id);
                                    return (
                                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-ocean-card border border-ocean-border hover:border-ocean-border/80 shadow-sm transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-ocean-surface border border-ocean-border/50 shrink-0">
                                                    <img src={u.profile_picture || '/images/default-avatar.png'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-sm font-bold text-ocean-text truncate block">
                                                        {u.name} {isMe && <span className="text-emerald-500 font-semibold ml-1 text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2">You</span>}
                                                    </span>
                                                    {u.is_host && <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-0.5"><Crown className="w-3 h-3" /> HOST</span>}
                                                </div>
                                            </div>
                                            {!isMe && (
                                                <button onClick={() => toggleLocalMute(u.id)}
                                                    className={`p-2.5 rounded-xl transition-colors ${isMuted ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' : 'text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface border border-transparent'}`}
                                                    title={isMuted ? "Unmute" : "Mute"}>
                                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ─── Chat Tab ─── */}
                    {activeTab === 'chat' && (
                        <div className="p-4 flex flex-col gap-4 relative">
                            {/* Popout Button */}
                            <button onClick={() => setIsChatPopout(true)} className="absolute top-2 right-4 flex items-center gap-1.5 p-1.5 rounded-lg bg-ocean-surface/60 text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-all text-[10px] font-bold z-10">
                                <Maximize2 className="w-3.5 h-3.5" /> Pop Out Chat
                            </button>

                            {chatMessages.length === 0 && (
                                <div className="py-8 flex flex-col items-center justify-center text-center opacity-60">
                                    <MessageCircle className="w-8 h-8 text-ocean-text-dim mb-2 opacity-50" />
                                    <p className="text-sm text-ocean-text-dim font-medium">No messages yet</p>
                                    <p className="text-xs text-ocean-text-dim mt-1">Be the first to say hello!</p>
                                </div>
                            )}
                            {chatMessages.map(m => {
                                const isMe = m.user_id === auth?.user?.id;
                                return (
                                    <div key={m.id} className={`flex gap-3 max-w-[90%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto border border-ocean-border/50 shadow-sm">
                                            <img src={m.user_avatar || '/images/default-avatar.png'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] font-bold text-ocean-text-dim mb-1 px-1">{m.user_name}</span>
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md border ${
                                                isMe 
                                                    ? 'bg-biolum text-biolum-foreground border-biolum/20 rounded-br-sm' 
                                                    : 'bg-ocean-card text-ocean-text border-ocean-border rounded-bl-sm'
                                            }`}>
                                                {m.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Chat Input — sticky at bottom when chat tab */}
                {activeTab === 'chat' && (
                    <form onSubmit={handleSendChat} className="px-4 py-3 border-t border-ocean-divider/40 flex gap-2 shrink-0">
                        <input type="text" placeholder="Type a message..." value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 min-w-0 bg-ocean-surface border border-ocean-border rounded-xl px-3.5 py-2.5 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 placeholder:text-ocean-text-dim" />
                        <button type="submit" disabled={!chatInput.trim()} className="shrink-0 p-2.5 bg-biolum text-biolum-foreground rounded-xl disabled:opacity-40">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>
            
            
            {/* ── CHAT POPOUT MODAL ── */}
            {isChatPopout && createPortal(
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.15s_ease-out]">
                    <div className="bg-ocean-deep border border-ocean-divider shadow-2xl rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-ocean-divider/50 flex justify-between items-center bg-ocean-card/50">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-biolum" />
                                <h3 className="font-bold text-ocean-text">Expanded Chat</h3>
                                <span className="text-xs font-medium text-ocean-text-dim px-2 py-0.5 rounded-full bg-ocean-surface">{session.session_name || 'Live Broadcast'}</span>
                            </div>
                            <button onClick={() => setIsChatPopout(false)} className="p-2 bg-ocean-surface hover:bg-ocean-card text-ocean-text-dim hover:text-rose-400 rounded-xl transition-colors">
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-ocean-deep/50 custom-scrollbar flex flex-col gap-6">
                            {chatMessages.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-60 m-auto">
                                    <MessageCircle className="w-12 h-12 text-ocean-text-dim mb-3 opacity-50" />
                                    <p className="text-lg text-ocean-text font-medium">No messages yet</p>
                                    <p className="text-sm text-ocean-text-dim mt-1">Be the first to say hello!</p>
                                </div>
                            )}
                            {chatMessages.map(m => {
                                const isMe = m.user_id === auth?.user?.id;
                                return (
                                    <div key={m.id} className={`flex gap-4 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-auto border border-ocean-border/50 shadow-sm">
                                            <img src={m.user_avatar || '/images/default-avatar.png'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs font-bold text-ocean-text-dim mb-1.5 px-1 flex items-center gap-2">
                                                {m.user_name} <span className="text-[10px] opacity-70 font-normal">{m.created_at}</span>
                                            </span>
                                            <div className={`px-5 py-4 rounded-3xl text-base leading-relaxed shadow-lg border ${
                                                isMe 
                                                    ? 'bg-biolum text-biolum-foreground border-biolum/20 rounded-br-sm' 
                                                    : 'bg-ocean-card text-ocean-text border-ocean-border rounded-bl-sm'
                                            }`}>
                                                {m.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatPopoutEndRef} />
                        </div>
                        
                        {/* Big Input Area */}
                        <form onSubmit={handleSendChat} className="px-6 py-4 border-t border-ocean-divider/40 flex gap-3 bg-ocean-card/30">
                            <input type="text" placeholder="Type a message..." value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-1 bg-ocean-surface border border-ocean-border rounded-xl px-5 py-4 text-base text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/30 placeholder:text-ocean-text-dim shadow-inner transition-all" />
                            <button type="submit" disabled={!chatInput.trim()} className="px-6 py-4 bg-biolum text-biolum-foreground font-bold rounded-xl disabled:opacity-40 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2">
                                Send <Send className="w-4 h-4 ml-1" />
                            </button>
                        </form>
                    </div>
                </div>, 
                document.body
            )}
            </>
        );
    }

    // ── COMPACT: Bottom bar only ──────────────────────────────────────
    return (
        <div className="border-t border-ocean-divider bg-ocean-card/98 backdrop-blur-xl shrink-0">
            <div
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-ocean-surface/30 transition-colors"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-biolum/25 to-ocean-divider shrink-0 flex items-center justify-center relative">
                    <Radio className="w-5 h-5 text-biolum" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-biolum rounded-full animate-pulse border-2 border-ocean-card" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ocean-text truncate leading-tight">
                        {session.session_name || session.current_track_title || 'Live Broadcast'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-biolum uppercase tracking-widest">Live</span>
                        <span className="text-xs text-ocean-text-dim flex items-center gap-1"><Users className="w-3 h-3" /> {listenerCount}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleMic(); }}
                        className={`p-2 rounded-xl transition-all ${!isMicEnabled ? 'text-ocean-text-dim' : isMicMuted ? 'text-rose-400' : 'text-biolum'}`}>
                        {isMicEnabled && !isMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <Maximize2 className="w-4 h-4 text-ocean-text-dim" />
                </div>
            </div>
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSpotifyEmbed(url) {
    if (!url) return '';
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
}

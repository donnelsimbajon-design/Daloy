import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
    PhoneOff, Video, VideoOff, Mic, MicOff,
    Monitor, MonitorOff, MessageSquare, X, Send,
    Minimize2, Maximize, Volume2, VolumeX, Users,
    Crown, UserX, Loader2, Pin, PinOff
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/shadcn/avatar';

export default function GroupCallOverlay({
    conversationId,
    conversationName,
    callData,
    isHost,
    onLeave,
    currentUser,
    participants: initialParticipants
}) {
    // ── Agora State ──────────────────────────────────────────────────
    const [remoteUsers, setRemoteUsers]       = useState([]);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localScreenTrack, setLocalScreenTrack] = useState(null);
    const [micMuted, setMicMuted]             = useState(false);
    const [videoMuted, setVideoMuted]         = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMinimized, setIsMinimized]       = useState(false);
    const [callDuration, setCallDuration]     = useState(0);
    const [showParticipants, setShowParticipants] = useState(false);

    // ── Chat ─────────────────────────────────────────────────────────
    const [isChatOpen, setIsChatOpen]   = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]     = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const lastChatIdRef = useRef(0);
    const chatEndRef    = useRef(null);

    // ── Participants ─────────────────────────────────────────────────
    const [participantsList, setParticipantsList] = useState(initialParticipants || []);
    const [mutedByHost, setMutedByHost]   = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);

    // ── Focus / Pin ──────────────────────────────────────────────────
    // pinnedUid: user explicitly clicked to focus (overrides screen share)
    const [pinnedUid, setPinnedUid] = useState(null);

    // ── Context Menu ─────────────────────────────────────────────────
    const [contextMenu, setContextMenu] = useState(null);
    // { x, y, uid, name, isMuted, isHostP, volume }
    const [ctxVolume, setCtxVolume] = useState(100);

    // ── Refs ─────────────────────────────────────────────────────────
    const clientRef           = useRef(null);
    const localVideoRef       = useRef(null);
    const localAudioTrackRef  = useRef(null);
    const callTimerRef        = useRef(null);
    const autoEndTimerRef     = useRef(null);
    const prevScreenSharerRef = useRef(null);
    const isLeavingRef        = useRef(false); // prevent double-leave
    const handleLeaveRef      = useRef(null);  // stable ref to handleLeave (avoids stale closure)

    // ── Callback ref for screen share div ────────────────────────────
    // This fires the INSTANT the div mounts — fixing the black-screen bug.
    const screenShareDivRef = useCallback((node) => {
        if (node && localScreenTrack) {
            localScreenTrack.play(node);
        }
    }, [localScreenTrack]);

    // ── Timer ─────────────────────────────────────────────────────────
    useEffect(() => {
        callTimerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
        return () => clearInterval(callTimerRef.current);
    }, []);

    const formatDuration = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        return `${m}:${(s % 60).toString().padStart(2, '0')}`;
    };

    // ── 15-second auto-end if no one joins ───────────────────────────
    useEffect(() => {
        if (!isHost) return;
        autoEndTimerRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/group-calls/${conversationId}/active`);
                if ((res.data.participants || []).length < 2) {
                    await axios.post(`/api/group-calls/${conversationId}/end`);
                    onLeave();
                }
            } catch (_) {}
        }, 15000);
        return () => clearTimeout(autoEndTimerRef.current);
    }, []);

    useEffect(() => {
        if (participantsList.length >= 2 && autoEndTimerRef.current) {
            clearTimeout(autoEndTimerRef.current);
            autoEndTimerRef.current = null;
        }
    }, [participantsList.length]);

    // ── Agora Connection ──────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        const init = async () => {
            try {
                await client.join(callData.app_id, callData.channel_name, callData.token, callData.uid);

                client.on('user-published', async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (!mounted) return;

                    setRemoteUsers(prev => {
                        const ex = prev.find(u => u.uid === user.uid);
                        return [
                            ...prev.filter(u => u.uid !== user.uid),
                            {
                                uid: user.uid,
                                hasVideo: mediaType === 'video' ? true  : (ex?.hasVideo  || false),
                                hasAudio: mediaType === 'audio' ? true  : (ex?.hasAudio  || false),
                                videoTrack: mediaType === 'video' ? user.videoTrack : (ex?.videoTrack || null),
                                audioTrack: mediaType === 'audio' ? user.audioTrack : (ex?.audioTrack || null),
                            }
                        ];
                    });

                    if (mediaType === 'video') {
                        // Try to play into whichever container exists
                        setTimeout(() => {
                            const focused  = document.getElementById(`focused-video-${user.uid}`);
                            const regular  = document.getElementById(`remote-video-${user.uid}`);
                            const container = focused || regular;
                            if (container) user.videoTrack?.play(container);
                        }, 300);
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                });

                client.on('user-unpublished', (user, mediaType) => {
                    setRemoteUsers(prev => prev.map(u => {
                        if (u.uid !== user.uid) return u;
                        return {
                            ...u,
                            hasVideo:   mediaType === 'video' ? false : u.hasVideo,
                            videoTrack: mediaType === 'video' ? null  : u.videoTrack,
                            hasAudio:   mediaType === 'audio' ? false : u.hasAudio,
                            audioTrack: mediaType === 'audio' ? null  : u.audioTrack,
                        };
                    }));
                });

                client.on('user-left', (user) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                if (callData.role !== 'listener') {
                    try {
                        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                        if (mounted) {
                            localAudioTrackRef.current = audioTrack;
                            await client.publish([audioTrack]);
                        } else {
                            audioTrack.close();
                        }
                    } catch (err) {
                        console.warn('Mic denied:', err);
                    }
                }
            } catch (err) {
                console.error('Agora join failed:', err);
            }
        };

        init();

        // NOTE: do NOT call client.leave() on unmount caused by navigation.
        // The component lives at root level and should only disconnect on explicit leave.
        return () => { mounted = false; };
    }, []);

    // ── Before Unload Warning ─────────────────────────────────────────
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // ── Poll participants + mute status ───────────────────────────────
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await axios.get(`/api/group-calls/${conversationId}/active`);
                if (!res.data.active) {
                    // Call was ended by host — use ref to avoid stale closure
                    handleLeaveRef.current?.(true);
                    return;
                }

                const ptcps = res.data.participants || [];
                setParticipantsList(ptcps);

                const me = ptcps.find(p => p.user_id === currentUser.id);
                if (me?.is_muted_by_host && !mutedByHost) {
                    setMutedByHost(true);
                    const t = localAudioTrackRef.current;
                    if (t) { await t.setMuted(true); setMicMuted(true); }
                } else if (!me?.is_muted_by_host && mutedByHost) {
                    setMutedByHost(false);
                }
            } catch (_) {}
        }, 3000);
        return () => clearInterval(poll);
    }, [conversationId, mutedByHost]);

    // ── Poll chat (1 s) ───────────────────────────────────────────────
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await axios.get(`/api/group-calls/${conversationId}/chat`, {
                    params: { after_id: lastChatIdRef.current }
                });
                const msgs = res.data.messages || [];
                if (msgs.length > 0) {
                    setChatMessages(prev => {
                        const ids = new Set(prev.map(m => String(m.id)));
                        const unique = msgs.filter(m => !ids.has(String(m.id)));
                        return unique.length > 0 ? [...prev, ...unique] : prev;
                    });
                    lastChatIdRef.current = msgs[msgs.length - 1].id;
                }
            } catch (_) {}
        }, 1000);
        return () => clearInterval(poll);
    }, [conversationId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // ── Replay remote screen share when polled state changes ──────────
    useEffect(() => {
        const rss = participantsList.find(p => p.is_screen_sharing && p.user_id !== currentUser?.id);
        const rssId = rss?.user_id || null;
        if (rssId !== prevScreenSharerRef.current) {
            prevScreenSharerRef.current = rssId;
            if (rssId) {
                const u = remoteUsers.find(r => r.uid === rssId);
                if (u?.videoTrack) {
                    setTimeout(() => {
                        const el = document.getElementById(`focused-video-${rssId}`);
                        if (el) u.videoTrack.play(el);
                    }, 300);
                }
            }
        }
    }, [participantsList, remoteUsers]);

    // ── Replay remote video when pinned user changes ──────────────────
    useEffect(() => {
        if (!pinnedUid) return;
        const u = remoteUsers.find(r => r.uid === pinnedUid);
        if (u?.videoTrack) {
            setTimeout(() => {
                const el = document.getElementById(`focused-video-${pinnedUid}`);
                if (el) u.videoTrack.play(el);
            }, 300);
        }
    }, [pinnedUid]);

    // ── Music mute ────────────────────────────────────────────────────
    useEffect(() => {
        document.querySelectorAll('audio, video.platform-audio').forEach(el => {
            if (el.id !== 'group-call-audio') el.muted = isMusicMuted;
        });
        window.dispatchEvent(new CustomEvent('daloy:mute-music', { detail: { muted: isMusicMuted } }));
    }, [isMusicMuted]);

    // ── Close context menu on outside click ───────────────────────────
    useEffect(() => {
        if (!contextMenu) return;
        const h = () => setContextMenu(null);
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, [contextMenu]);

    // ── Actions ───────────────────────────────────────────────────────
    const toggleMic = async () => {
        if (mutedByHost || callData.role === 'listener') return;
        const t = localAudioTrackRef.current;
        if (t) {
            const next = !micMuted;
            await t.setMuted(next);
            setMicMuted(next);
        }
    };

    const toggleVideo = async () => {
        if (callData.role === 'listener') return;
        if (videoMuted) {
            try {
                const vt = await AgoraRTC.createCameraVideoTrack();
                setLocalVideoTrack(vt);
                await clientRef.current.publish([vt]);
                setVideoMuted(false);
                if (localVideoRef.current) vt.play(localVideoRef.current);
            } catch (err) { console.error('Camera error:', err); }
        } else {
            if (localVideoTrack) {
                await clientRef.current.unpublish([localVideoTrack]);
                localVideoTrack.stop();
                localVideoTrack.close();
                setLocalVideoTrack(null);
            }
            setVideoMuted(true);
        }
    };

    const toggleScreenShare = async () => {
        if (callData.role === 'listener') return;
        if (isScreenSharing) {
            if (localScreenTrack) {
                await clientRef.current.unpublish([localScreenTrack]).catch(() => {});
                localScreenTrack.stop();
                localScreenTrack.close();
                setLocalScreenTrack(null);
            }
            setIsScreenSharing(false);
            axios.post(`/api/group-calls/${conversationId}/screenshare`, { is_screen_sharing: false }).catch(() => {});
        } else {
            try {
                const raw = await AgoraRTC.createScreenVideoTrack(
                    { encoderConfig: '1080p_2', optimizationMode: 'detail' },
                    'auto'
                );
                const vt = Array.isArray(raw) ? raw[0] : raw;

                if (localVideoTrack) {
                    await clientRef.current.unpublish([localVideoTrack]);
                    localVideoTrack.stop();
                    localVideoTrack.close();
                    setLocalVideoTrack(null);
                    setVideoMuted(true);
                }

                // Set track first — callback ref will auto-play once div mounts
                setLocalScreenTrack(vt);
                await clientRef.current.publish(Array.isArray(raw) ? raw : [vt]);
                setIsScreenSharing(true);
                // Clear any pin so focused view switches to screen share
                setPinnedUid(null);
                axios.post(`/api/group-calls/${conversationId}/screenshare`, { is_screen_sharing: true }).catch(() => {});

                vt.on('track-ended', () => {
                    clientRef.current.unpublish([vt]).catch(() => {});
                    vt.close();
                    setLocalScreenTrack(null);
                    setIsScreenSharing(false);
                    axios.post(`/api/group-calls/${conversationId}/screenshare`, { is_screen_sharing: false }).catch(() => {});
                });
            } catch (err) {
                if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('NotAllowed') || err?.message?.includes('PERMISSION_DENIED')) {
                    alert('Screen sharing was denied. Please allow screen recording in your browser/OS and try again.');
                }
                // Ignore Cancel silently
            }
        }
    };

    const handleHostMute = async (userId, mute = true) => {
        try { await axios.post(`/api/group-calls/${conversationId}/mute/${userId}`, { mute }); }
        catch (e) { console.error(e); }
    };

    const handleKickUser = async (userId) => {
        if (!isHost) return;
        try {
            await axios.post(`/api/group-calls/${conversationId}/kick/${userId}`);
            setParticipantsList(prev => prev.filter(p => p.user_id !== userId));
        } catch (e) { console.error(e); }
    };

    const handleMuteAll = async () => {
        if (!isHost) return;
        const targets = participantsList.filter(p => p.role !== 'host');
        await Promise.all(targets.map(p =>
            axios.post(`/api/group-calls/${conversationId}/mute/${p.user_id}`, { mute: true })
        )).catch(() => {});
    };

    const handleLeave = async (forced = false) => {
        if (isLeavingRef.current) return; // prevent double-call
        isLeavingRef.current = true;

        clearTimeout(autoEndTimerRef.current);

        // Stop and close all local tracks
        try { localAudioTrackRef.current?.stop(); } catch(_){}
        try { localAudioTrackRef.current?.close(); } catch(_){}
        try { localVideoTrack?.stop(); localVideoTrack?.close(); } catch(_){}
        try { localScreenTrack?.stop(); localScreenTrack?.close(); } catch(_){}

        // Leave Agora channel
        try { await clientRef.current?.leave(); } catch(_){}

        // Notify backend
        if (!forced) {
            try {
                await axios.post(`/api/group-calls/${conversationId}/${isHost ? 'end' : 'leave'}`);
            } catch(_){}
        }

        window.dispatchEvent(new CustomEvent('daloy:mute-music', { detail: { muted: false } }));
        onLeave();
    };

    // Keep handleLeaveRef current so polling useEffect can call it without stale closure
    handleLeaveRef.current = handleLeave;

    const handleSendChat = async (e) => {
        e?.preventDefault();
        const txt = chatInput.trim();
        if (!txt || sendingChat) return;
        setSendingChat(true);
        setChatInput('');
        const optimistic = { id: `temp-${Date.now()}`, user: currentUser, content: txt, created_at: new Date().toISOString() };
        setChatMessages(p => [...p, optimistic]);
        try {
            const res = await axios.post(`/api/group-calls/${conversationId}/chat`, { content: txt });
            setChatMessages(p => p.map(m => m.id === optimistic.id ? res.data : m));
            if (res.data.id > lastChatIdRef.current) lastChatIdRef.current = res.data.id;
        } catch {
            setChatMessages(p => p.filter(m => m.id !== optimistic.id));
        } finally {
            setSendingChat(false);
        }
    };

    // ── Right-click context menu ──────────────────────────────────────
    const openContextMenu = (e, uid) => {
        e.preventDefault();
        if (uid === currentUser?.id) return;
        const pInfo  = participantsList.find(p => p.user_id === uid);
        const remote = remoteUsers.find(r => r.uid === uid);
        // Clamp to viewport
        const x = Math.min(e.clientX, window.innerWidth  - 220);
        const y = Math.min(e.clientY, window.innerHeight - 200);
        setContextMenu({
            x, y, uid,
            name:     pInfo?.user?.name || `User ${uid}`,
            isMuted:  pInfo?.is_muted_by_host || false,
            isHostP:  pInfo?.role === 'host',
            audioTrack: remote?.audioTrack || null,
        });
        // Initialise slider from track's current volume
        setCtxVolume(remote?.audioTrack ? 100 : 100);
    };

    // ── Pin logic: what is the "focused/big" user? ────────────────────
    const remoteScreenSharer  = participantsList.find(p => p.is_screen_sharing && p.user_id !== currentUser?.id);
    const screenSharingUserId = isScreenSharing ? currentUser?.id : (remoteScreenSharer?.user_id || null);
    // Priority: screen share > manual pin
    const focusedUserId = screenSharingUserId || pinnedUid;

    const allParticipantUids = [currentUser?.id, ...remoteUsers.map(u => u.uid)].filter(Boolean);

    // ── Tile renderer ─────────────────────────────────────────────────
    const renderTile = (uid, size = 'normal') => {
        const isLocal  = uid === currentUser?.id;
        const pInfo    = participantsList.find(p => p.user_id === uid);
        const remote   = !isLocal ? remoteUsers.find(u => u.uid === uid) : null;
        const name     = isLocal ? 'You' : (pInfo?.user?.name || `User ${uid}`);
        const avatar   = isLocal ? currentUser?.profile_picture : pInfo?.user?.profile_picture;
        const isHostP  = pInfo?.role === 'host' || (isLocal && isHost);
        const isMuted  = isLocal ? (micMuted || mutedByHost) : pInfo?.is_muted_by_host;
        const isPinned = uid === pinnedUid && !screenSharingUserId;
        // When somebody is screen-sharing, don't show their camera in their tile
        const showVideo = isLocal
            ? !videoMuted && !isScreenSharing
            : (remote?.hasVideo && uid !== screenSharingUserId);
        const small = size === 'small';

        return (
            <div
                key={uid}
                className={`relative bg-zinc-900/80 rounded-2xl overflow-hidden flex items-center justify-center ring-1 select-none cursor-pointer
                    ${isPinned ? 'ring-biolum/60' : 'ring-white/10'}
                    ${small ? 'min-h-[100px]' : 'min-h-[200px] w-full h-full'}
                    group transition-all duration-200 hover:ring-white/30`}
                onClick={() => {
                    if (!isLocal) {
                        // Toggle pin — clicking pinned tile again unpins
                        setPinnedUid(prev => prev === uid ? null : uid);
                    }
                }}
                onContextMenu={(e) => openContextMenu(e, uid)}
            >
                {isLocal && showVideo ? (
                    <div ref={localVideoRef} className="w-full h-full" />
                ) : !isLocal && showVideo ? (
                    <div id={`remote-video-${uid}`} className="w-full h-full" />
                ) : (
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Avatar className={`ring-2 ring-white/10 ${small ? 'w-10 h-10' : 'w-20 h-20'}`}>
                            {avatar && <AvatarImage src={avatar} />}
                            <AvatarFallback className="bg-ocean-deep text-ocean-text font-medium text-lg">
                                {name[0]}
                            </AvatarFallback>
                        </Avatar>
                        {!small && <span className="text-white/80 text-sm font-medium">{name}</span>}
                    </div>
                )}

                {/* Nameplate */}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
                    {isMuted    && <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
                    {isHostP    && <Crown  className="w-3 h-3 text-amber-400 shrink-0" />}
                    {isPinned   && <Pin    className="w-3 h-3 text-biolum shrink-0" />}
                    <span className="text-white text-[11px] font-medium truncate">{name}{isLocal && ' (You)'}</span>
                </div>

                {/* Host mute/unmute hover button */}
                {isHost && !isLocal && !isHostP && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleHostMute(uid, !pInfo?.is_muted_by_host); }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title={pInfo?.is_muted_by_host ? 'Unmute' : 'Mute'}
                    >
                        {pInfo?.is_muted_by_host
                            ? <Mic    className="w-3.5 h-3.5 text-emerald-400" />
                            : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                )}

                {/* Click hint */}
                {!isLocal && !small && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white/50 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Click to focus
                    </div>
                )}
            </div>
        );
    };

    // ── Minimized PIP ─────────────────────────────────────────────────
    if (isMinimized) {
        return (
            <div
                className="fixed top-20 right-6 z-[200] w-56 bg-ocean-card/95 backdrop-blur-xl border border-ocean-divider rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setIsMinimized(false)}
            >
                <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-ocean-text text-xs font-semibold truncate">{conversationName}</span>
                        </div>
                        <span className="text-ocean-text-dim text-xs font-mono">{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-biolum" />
                        <span className="text-ocean-text-dim text-xs">{participantsList.length} in call</span>
                    </div>
                </div>
                <div className="flex border-t border-ocean-divider">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-biolum text-xs hover:bg-white/5 cursor-pointer"
                    >
                        <Maximize className="w-3 h-3" /> Expand
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLeave(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-rose-400 text-xs hover:bg-rose-500/10 cursor-pointer border-l border-ocean-divider"
                    >
                        <PhoneOff className="w-3 h-3" /> Leave
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    return (
        <>
        {/* ── Context Menu ─────────────────────────────────────────── */}
        {contextMenu && (
            <div
                className="fixed z-[300] bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-56"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-white/10 bg-black/20">
                    <p className="text-white text-sm font-semibold truncate">{contextMenu.name}</p>
                </div>

                {/* Volume Slider — always visible */}
                <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/60 text-xs flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Volume
                        </span>
                        <span className="text-white text-xs font-mono">{ctxVolume}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={ctxVolume}
                        onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setCtxVolume(v);
                            // Adjust Agora remote audio track volume (0-1000 scale, 100 = 100%)
                            contextMenu.audioTrack?.setVolume(v);
                        }}
                        className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-biolum cursor-pointer"
                    />
                    <div className="flex justify-between text-white/30 text-[10px] mt-1">
                        <span>0%</span><span>100%</span>
                    </div>
                </div>

                {/* Host actions */}
                {isHost && !contextMenu.isHostP && (
                    <>
                        <button
                            onClick={() => {
                                handleHostMute(contextMenu.uid, !contextMenu.isMuted);
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-white text-sm cursor-pointer transition-colors"
                        >
                            {contextMenu.isMuted
                                ? <Mic    className="w-4 h-4 text-emerald-400" />
                                : <MicOff className="w-4 h-4 text-rose-400" />}
                            {contextMenu.isMuted ? 'Unmute User' : 'Mute User'}
                        </button>
                        <button
                            onClick={() => { handleKickUser(contextMenu.uid); setContextMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/20 text-rose-400 text-sm cursor-pointer transition-colors"
                        >
                            <UserX className="w-4 h-4" /> Remove from Call
                        </button>
                    </>
                )}

                {/* Pin/Unpin */}
                <button
                    onClick={() => {
                        setPinnedUid(prev => prev === contextMenu.uid ? null : contextMenu.uid);
                        setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-white text-sm cursor-pointer transition-colors"
                >
                    {pinnedUid === contextMenu.uid
                        ? <><PinOff className="w-4 h-4 text-white/50" /> Unpin</>
                        : <><Pin    className="w-4 h-4 text-biolum"    /> Pin (Focus)</>
                    }
                </button>

                <button
                    onClick={() => setContextMenu(null)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/40 text-sm cursor-pointer transition-colors border-t border-white/10"
                >
                    <X className="w-4 h-4" /> Cancel
                </button>
            </div>
        )}

        {/* ── Main overlay ─────────────────────────────────────────── */}
        <div className="fixed inset-0 z-[200] flex bg-zinc-950 overflow-hidden">

            {/* Left: video area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <h2 className="text-white font-bold text-lg">{conversationName}</h2>
                            <p className="text-white/50 text-sm">{participantsList.length} participants · {formatDuration(callDuration)}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Video / Grid */}
                <div className="flex-1 overflow-hidden p-4 pt-20 pb-24">
                    {focusedUserId ? (
                        /* ── Focused view (screen share OR pinned) ── */
                        <div className="flex gap-3 h-full">
                            {/* Big tile */}
                            <div className="flex-1 bg-black rounded-2xl overflow-hidden ring-1 ring-white/10 relative flex items-center justify-center">
                                {/* Screen sharer sees their own screen via callback ref */}
                                {isScreenSharing && focusedUserId === currentUser?.id ? (
                                    <div ref={screenShareDivRef} className="w-full h-full" />
                                ) : (
                                    /* Remote screen share or pinned camera */
                                    <div id={`focused-video-${focusedUserId}`} className="w-full h-full" />
                                )}

                                {/* Label */}
                                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none">
                                    {screenSharingUserId ? (
                                        <><Monitor className="w-4 h-4 text-biolum" />
                                        <span className="text-white text-sm font-medium">
                                            {focusedUserId === currentUser?.id ? "You" : participantsList.find(p => p.user_id === focusedUserId)?.user?.name || "Someone"}'s screen
                                        </span>
                                        <span className="text-biolum text-[10px] font-bold bg-biolum/20 px-1.5 py-0.5 rounded animate-pulse">LIVE</span></>
                                    ) : (
                                        <><Pin className="w-4 h-4 text-biolum" />
                                        <span className="text-white text-sm font-medium">
                                            {participantsList.find(p => p.user_id === focusedUserId)?.user?.name || `User ${focusedUserId}`}
                                        </span></>
                                    )}
                                </div>

                                {/* Unpin / stop share button */}
                                {!screenSharingUserId && pinnedUid && (
                                    <button
                                        onClick={() => setPinnedUid(null)}
                                        className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black/90 text-white/70 hover:text-white rounded-lg cursor-pointer transition-colors"
                                        title="Unpin"
                                    >
                                        <PinOff className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Sidebar: all participant tiles */}
                            <div className="w-[190px] flex flex-col gap-2.5 overflow-y-auto shrink-0">
                                {allParticipantUids.map(uid => renderTile(uid, 'small'))}
                            </div>
                        </div>
                    ) : (
                        /* ── Normal grid ── */
                        <div className="h-full flex items-center justify-center">
                            <div className={`grid gap-4 w-full h-full max-w-6xl ${
                                allParticipantUids.length === 1 ? 'grid-cols-1 max-w-3xl' :
                                allParticipantUids.length <= 2 ? 'grid-cols-2' :
                                allParticipantUids.length <= 4 ? 'grid-cols-2' :
                                'grid-cols-3'
                            }`}>
                                {allParticipantUids.map(uid => renderTile(uid, 'normal'))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-black/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl z-20">
                    {/* Mic */}
                    <button
                        onClick={toggleMic}
                        disabled={mutedByHost || callData.role === 'listener'}
                        title={mutedByHost ? 'Muted by host' : micMuted ? 'Unmute' : 'Mute'}
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                            micMuted || mutedByHost
                                ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {micMuted || mutedByHost ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    {/* Camera */}
                    <button
                        onClick={toggleVideo}
                        disabled={callData.role === 'listener'}
                        title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                            videoMuted ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        {videoMuted ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Screen share */}
                    <button
                        onClick={toggleScreenShare}
                        disabled={callData.role === 'listener'}
                        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                            isScreenSharing
                                ? 'bg-biolum text-black ring-2 ring-biolum ring-offset-1 ring-offset-black shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <div className="w-px h-8 bg-white/10" />

                    {/* Chat */}
                    <button
                        onClick={() => { setIsChatOpen(v => !v); setShowParticipants(false); }}
                        className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                            isChatOpen ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        {chatMessages.length > 0 && !isChatOpen && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-biolum rounded-full animate-pulse" />
                        )}
                    </button>

                    {/* Background music */}
                    <button
                        onClick={() => setIsMusicMuted(v => !v)}
                        title={isMusicMuted ? 'Unmute background music' : 'Mute background music'}
                        className={`p-3 rounded-xl transition-all cursor-pointer ${
                            isMusicMuted ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {isMusicMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    {/* Participants count */}
                    <button
                        onClick={() => { setShowParticipants(v => !v); setIsChatOpen(false); }}
                        className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            showParticipants ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-bold">{participantsList.length}</span>
                    </button>

                    {/* Host — mute all */}
                    {isHost && (
                        <>
                            <div className="w-px h-8 bg-white/10" />
                            <button
                                onClick={handleMuteAll}
                                title="Mute all"
                                className="p-3 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 transition-all cursor-pointer"
                            >
                                <VolumeX className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <div className="w-px h-8 bg-white/10" />

                    {/* Leave */}
                    <button
                        onClick={() => handleLeave()}
                        title={isHost ? 'End call for everyone' : 'Leave call'}
                        className="p-3 sm:p-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
                    >
                        <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>

            {/* ── Chat Sidebar ──────────────────────────────────────────── */}
            {isChatOpen && (
                <div className="w-[340px] shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col z-20">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 shrink-0">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-biolum" /> In-Call Chat
                        </h3>
                        <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/60 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-white/30 text-sm py-10">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p>No messages yet</p>
                                <p className="text-xs mt-1 text-white/20">Start chatting with your group</p>
                            </div>
                        )}
                        {chatMessages.map((msg, i) => {
                            const isMe      = msg.user?.id === currentUser?.id;
                            const isPending = String(msg.id).startsWith('temp-');
                            return (
                                <div key={msg.id || i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <Avatar className="w-7 h-7 shrink-0">
                                            {msg.user?.profile_picture && <AvatarImage src={msg.user.profile_picture} />}
                                            <AvatarFallback className="bg-ocean-deep text-[10px] text-ocean-text">
                                                {msg.user?.name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[78%] ${isMe ? 'text-right' : ''}`}>
                                        {!isMe && (
                                            <span className="text-white/40 text-[10px] block mb-0.5 ml-1">{msg.user?.name}</span>
                                        )}
                                        <div className={`inline-block px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                                            isMe
                                                ? `bg-biolum/25 text-biolum rounded-br-sm ${isPending ? 'opacity-60' : ''}`
                                                : 'bg-white/10 text-white/90 rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex gap-2 shrink-0">
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-biolum/50"
                            maxLength={500}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || sendingChat}
                            className="p-2.5 rounded-full bg-biolum hover:bg-biolum/80 text-black disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                        >
                            {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Participants Drawer ───────────────────────────────────── */}
            {showParticipants && (
                <div className="w-[300px] shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col z-20">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 shrink-0">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-biolum" /> Participants ({participantsList.length})
                        </h3>
                        <button onClick={() => setShowParticipants(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/60 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
                        {participantsList.map(p => {
                            const isMe          = p.user_id === currentUser?.id;
                            const isParticipantHost = p.role === 'host';
                            return (
                                <div
                                    key={p.user_id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                                    onContextMenu={(e) => openContextMenu(e, p.user_id)}
                                >
                                    <Avatar className="w-9 h-9 ring-1 ring-white/10 shrink-0">
                                        {p.user?.profile_picture && <AvatarImage src={p.user.profile_picture} />}
                                        <AvatarFallback className="bg-ocean-deep text-ocean-text text-sm">
                                            {p.user?.name?.[0] || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-white text-sm font-medium truncate">{p.user?.name || 'Unknown'}</span>
                                            {isMe               && <span className="text-biolum text-[10px] font-bold shrink-0">(You)</span>}
                                            {isParticipantHost  && <Crown   className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                            {p.is_screen_sharing && <Monitor className="w-3.5 h-3.5 text-biolum shrink-0" />}
                                        </div>
                                        <span className="text-white/40 text-[10px] capitalize">{p.role || 'member'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {p.is_muted_by_host && <MicOff className="w-3.5 h-3.5 text-rose-400/60" />}
                                        {isHost && !isMe && !isParticipantHost && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleHostMute(p.user_id, !p.is_muted_by_host)}
                                                    title={p.is_muted_by_host ? 'Unmute' : 'Mute'}
                                                    className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
                                                >
                                                    {p.is_muted_by_host
                                                        ? <Mic    className="w-3.5 h-3.5 text-emerald-400" />
                                                        : <MicOff className="w-3.5 h-3.5 text-white/60" />}
                                                </button>
                                                <button
                                                    onClick={() => handleKickUser(p.user_id)}
                                                    title="Remove"
                                                    className="p-1 rounded-full hover:bg-rose-500/20 cursor-pointer"
                                                >
                                                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isHost && (
                        <div className="p-3 border-t border-white/10 shrink-0">
                            <button
                                onClick={handleMuteAll}
                                className="w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                            >
                                <VolumeX className="w-4 h-4" /> Mute All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    Monitor, MonitorOff, MessageSquare, X, Send,
    Minimize2, Maximize, Volume2, VolumeX, Users,
    Crown, UserX, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/shadcn/avatar';

export default function GroupCallOverlay({
    conversationId,
    conversationName,
    callData, // { group_call_id, token, app_id, channel_name, uid, role }
    isHost,
    onLeave,
    currentUser,
    participants: initialParticipants
}) {
    // ── Agora State ─────────────────────────────────────────────────
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [localScreenTrack, setLocalScreenTrack] = useState(null);
    const [micMuted, setMicMuted] = useState(callData.role === 'listener');
    const [videoMuted, setVideoMuted] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // ── Chat State ──────────────────────────────────────────────────
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const lastChatIdRef = useRef(0);
    const chatEndRef = useRef(null);

    // ── Participants State ──────────────────────────────────────────
    const [participantsList, setParticipantsList] = useState(initialParticipants || []);
    const [mutedByHost, setMutedByHost] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);

    // ── Refs ─────────────────────────────────────────────────────────
    const clientRef = useRef(null);
    const localVideoRef = useRef(null);
    const callTimerRef = useRef(null);

    // ── Timer ────────────────────────────────────────────────────────
    useEffect(() => {
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(callTimerRef.current);
    }, []);

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Agora Connection ─────────────────────────────────────────────
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
                        const filtered = prev.filter(u => u.uid !== user.uid);
                        return [...filtered, user];
                    });

                    if (mediaType === 'video') {
                        setTimeout(() => {
                            const container = document.getElementById(`remote-video-${user.uid}`);
                            if (container) user.videoTrack?.play(container);
                        }, 200);
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                });

                client.on('user-unpublished', (user, mediaType) => {
                    if (mediaType === 'video') {
                        setRemoteUsers(prev => prev.map(u =>
                            u.uid === user.uid ? { ...u, hasVideo: false } : u
                        ));
                    }
                });

                client.on('user-left', (user) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                // Only create audio for speakers/hosts
                if (callData.role !== 'listener') {
                    try {
                        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                        if (mounted) {
                            setLocalAudioTrack(audioTrack);
                            await client.publish([audioTrack]);
                        } else {
                            audioTrack.close();
                        }
                    } catch (err) {
                        console.warn('Mic access denied, joining as listener:', err);
                    }
                }
            } catch (err) {
                console.error('Agora group call failed:', err);
            }
        };

        init();

        return () => {
            mounted = false;
            localAudioTrack?.stop(); localAudioTrack?.close();
            localVideoTrack?.stop(); localVideoTrack?.close();
            localScreenTrack?.stop(); localScreenTrack?.close();
            client.leave().catch(() => {});
        };
    }, []);

    // ── Poll participants + mute status ──────────────────────────────
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const [activeRes, muteRes] = await Promise.all([
                    axios.get(`/api/group-calls/${conversationId}/active`),
                    axios.get(`/api/group-calls/${conversationId}/mute-status`)
                ]);

                if (!activeRes.data.active) {
                    // Call ended by host
                    handleLeave(true);
                    return;
                }

                setParticipantsList(activeRes.data.participants || []);

                // Check if I'm muted by host
                const myMuteStatus = (muteRes.data.participants || [])
                    .find(p => p.user_id === currentUser.id);
                if (myMuteStatus?.is_muted_by_host && !mutedByHost) {
                    setMutedByHost(true);
                    if (localAudioTrack) {
                        await localAudioTrack.setMuted(true);
                        setMicMuted(true);
                    }
                } else if (!myMuteStatus?.is_muted_by_host && mutedByHost) {
                    setMutedByHost(false);
                }
            } catch (e) {}
        }, 3000);

        return () => clearInterval(poll);
    }, [conversationId, localAudioTrack, mutedByHost]);

    // ── Poll chat messages ───────────────────────────────────────────
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await axios.get(`/api/group-calls/${conversationId}/chat`, {
                    params: { after_id: lastChatIdRef.current }
                });
                const newMsgs = res.data.messages || [];
                if (newMsgs.length > 0) {
                    setChatMessages(prev => [...prev, ...newMsgs]);
                    lastChatIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
            } catch (e) {}
        }, 2000);

        return () => clearInterval(poll);
    }, [conversationId]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // ── Mute Music (stop all platform audio) ─────────────────────────
    useEffect(() => {
        // Find and mute/unmute all audio/video elements on the page (background music)
        const mediaElements = document.querySelectorAll('audio, video.platform-audio');
        mediaElements.forEach(el => {
            if (el.id !== 'group-call-audio') {
                el.muted = isMusicMuted;
            }
        });

        // Dispatch event for GlobalAudioLayer to respond
        window.dispatchEvent(new CustomEvent('daloy:mute-music', {
            detail: { muted: isMusicMuted }
        }));
    }, [isMusicMuted]);

    // ── Actions ──────────────────────────────────────────────────────
    const toggleMic = async () => {
        if (mutedByHost || callData.role === 'listener') return; 
        if (localAudioTrack) {
            await localAudioTrack.setMuted(!micMuted);
            setMicMuted(!micMuted);
        }
    };

    const toggleVideo = async () => {
        if (callData.role === 'listener') return;
        if (videoMuted) {
            // Enable video
            try {
                const videoTrack = await AgoraRTC.createCameraVideoTrack();
                setLocalVideoTrack(videoTrack);
                await clientRef.current.publish([videoTrack]);
                setVideoMuted(false);
                if (localVideoRef.current) videoTrack.play(localVideoRef.current);
            } catch (err) {
                console.error('Camera access denied:', err);
            }
        } else {
            // Disable video
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
            // Stop screen share
            if (localScreenTrack) {
                await clientRef.current.unpublish([localScreenTrack]);
                localScreenTrack.stop();
                localScreenTrack.close();
                setLocalScreenTrack(null);
            }
            setIsScreenSharing(false);
        } else {
            // Start screen share
            try {
                const screenTrack = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: '1080p_2',
                    optimizationMode: 'detail'
                }, 'auto');

                // screenTrack can be [videoTrack, audioTrack] or just videoTrack
                const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

                // If we have a camera track, unpublish it first
                if (localVideoTrack) {
                    await clientRef.current.unpublish([localVideoTrack]);
                    localVideoTrack.stop();
                    localVideoTrack.close();
                    setLocalVideoTrack(null);
                    setVideoMuted(true);
                }

                setLocalScreenTrack(videoTrack);
                await clientRef.current.publish(Array.isArray(screenTrack) ? screenTrack : [videoTrack]);
                setIsScreenSharing(true);

                // Listen for the user stopping screen share via browser UI
                videoTrack.on('track-ended', () => {
                    clientRef.current.unpublish([videoTrack]).catch(() => {});
                    videoTrack.close();
                    setLocalScreenTrack(null);
                    setIsScreenSharing(false);
                });
            } catch (err) {
                console.error('Screen share failed:', err);
            }
        }
    };

    const handleHostMute = async (userId) => {
        try {
            await axios.post(`/api/group-calls/${conversationId}/mute/${userId}`, { mute: true });
        } catch (e) {
            console.error(e);
        }
    };

    const handleHostUnmute = async (userId) => {
        try {
            await axios.post(`/api/group-calls/${conversationId}/mute/${userId}`, { mute: false });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendChat = async (e) => {
        e?.preventDefault();
        if (!chatInput.trim() || sendingChat) return;
        setSendingChat(true);
        const content = chatInput.trim();
        setChatInput('');

        // Optimistic
        const optimistic = {
            id: Date.now(),
            user: currentUser,
            content,
            created_at: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, optimistic]);

        try {
            await axios.post(`/api/group-calls/${conversationId}/chat`, { content });
        } catch (e) {
            console.error(e);
        } finally {
            setSendingChat(false);
        }
    };

    const handleLeave = async (forcedEnd = false) => {
        localAudioTrack?.stop(); localAudioTrack?.close();
        localVideoTrack?.stop(); localVideoTrack?.close();
        localScreenTrack?.stop(); localScreenTrack?.close();

        if (clientRef.current) {
            await clientRef.current.leave().catch(() => {});
        }

        if (!forcedEnd) {
            try {
                if (isHost) {
                    await axios.post(`/api/group-calls/${conversationId}/end`);
                } else {
                    await axios.post(`/api/group-calls/${conversationId}/leave`);
                }
            } catch (e) {}
        }

        // Unmute music on leave
        window.dispatchEvent(new CustomEvent('daloy:mute-music', { detail: { muted: false } }));
        onLeave();
    };

    // ── Minimized PIP View ───────────────────────────────────────────
    if (isMinimized) {
        return (
            <div
                className="fixed top-20 right-6 z-[200] w-56 bg-ocean-card/95 backdrop-blur-xl border border-ocean-divider rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => setIsMinimized(false)}
            >
                <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-ocean-text text-xs font-semibold truncate">{conversationName}</span>
                        </div>
                        <span className="text-ocean-text-dim text-xs font-mono">{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-biolum" />
                        <span className="text-ocean-text-dim text-xs">{participantsList.length} in call</span>
                    </div>
                </div>
                <div className="flex border-t border-ocean-divider">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-biolum text-xs hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <Maximize className="w-3.5 h-3.5" /> Expand
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLeave(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-rose-400 text-xs hover:bg-rose-500/10 transition-colors cursor-pointer border-l border-ocean-divider"
                    >
                        <PhoneOff className="w-3.5 h-3.5" /> Leave
                    </button>
                </div>
            </div>
        );
    }

    // ── Full Screen View ─────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[200] bg-black flex">
            {/* Main Area */}
            <div className={`flex-1 flex flex-col transition-all ${isChatOpen ? 'mr-[340px]' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <h2 className="text-white font-bold text-lg">{conversationName}</h2>
                            <p className="text-white/60 text-sm">
                                {participantsList.length} participants · {formatDuration(callDuration)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Video Grid */}
                <div className="flex-1 flex items-center justify-center p-16 pt-20">
                    <div className={`grid gap-3 w-full h-full max-w-5xl ${
                        remoteUsers.length === 0 ? 'grid-cols-1' :
                        remoteUsers.length <= 1 ? 'grid-cols-2' :
                        remoteUsers.length <= 3 ? 'grid-cols-2 grid-rows-2' :
                        'grid-cols-3 grid-rows-3'
                    }`}>
                        {/* Local user tile */}
                        <div className="relative bg-zinc-800/60 rounded-2xl overflow-hidden flex items-center justify-center ring-1 ring-white/5">
                            {!videoMuted ? (
                                <div ref={localVideoRef} className="w-full h-full object-cover" />
                            ) : isScreenSharing ? (
                                <div className="flex flex-col items-center gap-2 text-white/60">
                                    <Monitor className="w-10 h-10 text-biolum" />
                                    <span className="text-sm">Sharing Screen</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Avatar className="w-20 h-20 ring-2 ring-white/10">
                                        {currentUser.profile_picture && <AvatarImage src={currentUser.profile_picture} />}
                                        <AvatarFallback className="bg-ocean-deep text-2xl text-ocean-text">
                                            {currentUser.name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-white/80 text-sm font-medium">You</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                                {micMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                                <span className="text-white text-xs">You{isHost ? ' (Host)' : ''}</span>
                            </div>
                            {mutedByHost && (
                                <div className="absolute top-2 right-2 bg-rose-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                                    Muted by host
                                </div>
                            )}
                        </div>

                        {/* Remote user tiles */}
                        {remoteUsers.map(user => {
                            const participantInfo = participantsList.find(p => p.user_id === user.uid);
                            const userName = participantInfo?.user?.name || `User ${user.uid}`;
                            const userAvatar = participantInfo?.user?.profile_picture;
                            const userRole = participantInfo?.role;

                            return (
                                <div key={user.uid} className="relative bg-zinc-800/60 rounded-2xl overflow-hidden flex items-center justify-center ring-1 ring-white/5">
                                    {user.hasVideo ? (
                                        <div id={`remote-video-${user.uid}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <Avatar className="w-20 h-20 ring-2 ring-white/10">
                                                {userAvatar && <AvatarImage src={userAvatar} />}
                                                <AvatarFallback className="bg-ocean-deep text-2xl text-ocean-text">
                                                    {userName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-white/80 text-sm font-medium">{userName}</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                                        {userRole === 'host' && <Crown className="w-3 h-3 text-amber-400" />}
                                        <span className="text-white text-xs">{userName}</span>
                                    </div>
                                    {/* Host mute control */}
                                    {isHost && user.uid !== currentUser.id && (
                                        <button
                                            onClick={() => {
                                                const isMuted = participantInfo?.is_muted_by_host;
                                                isMuted ? handleHostUnmute(user.uid) : handleHostMute(user.uid);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                                            title={participantInfo?.is_muted_by_host ? 'Unmute user' : 'Mute user'}
                                        >
                                            {participantInfo?.is_muted_by_host ? (
                                                <MicOff className="w-4 h-4 text-rose-400" />
                                            ) : (
                                                <Mic className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-xl px-6 py-4 rounded-full border border-white/10 shadow-2xl z-10">
                    <button
                        onClick={toggleMic}
                        disabled={mutedByHost}
                        className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                            micMuted ? 'bg-white/20 text-rose-400' : 'bg-white/10 text-white hover:bg-white/20'
                        } ${mutedByHost ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={mutedByHost ? 'Muted by host' : micMuted ? 'Unmute' : 'Mute'}
                    >
                        {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                            videoMuted ? 'bg-white/20 text-rose-400' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
                    >
                        {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                            isScreenSharing ? 'bg-biolum/30 text-biolum ring-1 ring-biolum/50' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                    >
                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </button>

                    <div className="w-px h-8 bg-white/20" />

                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                            isChatOpen ? 'bg-biolum/30 text-biolum ring-1 ring-biolum/50' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Toggle chat"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsMusicMuted(!isMusicMuted)}
                        className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                            isMusicMuted ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isMusicMuted ? 'Unmute music' : 'Mute music'}
                    >
                        {isMusicMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <div className="w-px h-8 bg-white/20" />

                    <button
                        onClick={() => handleLeave()}
                        className="p-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-colors cursor-pointer"
                        title={isHost ? 'End call for everyone' : 'Leave call'}
                    >
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Sidebar */}
            {isChatOpen && (
                <div className="fixed top-0 right-0 bottom-0 w-[340px] bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-10">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-biolum" />
                            In-Call Chat
                        </h3>
                        <button
                            onClick={() => setIsChatOpen(false)}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-white/30 text-sm py-8">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No messages yet</p>
                                <p className="text-xs mt-1">Chat with the group here!</p>
                            </div>
                        )}
                        {chatMessages.map((msg, i) => {
                            const isMe = msg.user?.id === currentUser.id;
                            return (
                                <div key={msg.id || i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <Avatar className="w-7 h-7 flex-shrink-0">
                                            {msg.user?.profile_picture && <AvatarImage src={msg.user.profile_picture} />}
                                            <AvatarFallback className="bg-ocean-deep text-[10px] text-ocean-text">
                                                {msg.user?.name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                                        {!isMe && (
                                            <span className="text-white/40 text-[10px] block mb-0.5">{msg.user?.name}</span>
                                        )}
                                        <div className={`inline-block px-3 py-1.5 rounded-2xl text-sm ${
                                            isMe
                                                ? 'bg-biolum/20 text-biolum rounded-br-sm'
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

                    {/* Chat Input */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex gap-2">
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-biolum/50"
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || sendingChat}
                            className="p-2.5 rounded-full bg-biolum hover:bg-biolum/80 text-black disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Draggable from 'react-draggable';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Maximize, Minimize2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/shadcn/avatar';
import { router } from '@inertiajs/react';
import GroupCallOverlay from '@/Components/Features/Messaging/GroupCallOverlay';

// Web Audio API Ringtone Generator
const playRingtone = (audioCtxRef, oscillatorRef, intervalRef) => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        oscillatorRef.current = osc;
    };

    playBeep();
    intervalRef.current = setInterval(playBeep, 2000);
};

const stopRingtone = (oscillatorRef, intervalRef) => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(e){}
        oscillatorRef.current = null;
    }
};

export default function GlobalCallManager({ activeCallParam, onClearActiveCallParam, currentUser }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    // Restore group call from sessionStorage on page refresh
    const [activeGroupCall, setActiveGroupCall] = useState(() => {
        try {
            const saved = sessionStorage.getItem('daloy_active_group_call');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Sync activeGroupCall to sessionStorage so it survives page refresh
    useEffect(() => {
        if (activeGroupCall) {
            sessionStorage.setItem('daloy_active_group_call', JSON.stringify(activeGroupCall));
        } else {
            sessionStorage.removeItem('daloy_active_group_call');
        }
    }, [activeGroupCall]);

    // Poll for incoming 1-on-1 calls (skip if already in any call)
    useEffect(() => {
        if (!currentUser) return; // Prevent polling if completely unauthenticated
        
        let interval;
        if (!activeCall && !activeGroupCall) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get('/api/calls/incoming');
                    if (res.data.incoming) {
                        setIncomingCall(res.data.incoming);
                    } else {
                        setIncomingCall(null);
                    }
                } catch(e) {
                    // Stop polling if we get a 401 Unauthorized (e.g. session expired or admin guard context)
                    if (e.response && e.response.status === 401) {
                        clearInterval(interval);
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeCall, activeGroupCall, currentUser]);

    // Handle out-of-band initiated calls (From Conversations.jsx)
    useEffect(() => {
        if (activeCallParam) {
            setActiveCall({ ...activeCallParam, isCaller: true });
            onClearActiveCallParam();
        }
    }, [activeCallParam]);

    // Listen for Group Calls triggered from Conversations.jsx
    useEffect(() => {
        const handleGroupCall = (e) => {
            setActiveGroupCall(e.detail);
        };
        window.addEventListener('daloy:group-call', handleGroupCall);
        return () => window.removeEventListener('daloy:group-call', handleGroupCall);
    }, []);

    // Caller checks status if receiver accepted/rejected
    useEffect(() => {
        let interval;
        if (activeCall && activeCall.isCaller && !activeCall.connectedStatus) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`/api/calls/status?channel_name=${activeCall.channel_name}`);
                    if (res.data.status === 'rejected' || res.data.status === 'canceled') {
                        setActiveCall(null);
                        
                        let displayMessage = 'The call was ended.';
                        if (res.data.status === 'rejected') {
                            displayMessage = 'The person you are calling is currently unavailable.';
                        } else if (res.data.status === 'canceled') {
                            displayMessage = 'The call was cancelled before being answered.';
                        }
                        
                        // Fire a toast event instead of browser alert
                        const toastEvent = new CustomEvent('toast:show', { detail: { type: 'error', message: displayMessage } });
                        window.dispatchEvent(toastEvent);
                    } else if (res.data.status === 'accepted') {
                        setActiveCall(prev => ({ ...prev, connectedStatus: true }));
                    }
                } catch(e){}
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeCall]);

    const handleAccept = async () => {
        if (!incomingCall) return;
        
        if (incomingCall.is_group_call) {
            try {
                // To remove the incoming call cache so it stops popping up
                await axios.post('/api/calls/action', { action: 'reject', caller_id: incomingCall.caller_id, channel_name: incomingCall.channel_name });
                const res = await axios.post(`/api/group-calls/${incomingCall.conversation_id}/join`);
                setActiveGroupCall({
                    ...res.data,
                    isHost: false,
                    conversationId: incomingCall.conversation_id,
                    conversationName: incomingCall.conversation_name || 'Group Call',
                });
                setIncomingCall(null);
            } catch(e) {
                alert('Failed to join group call');
            }
            return;
        }

        try {
            const res = await axios.post('/api/calls/action', {
                action: 'accept',
                caller_id: incomingCall.caller_id,
                channel_name: incomingCall.channel_name
            });
            setActiveCall({
                ...incomingCall,
                token: res.data.token,
                app_id: res.data.app_id,
                uid: res.data.uid,
                isCaller: false,
                connectedStatus: true
            });
            setIncomingCall(null);
        } catch(e) {}
    };

    const handleReject = async () => {
        if (!incomingCall) return;
        try {
            await axios.post('/api/calls/action', {
                action: 'reject',
                caller_id: incomingCall.caller_id,
                channel_name: incomingCall.channel_name
            });
            setIncomingCall(null);
        } catch(e) {}
    };

    return (
        <>
            {incomingCall && !activeCall && !activeGroupCall && (
                <IncomingCallToast call={incomingCall} onAccept={handleAccept} onReject={handleReject} />
            )}
            
            {activeCall && (
                <AgoraCallSession 
                    callData={activeCall} 
                    isMinimized={isMinimized}
                    onToggleMinimize={() => setIsMinimized(!isMinimized)}
                    onEnd={() => setActiveCall(null)} 
                />
            )}

            {activeGroupCall && (
                <GroupCallOverlay
                    conversationId={activeGroupCall.conversationId}
                    conversationName={activeGroupCall.conversationName}
                    callData={activeGroupCall}
                    isHost={activeGroupCall.isHost}
                    onLeave={() => setActiveGroupCall(null)}
                    currentUser={currentUser}
                    participants={[]}
                />
            )}
        </>
    );
}

function IncomingCallToast({ call, onAccept, onReject }) {
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        playRingtone(audioCtxRef, oscillatorRef, intervalRef);
        return () => stopRingtone(oscillatorRef, intervalRef);
    }, []);

    return (
        <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[999] bg-ocean-card border ring-1 ring-white/10 border-ocean-divider shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-4 animate-[slideDown_0.3s_ease-out] w-[90vw] max-w-[20rem]">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 ring-4 ring-biolum/30 animate-pulse">
                {call.caller_avatar && <AvatarImage src={call.caller_avatar} />}
                <AvatarFallback className="bg-ocean-deep text-ocean-text text-xl">
                    {call.caller_name[0]}
                </AvatarFallback>
            </Avatar>
            <div className="text-center">
                <h3 className="text-ocean-text font-bold text-lg">{call.caller_name}</h3>
                <p className="text-ocean-text-dim text-sm">Incoming {call.type === 'video' ? 'Video' : 'Audio'} Call...</p>
            </div>
            <div className="flex gap-6 mt-2">
                <button onClick={onReject} className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-all cursor-pointer">
                    <PhoneOff className="w-5 h-5" />
                </button>
                <button onClick={onAccept} className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all cursor-pointer animate-[bounce_2s_infinite]">
                    {call.type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

function AgoraCallSession({ callData, isMinimized, onToggleMinimize, onEnd }) {
    const { token, app_id, channel_name, uid, type, isCaller, connectedStatus } = callData;
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [micMuted, setMicMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [dragging, setDragging] = useState(false);
    const localVideoRef = useRef(null);
    const clientRef = useRef(null);
    const nodeRef = useRef(null);

    // Audio context for caller waiting ringtone
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const ringIntRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;
        let createdTracks = [];

        const initCall = async () => {
            try {
                // Safely parse app_id and token
                const safeAppId = app_id ? String(app_id).replace(/^"|"$/g, '') : '';
                const safeToken = token ? String(token).replace(/^"|"$/g, '') : '';

                if (!safeAppId) {
                    throw new Error("Agora App ID is missing or invalid. Check your .env configuration.");
                }

                await client.join(safeAppId, channel_name, safeToken, uid);
                
                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (!mounted) return;
                    
                    setRemoteUsers(prev => {
                        const existing = prev.filter(u => u.uid !== user.uid);
                        return [...existing, user];
                    });

                    if (mediaType === "video") {
                        setTimeout(() => {
                            const container = document.getElementById(`remote-video-${user.uid}`);
                            if (container) user.videoTrack?.play(container);
                        }, 100);
                    }
                    if (mediaType === "audio") {
                        user.audioTrack?.play();
                    }
                });

                client.on("user-unpublished", (user) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                if (!mounted) {
                    client.leave();
                    return;
                }

                if (type === 'video') {
                    let tracks;
                    let isAudioOnlyFallback = false;
                    try {
                        tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                    } catch (trackErr) {
                        try {
                            if (trackErr.message && (trackErr.message.includes('NOT_READABLE') || trackErr.message.includes('Device in use'))) {
                                console.warn("Camera/Mic in use, retrying in 1 second...");
                                await new Promise(r => setTimeout(r, 1000));
                                if (!mounted) { client.leave(); return; }
                                tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                            } else {
                                throw trackErr;
                            }
                        } catch (fallbackErr) {
                            console.warn("Could not get camera, falling back to audio only...", fallbackErr);
                            try {
                                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                                tracks = [audioTrack, null];
                                isAudioOnlyFallback = true;
                            } catch (criticalErr) {
                                console.warn("Could not get microphone either. Joining with no media.", criticalErr);
                                tracks = [null, null];
                                isAudioOnlyFallback = true;
                            }
                        }
                    }
                    const [audioTrack, videoTrack] = tracks;
                    createdTracks = tracks.filter(Boolean);
                    if (mounted) {
                        if (audioTrack) setLocalAudioTrack(audioTrack);
                        if (videoTrack) setLocalVideoTrack(videoTrack);
                        if (createdTracks.length > 0) {
                            await client.publish(createdTracks);
                        }
                        if (videoTrack && localVideoRef.current) videoTrack.play(localVideoRef.current);
                        
                        if (isAudioOnlyFallback) {
                            setVideoMuted(true);
                            if (!audioTrack) setMicMuted(true);
                            const toastEvent = new CustomEvent('toast:show', { detail: { type: 'info', message: "Camera or Mic access denied/unavailable. Joined with limited media." } });
                            window.dispatchEvent(toastEvent);
                        }
                    } else {
                        createdTracks.forEach(t => { t.stop(); t.close(); });
                    }
                } else {
                    let audioTrack = null;
                    try {
                        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    } catch (trackErr) {
                        if (trackErr.message && (trackErr.message.includes('NOT_READABLE') || trackErr.message.includes('Device in use'))) {
                            console.warn("Mic in use, retrying in 1 second...");
                            await new Promise(r => setTimeout(r, 1000));
                            if (!mounted) { client.leave(); return; }
                            try {
                                audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                            } catch (e) {
                                console.warn("Mic still in use or denied, joining without mic.");
                            }
                        } else {
                            console.warn("Could not get microphone. Joining without media...", trackErr);
                        }
                    }
                    createdTracks = audioTrack ? [audioTrack] : [];
                    if (mounted) {
                        if (audioTrack) {
                            setLocalAudioTrack(audioTrack);
                            await client.publish([audioTrack]);
                        } else {
                            setMicMuted(true);
                            const toastEvent = new CustomEvent('toast:show', { detail: { type: 'info', message: "Microphone access denied or unavailable. Joined to listen." } });
                            window.dispatchEvent(toastEvent);
                        }
                    } else {
                        if (audioTrack) { audioTrack.stop(); audioTrack.close(); }
                    }
                }
            } catch (err) {
                console.error("Agora call failed:", err);
                const toastEvent = new CustomEvent('toast:show', { detail: { type: 'error', message: err.message || "Failed to connect to Agora Call Server" } });
                window.dispatchEvent(toastEvent);
                handleHangup();
            }
        };
        initCall();

        return () => {
            mounted = false;
            createdTracks.forEach(track => {
                track?.stop(); track?.close();
            });
            client.leave();
            stopRingtone(oscillatorRef, ringIntRef);
        };
    }, []);

    // Caller Outgoing Ringtone
    useEffect(() => {
        if (isCaller && !connectedStatus) {
            playRingtone(audioCtxRef, oscillatorRef, ringIntRef);
        } else {
            stopRingtone(oscillatorRef, ringIntRef);
        }
    }, [isCaller, connectedStatus]);

    // Auto-Cancel if no answer within 15 seconds
    useEffect(() => {
        let noAnswerTimeout;
        
        if (isCaller && !connectedStatus) {
            noAnswerTimeout = setTimeout(() => {
                const toastEvent = new CustomEvent('toast:show', { 
                    detail: { type: 'info', message: "No answer, call ended automatically." } 
                });
                window.dispatchEvent(toastEvent);
                handleHangup();
            }, 15000);
        }

        return () => clearTimeout(noAnswerTimeout);
    }, [isCaller, connectedStatus]);

    const handleHangup = async () => {
        localAudioTrack?.stop(); localAudioTrack?.close();
        localVideoTrack?.stop(); localVideoTrack?.close();
        if (clientRef.current) await clientRef.current.leave();
        
        // If caller and hung up before answer
        if (isCaller && !connectedStatus) {
            try {
                await axios.post('/api/calls/action', {
                    action: 'cancel',
                    receiver_id: callData.conversation_id ? null : null, // we don't have receiver_id strictly here unless we pass it, but channel_name kills status
                    channel_name
                });
            } catch(e) {}
        }
        onEnd();
    };

    const toggleMic = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (localAudioTrack) {
            await localAudioTrack.setMuted(!micMuted);
            setMicMuted(!micMuted);
        }
    };

    const toggleVideo = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (localVideoTrack) {
            await localVideoTrack.setMuted(!videoMuted);
            setVideoMuted(!videoMuted);
        }
    };

    // Facebook Style Layout
    // When Minimized: Floating small PIP top right
    // When Full: Big overlay. Remote video fills background, Local video is small PIP bottom right
    const primaryRemote = remoteUsers.find(u => u.hasVideo) || remoteUsers[0];

    if (isMinimized) {
        return (
            <Draggable
                nodeRef={nodeRef}
                handle=".drag-handle"
                onStart={() => setDragging(true)}
                onStop={() => { setTimeout(() => setDragging(false), 100) }}
            >
                <div
                    ref={nodeRef}
                    className="fixed top-24 right-4 md:top-20 md:right-6 z-[100] w-28 md:w-48 aspect-[3/4] bg-ocean-card border border-ocean-divider shadow-2xl rounded-xl overflow-hidden" 
                    onClick={(e) => {
                        if (dragging) return;
                        onToggleMinimize();
                    }}
                >
                    <div className="drag-handle absolute top-0 left-0 right-0 h-8 z-20 cursor-move" />
                    {primaryRemote && primaryRemote.hasVideo ? (
                        <div id={`remote-video-${primaryRemote.uid}`} className="w-full h-full object-cover" />
                    ) : type === 'video' ? (
                        <div ref={localVideoRef} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-biolum/20">
                            <Phone className="w-8 h-8 text-biolum" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 p-1.5 z-30 bg-black/50 rounded-md hover:bg-black/70 text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}>
                        <Maximize className="w-4 h-4" />
                    </div>
                </div>
            </Draggable>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            {/* Main Remote Video Background */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border-none outline-none">
                {primaryRemote ? (
                    <div id={`remote-video-${primaryRemote.uid}`} className="w-full h-full object-contain md:object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <Avatar className="w-32 h-32 ring-2 ring-white/10">
                            <AvatarFallback className="bg-white/5 text-4xl">?</AvatarFallback>
                        </Avatar>
                        <p className="text-white/60 font-semibold text-lg">{isCaller && !connectedStatus ? 'Calling...' : 'Waiting for others...'}</p>
                    </div>
                )}
            </div>

            {/* Local Video PIP Bottom Right */}
            {type === 'video' && (
                <div className="absolute bottom-24 right-4 md:bottom-10 md:right-10 w-24 md:w-32 lg:w-48 aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 z-10 transition-all">
                    <div ref={localVideoRef} className="w-full h-full object-cover" />
                    {!connectedStatus && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><p className="text-white text-xs font-bold">You</p></div>}
                </div>
            )}

            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
                <div className="text-white pointer-events-auto">
                    <h2 className="text-base md:text-lg font-bold drop-shadow-md">Direct Call</h2>
                    <p className="text-xs md:text-sm text-white/70">Secure WebRTC Session</p>
                </div>
                <button onClick={onToggleMinimize} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur pointer-events-auto transition-colors">
                    <Minimize2 className="w-5 h-5" />
                </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 bg-black/60 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 rounded-full z-10 border border-white/10 shadow-2xl hover:bg-black/70 transition-colors w-max max-w-[95vw]">
                <button onClick={toggleMic} className={`p-3 md:p-4 rounded-full transition-colors ${micMuted ? 'bg-white/20 text-rose-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {micMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                {type === 'video' && (
                    <button onClick={toggleVideo} className={`p-3 md:p-4 rounded-full transition-colors ${videoMuted ? 'bg-white/20 text-rose-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {videoMuted ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>
                )}
                <button onClick={handleHangup} className="p-3 md:p-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-colors">
                    <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
}

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';

const CurrentsContext = createContext(null);

const NOOP = () => {};
const NOOP_ASYNC = async () => {};
const SAFE_DEFAULT = {
    isInSession: false, currentSchool: null, session: null,
    participants: [], listenerCount: 0, votes: { good: [], bad: [] },
    myVote: null, chatMessages: [], isMicEnabled: false, isMicMuted: true,
    locallyMutedUsers: [], isHost: false,
    joinSession: NOOP_ASYNC, startSession: NOOP_ASYNC,
    leaveSession: NOOP_ASYNC, endSession: NOOP_ASYNC,
    toggleMic: NOOP_ASYNC, toggleLocalMute: NOOP,
    sendChat: NOOP_ASYNC, castVote: NOOP_ASYNC,
    addTrack: NOOP_ASYNC, playNext: NOOP_ASYNC,
};

export function useCurrents() {
    return useContext(CurrentsContext) || SAFE_DEFAULT;
}

/**
 * Helper: get auth user from Inertia's current page props.
 * Uses `router.page` (synchronous) so this works OUTSIDE the <App> tree.
 * Falls back to null safely.
 */
function getAuthUser() {
    try {
        return router.page?.props?.auth?.user || null;
    } catch {
        return null;
    }
}

/**
 * Global Currents Provider — wraps the ENTIRE app (above <App>) so the
 * audio session + Agora voice persists across ALL Inertia page navigations.
 *
 * Does NOT use usePage() hook — instead uses router.page for auth access.
 */
export function CurrentsProvider({ children }) {
    // Store auth user in a ref — updated on every navigation
    const authUserRef = useRef(getAuthUser());

    // Keep authUserRef fresh on every Inertia navigation
    useEffect(() => {
        const removeListener = router.on('navigate', () => {
            authUserRef.current = getAuthUser();
        });
        // Also update immediately
        authUserRef.current = getAuthUser();
        return removeListener;
    }, []);

    // ── Core session state ───────────────────────────────────────────────
    const [currentSchool, setCurrentSchool] = useState(null);
    const [session, setSession] = useState(null);
    const [agoraToken, setAgoraToken] = useState(null);
    const [appId, setAppId] = useState(null);
    const [blockedIds, setBlockedIds] = useState([]);
    const [isInSession, setIsInSession] = useState(false);

    // ── Live state (polled) ──────────────────────────────────────────────
    const [participants, setParticipants] = useState([]);
    const [listenerCount, setListenerCount] = useState(0);
    const [votes, setVotes] = useState({ good: [], bad: [] });
    const [myVote, setMyVote] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const lastMessageIdRef = useRef(0);

    // ── Agora voice state ────────────────────────────────────────────────
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [locallyMutedUsers, setLocallyMutedUsers] = useState([]);
    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // ── Actions ──────────────────────────────────────────────────────────

    const joinSession = useCallback(async (school, blockedIdsList = []) => {
        try {
            const res = await axios.get(`/schools/${school.id}/currents/join`);
            setCurrentSchool(school);
            setSession(res.data.session);
            setAgoraToken(res.data.token);
            setAppId(res.data.app_id);
            setBlockedIds(blockedIdsList || res.data.blocked_ids || []);
            setIsInSession(true);
            setChatMessages([]);
            lastMessageIdRef.current = 0;
            setMyVote(null);
            return res.data;
        } catch (err) {
            console.error('Failed to join session:', err);
            throw err;
        }
    }, []);

    const startSession = useCallback(async (school, trackUrl, sessionName = 'Live Broadcast', blockedIdsList = []) => {
        try {
            const res = await axios.post(`/schools/${school.id}/currents/start`, { track_url: trackUrl, session_name: sessionName });
            setCurrentSchool(school);
            setSession(res.data.session);
            setAgoraToken(res.data.token);
            setAppId(res.data.app_id);
            setBlockedIds(blockedIdsList || []);
            setIsInSession(true);
            setChatMessages([]);
            lastMessageIdRef.current = 0;
            setMyVote(null);
            return res.data;
        } catch (err) {
            console.error('Failed to start session:', err);
            throw err;
        }
    }, []);

    const leaveSession = useCallback(async () => {
        if (!currentSchool) return;
        try {
            await axios.post(`/schools/${currentSchool.id}/currents/leave`);
        } catch (err) {
            console.error('Leave error:', err);
        }

        // Cleanup Agora
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.stop();
            localAudioTrackRef.current.close();
            localAudioTrackRef.current = null;
        }
        if (clientRef.current) {
            clientRef.current.leave().catch(() => {});
            clientRef.current = null;
        }

        // Reset all state
        setCurrentSchool(null);
        setSession(null);
        setAgoraToken(null);
        setAppId(null);
        setIsInSession(false);
        setParticipants([]);
        setListenerCount(0);
        setVotes({ good: [], bad: [] });
        setMyVote(null);
        setChatMessages([]);
        setIsMicEnabled(false);
        setIsMicMuted(true);
        setLocallyMutedUsers([]);
        lastMessageIdRef.current = 0;
    }, [currentSchool]);

    const endSession = useCallback(async () => {
        if (!currentSchool) return;
        try {
            await axios.post(`/schools/${currentSchool.id}/currents/end`);
        } catch (err) {
            console.error(err);
        }
        await leaveSession();
    }, [currentSchool, leaveSession]);

    // ── Live State Polling ───────────────────────────────────────────────
    useEffect(() => {
        if (!isInSession || !currentSchool) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            return;
        }

        const poll = async () => {
            try {
                const res = await axios.get(`/schools/${currentSchool.id}/currents/live-state`, {
                    params: { after_message_id: lastMessageIdRef.current }
                });

                if (!res.data.active) {
                    // Session ended by host
                    await leaveSession();
                    return;
                }

                setSession(res.data.session);
                setParticipants(res.data.participants.filter(u => !blockedIds.includes(u.id)));
                setListenerCount(res.data.listener_count);

                const filterBlocked = (arr) => (arr || []).filter(v => !blockedIds.includes(v.id));
                setVotes({
                    good: filterBlocked(res.data.votes.good),
                    bad: filterBlocked(res.data.votes.bad),
                });

                if (res.data.messages.length > 0) {
                    const filtered = res.data.messages.filter(m => !blockedIds.includes(m.user_id));
                    setChatMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMsgs = filtered.filter(m => !existingIds.has(m.id));
                        return [...prev, ...newMsgs].slice(-100);
                    });
                    lastMessageIdRef.current = Math.max(lastMessageIdRef.current, ...res.data.messages.map(m => m.id));
                }
            } catch (err) { /* silent */ }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, 4000);
        return () => clearInterval(pollIntervalRef.current);
    }, [isInSession, currentSchool?.id, blockedIds]);

    // ── Agora Connection (join channel in listen-only, mic is opt-in) ────
    useEffect(() => {
        if (!isInSession || !appId || !agoraToken || !session?.channel_name) return;

        const userId = authUserRef.current?.id;
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "audio" && !blockedIds.includes(Number(user.uid))) {
                user.audioTrack.play();
            }
        });

        client.join(appId, session.channel_name, agoraToken, userId)
            .then(() => console.log("Agora: Connected to voice channel"))
            .catch(err => console.error("Agora join failed:", err));

        return () => {
            if (localAudioTrackRef.current) {
                localAudioTrackRef.current.stop();
                localAudioTrackRef.current.close();
                localAudioTrackRef.current = null;
            }
            client.leave().catch(() => {});
        };
    }, [isInSession, appId, agoraToken, session?.channel_name]);

    // ── Mic Toggle (opt-in) ──────────────────────────────────────────────
    const toggleMic = useCallback(async () => {
        if (!clientRef.current) return;

        if (!isMicEnabled) {
            try {
                const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localAudioTrackRef.current = localTrack;
                await clientRef.current.publish([localTrack]);
                setIsMicEnabled(true);
                setIsMicMuted(false);
            } catch (err) {
                console.error("Mic error:", err);
                alert("Please allow microphone access to speak.");
            }
        } else {
            const newMuted = !isMicMuted;
            if (localAudioTrackRef.current) localAudioTrackRef.current.setMuted(newMuted);
            setIsMicMuted(newMuted);
        }
    }, [isMicEnabled, isMicMuted]);

    // ── Per-user local mute ──────────────────────────────────────────────
    const toggleLocalMute = useCallback((uid) => {
        setLocallyMutedUsers(prev => {
            const next = [...prev];
            const idx = next.indexOf(uid);
            const muting = idx === -1;
            if (muting) next.push(uid); else next.splice(idx, 1);

            if (clientRef.current) {
                const remote = clientRef.current.remoteUsers.find(u => Number(u.uid) === Number(uid));
                if (remote?.audioTrack) remote.audioTrack.setVolume(muting ? 0 : 100);
            }
            return next;
        });
    }, []);

    // ── Chat & Vote & Playlist Actions ───────────────────────────────────
    const sendChat = useCallback(async (message) => {
        if (!currentSchool || !message.trim()) return;
        try {
            const res = await axios.post(`/schools/${currentSchool.id}/currents/chat`, { message });
            if (res.data.status === 'sent' && res.data.message) {
                const newMsg = res.data.message;
                setChatMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    if (existingIds.has(newMsg.id)) return prev;
                    return [...prev, newMsg].slice(-100);
                });
                lastMessageIdRef.current = Math.max(lastMessageIdRef.current, newMsg.id);
            }
        } catch (err) {
            console.error('Failed to send chat:', err);
        }
    }, [currentSchool]);

    const castVote = useCallback(async (type) => {
        if (!currentSchool) return;
        await axios.post(`/schools/${currentSchool.id}/currents/vote`, { vote: type });
        setMyVote(type);
    }, [currentSchool]);

    const addTrack = useCallback(async (trackUrl) => {
        if (!currentSchool) return;
        const res = await axios.post(`/schools/${currentSchool.id}/currents/add-track`, { track_url: trackUrl });
        setSession(res.data.session);
    }, [currentSchool]);

    const playNext = useCallback(async (trackId = null) => {
        if (!currentSchool) return;
        const res = await axios.post(`/schools/${currentSchool.id}/currents/play-next`, { track_id: trackId });
        setSession(res.data.session);
        setMyVote(null);
    }, [currentSchool]);

    // ── Context Value ────────────────────────────────────────────────────
    const userId = authUserRef.current?.id;
    const value = {
        // State
        isInSession, currentSchool, session, participants, listenerCount,
        votes, myVote, chatMessages, isMicEnabled, isMicMuted, locallyMutedUsers,
        isHost: session?.admin_id === userId,
        // Actions
        joinSession, startSession, leaveSession, endSession,
        toggleMic, toggleLocalMute, sendChat, castVote, addTrack, playNext,
    };

    return (
        <CurrentsContext.Provider value={value}>
            {children}
        </CurrentsContext.Provider>
    );
}

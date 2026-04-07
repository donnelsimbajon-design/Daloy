import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';
import { ShieldAlert, Mail, AlertTriangle, Ban, Sword, ClipboardList, CheckCircle, X, Flag, FileText, Video, Phone, Users, PhoneCall, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/shadcn/avatar';
import { ScrollArea } from '@/Components/shadcn/scroll-area';
import { Input } from '@/Components/shadcn/input';
import { Button } from '@/Components/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/shadcn/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/Components/shadcn/dropdown-menu';
import CreateGroupModal from '@/Components/Features/Messaging/CreateGroupModal';
import GroupCallOverlay from '@/Components/Features/Messaging/GroupCallOverlay';

export default function Conversations() {
    const { auth } = usePage().props;
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [sharedMedia, setSharedMedia] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [mediaDrawerType, setMediaDrawerType] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSending, setReportSending] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [activeGroupCall, setActiveGroupCall] = useState(null);
    const [groupCallActive, setGroupCallActive] = useState(null);
    const messagesEndRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const queryParams = new URLSearchParams(window.location.search);
    const startUserId = queryParams.get('user_id');

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (startUserId && !selectedConversation) {
            startConversationWithUser(startUserId);
        }
    }, [startUserId, conversations]);

    useEffect(() => {
        if (selectedConversation) {
            setIsBlocked(false); // reset block state when switching conversations
            loadMessages(selectedConversation.id);
            loadSharedMedia(selectedConversation.id);
            const interval = setInterval(() => {
                loadMessages(selectedConversation.id, true);
                checkTyping(selectedConversation.id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const res = await axios.get('/api/conversations');
            setConversations(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const startConversationWithUser = async (userId) => {
        try {
            const res = await axios.post('/api/conversations/start', { user_id: userId });
            const conversation = res.data;
            if (!conversations.find(c => c.id === conversation.id)) {
                setConversations([conversation, ...conversations]);
            }
            setSelectedConversation(conversation);
        } catch (error) {
            console.error(error);
        }
    };

    const loadMessages = async (conversationId, background = false) => {
        if (!background) setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${conversationId}`);
            setMessages(res.data.data.reverse());
            if (!background) {
                router.reload({ only: ['social'] });
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    const loadSharedMedia = async (conversationId) => {
        try {
            const res = await axios.get(`/api/conversations/${conversationId}/media`);
            setSharedMedia(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const checkTyping = async (conversationId) => {
        try {
            const res = await axios.get(`/api/conversations/${conversationId}/typing`);
            setTypingUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleTyping = () => {
        if (!selectedConversation) return;
        
        // Only send typing indicator once every 2 seconds to avoid spamming
        if (!typingTimeoutRef.current) {
            axios.post(`/api/conversations/${selectedConversation.id}/typing`).catch(() => {});
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !attachment) || sending || isBlocked) return;

        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            conversation_id: selectedConversation.id,
            user_id: auth.user.id,
            content: newMessage,
            media_url: attachment ? URL.createObjectURL(attachment) : null,
            created_at: new Date().toISOString(),
            user: auth.user
        };

        setMessages(prev => [...prev, optimisticMessage]);
        
        const currentAttachment = attachment;
        setNewMessage('');
        setAttachment(null);
        setSending(true);

        try {
            const formData = new FormData();
            formData.append('conversation_id', selectedConversation.id);
            if (optimisticMessage.content) formData.append('content', optimisticMessage.content);
            if (currentAttachment) formData.append('file', currentAttachment);

            const res = await axios.post('/api/messages/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            if (error.response?.status === 403) {
                // Block detected — silently mark as blocked
                setIsBlocked(true);
            }
        } finally {
            setSending(false);
        }
    };

    const handleBlockUser = async (userId) => {
        if (!userId) return;
        try {
            await axios.post(`/users/${userId}/block`);
            setIsBlocked(true);
            setConversations(prev => prev.filter(c => c.id !== selectedConversation?.id));
            setSelectedConversation(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReport = async () => {
        if (!reportReason || !selectedConversation) return;
        setReportSending(true);
        try {
            await axios.post(`/api/conversations/${selectedConversation.id}/report`, {
                reason: reportReason,
                details: reportDetails,
            });
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportReason('');
                setReportDetails('');
                setReportSuccess(false);
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to report. Please try again.');
        } finally {
            setReportSending(false);
        }
    };

    const handleStartCall = async (type) => {
        if (!selectedConversation) return;
        try {
            const res = await axios.post(`/api/conversations/${selectedConversation.id}/call`, { type });
            
            // Dispatch a global event so MainLayout's GlobalCallManager can run the UI
            window.dispatchEvent(new CustomEvent('daloy:start-call', { detail: res.data }));
            
            // Drop a system tip in chat to notify the other person
            const formData = new FormData();
            formData.append('conversation_id', selectedConversation.id);
            formData.append('content', `SYSTEM_CALL_${type.toUpperCase()}`);
            await axios.post('/api/messages/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (err) {
            console.error(err);
            alert('Failed to initialize call. Please check credentials or try again.');
        }
    };

    const handleStartGroupCall = async () => {
        if (!selectedConversation || selectedConversation.type !== 'group') return;
        try {
            const res = await axios.post(`/api/group-calls/${selectedConversation.id}/start`);
            setActiveGroupCall({
                ...res.data,
                isHost: true,
                conversationName: selectedConversation.name || 'Group Call',
            });
        } catch (err) {
            if (err.response?.data?.error) {
                alert(err.response.data.error);
            } else {
                alert('Failed to start group call.');
            }
        }
    };

    const handleJoinGroupCall = async () => {
        if (!selectedConversation) return;
        try {
            const res = await axios.post(`/api/group-calls/${selectedConversation.id}/join`);
            setActiveGroupCall({
                ...res.data,
                isHost: false,
                conversationName: selectedConversation.name || 'Group Call',
            });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to join call.');
        }
    };

    // Check if selected group has active call
    useEffect(() => {
        if (!selectedConversation || selectedConversation.type !== 'group') {
            setGroupCallActive(null);
            return;
        }
        const check = async () => {
            try {
                const res = await axios.get(`/api/group-calls/${selectedConversation.id}/active`);
                setGroupCallActive(res.data.active ? res.data : null);
            } catch (e) {
                setGroupCallActive(null);
            }
        };
        check();
        const interval = setInterval(check, 5000);
        return () => clearInterval(interval);
    }, [selectedConversation?.id]);

    const isSystemMessage = (content) => {
        return content && content.startsWith('SYSTEM_');
    };

    const getSystemMessageText = (content) => {
        const map = {
            'SYSTEM_GROUP_CREATED': '🌊 Group was created',
            'SYSTEM_GROUP_CALL_STARTED': '📞 Group call started',
            'SYSTEM_GROUP_CALL_ENDED': '📞 Group call ended',
            'SYSTEM_CALL_VIDEO': '📹 Video call',
            'SYSTEM_CALL_AUDIO': '📞 Voice call',
        };
        return map[content] || content;
    };

    const getParticipantName = (conversation) => {
        if (conversation.type === 'group') return conversation.name || 'Group Chat';
        if (!conversation.participants || !Array.isArray(conversation.participants)) return 'Loading...';
        const other = conversation.participants.find(p => p.id !== auth.user.id);
        return other ? other.name : 'Unknown User';
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation.participants || !Array.isArray(conversation.participants)) return null;
        return conversation.participants.find(p => p.id !== auth.user.id);
    };

    const getAvatarText = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const diff = new Date() - date;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <MainLayout>
            <Head title="Conversations" />

            <div className="fixed top-16 bottom-0 left-0 right-0 z-30 flex bg-ocean-card overflow-hidden h-[calc(100dvh-4rem)]">
                {/* 1. List */}
                <div className={`w-full md:w-[320px] lg:w-[340px] flex flex-col shrink-0 border-r border-ocean-divider/50 bg-ocean-card ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="h-[72px] px-5 flex items-center justify-between border-b border-ocean-border bg-ocean-card shrink-0">
                        <div className="flex-1 w-full relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <Input type="text" placeholder="Search chats..." className="w-full bg-ocean-surface/50 border-transparent rounded-full pl-10 pr-4 h-10 text-sm text-ocean-text focus-visible:ring-1 focus-visible:bg-ocean-surface focus-visible:border-ocean-border focus-visible:ring-biolum/30 placeholder:text-ocean-text-dim/50 transition-all font-medium" />
                        </div>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="ml-2 p-2 rounded-full bg-biolum/20 hover:bg-biolum/30 text-biolum transition-colors cursor-pointer flex-shrink-0"
                            title="Create Group"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <ScrollArea className="flex-1">
                        {loading && conversations.length === 0 ? (
                            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-biolum/30 border-t-biolum rounded-full animate-spin"></div></div>
                        ) : conversations.length === 0 ? (
                            <p className="text-center text-sm text-ocean-text-dim py-8">No conversations yet.</p>
                        ) : (
                            conversations.map(conv => {
                                const other = getOtherParticipant(conv);
                                const isActive = selectedConversation?.id === conv.id;
                                return (
                                    <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`flex items-center gap-3 px-3 py-3 mx-2 my-1 cursor-pointer rounded-2xl transition-all ${isActive ? 'bg-ocean-surface border border-ocean-border/50 shadow-sm' : 'hover:bg-ocean-surface/50 border border-transparent'}`}>
                                        <div className="relative">
                                            <Avatar className="w-12 h-12 ring-1 ring-ocean-border">
                                                {conv.type === 'group' && conv.avatar_url ? (
                                                    <AvatarImage src={conv.avatar_url} className="object-cover" />
                                                ) : other?.profile_picture ? (
                                                    <AvatarImage src={other.profile_picture} className="object-cover" />
                                                ) : null}
                                                <AvatarFallback className="bg-biolum/20 text-ocean-text font-bold text-sm">
                                                    {conv.type === 'group' ? <Users className="w-5 h-5" /> : getAvatarText(getParticipantName(conv))}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.type === 'group' && (
                                                <span className="absolute -bottom-0.5 -right-0.5 bg-ocean-surface text-ocean-text-dim text-[9px] font-bold px-1 rounded-full border border-ocean-border">
                                                    {conv.participants?.length || 0}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-biolum' : 'text-ocean-text'}`}>{getParticipantName(conv)}</h3>
                                                {conv.latest_message && <span className="text-[10px] uppercase font-bold text-ocean-text-dim tracking-wider ml-2 shrink-0">{formatTime(conv.latest_message.created_at)}</span>}
                                            </div>
                                            <p className={`text-xs truncate ${isActive ? 'text-ocean-text' : 'text-ocean-text-dim'}`}>
                                                {conv.latest_message ? (
                                                    isSystemMessage(conv.latest_message.content)
                                                        ? getSystemMessageText(conv.latest_message.content)
                                                        : conv.latest_message.content
                                                ) : 'No messages'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </ScrollArea>
                </div>

                {/* 2. Chat */}
                <div className={`flex-1 flex flex-col min-w-0 bg-ocean-deep relative ${!selectedConversation ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {selectedConversation ? (() => {
                        const otherUser = getOtherParticipant(selectedConversation);
                        return (
                            <>
                                <div className="h-[72px] px-6 border-b border-ocean-divider/50 bg-ocean-card flex items-center justify-between shrink-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)} className="md:hidden -ml-2 text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                        </Button>
                                        {otherUser ? (
                                            <Link href={`/users/${otherUser.id}`} className="font-extrabold text-ocean-text text-base flex items-center gap-2 hover:underline decoration-biolum/50 underline-offset-2">
                                                {otherUser.name}
                                                {!isBlocked && otherUser.is_online && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                                            </Link>
                                        ) : (
                                            <h3 className="font-extrabold text-ocean-text text-base flex items-center gap-2">
                                                {getParticipantName(selectedConversation)}
                                            </h3>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {selectedConversation.type === 'group' ? (
                                            <>
                                                {groupCallActive ? (
                                                    <Button variant="ghost" size="sm" onClick={handleJoinGroupCall} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-colors gap-1.5 text-xs font-semibold animate-pulse">
                                                        <PhoneCall className="w-4 h-4" />
                                                        Join Call ({groupCallActive.participants?.length || 0})
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" onClick={handleStartGroupCall} className="text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface rounded-full transition-colors" title="Start Group Call">
                                                        <PhoneCall className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleStartCall('audio')} className="text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface rounded-full transition-colors" title="Voice Call">
                                                    <Phone className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleStartCall('video')} className="text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface rounded-full transition-colors mr-2" title="Video Call">
                                                    <Video className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="flex rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-ocean-card border border-ocean-border/80">
                                            <DropdownMenuLabel className="text-ocean-text text-[10px] uppercase font-bold tracking-widest opacity-50">Conversation details</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-ocean-border/50" />
                                            {otherUser && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/users/${otherUser.id}`} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                        <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                                        View Profile
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => setMediaDrawerType('images')} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                                Images
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setMediaDrawerType('videos')} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                                Videos
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setMediaDrawerType('documents')} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                                Documents
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-ocean-border/50" />
                                            <DropdownMenuItem onClick={() => setShowReportModal(true)} className="cursor-pointer text-sm font-semibold text-amber-500 hover:bg-ocean-surface focus:bg-ocean-surface focus:text-amber-500 flex items-center gap-3">
                                                <Flag className="w-4 h-4" />
                                                Report Conversation
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBlockUser(otherUser?.id)} className="cursor-pointer text-sm font-semibold text-red-500 hover:bg-ocean-surface focus:bg-ocean-surface focus:text-red-500 flex items-center gap-3">
                                                <Ban className="w-4 h-4" />
                                                Block User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1 bg-ocean-deep">
                                    <div className="p-4 md:p-6 flex flex-col space-y-4">
                                    {messages.map((msg) => {
                                        const isMe = msg.user_id === auth.user.id;

                                        // System messages
                                        if (isSystemMessage(msg.content)) {
                                            return (
                                                <div key={msg.id} className="flex justify-center">
                                                    <span className="text-ocean-text-dim text-xs bg-white/5 px-3 py-1 rounded-full">
                                                        {getSystemMessageText(msg.content)}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] relative text-[15px] leading-relaxed ${isMe ? 'bg-biolum text-white rounded-[20px] rounded-tr-[4px] self-end' : 'bg-ocean-surface text-ocean-text rounded-[20px] rounded-tl-[4px] self-start'} ${(!msg.content && msg.media_url) ? 'p-1 pb-1.5' : 'px-4 py-2.5'}`}>
                                                    {msg.story_id && (
                                                        <div className={`w-full overflow-hidden pb-1 border-b mb-2 flex items-center gap-3 ${isMe ? 'border-white/20' : 'border-ocean-border'}`}>
                                                            {msg.story ? (
                                                                <>
                                                                    <button type="button" onClick={() => setFullscreenMedia({ url: msg.story.media_url, type: msg.story.type === 'video' ? 'video' : 'image' })} className="w-10 h-14 rounded overflow-hidden shrink-0 bg-black/20 hover:opacity-80 transition-opacity">
                                                                        {msg.story.type === 'video' ? (
                                                                            <video src={msg.story.media_url} className="w-full h-full object-cover pointer-events-none" />
                                                                        ) : (
                                                                            <img src={msg.story.media_url} alt="Story" className="w-full h-full object-cover" />
                                                                        )}
                                                                    </button>
                                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white/70' : 'text-ocean-text-dim'}`}>Replied to {msg.story.user?.name?.split(' ')[0]}'s story</span>
                                                                        {msg.story.content && <span className={`text-xs font-semibold truncate ${isMe ? 'text-white/90' : 'text-ocean-text'}`}>{msg.story.content}</span>}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex-1 py-1 flex items-center gap-2">
                                                                    <svg className={`w-4 h-4 ${isMe ? 'text-white/40' : 'text-ocean-text-dim/40'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                    <span className={`text-[11px] italic font-medium tracking-wide ${isMe ? 'text-white/60' : 'text-ocean-text-dim'}`}>Story is no longer available</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.media_url && (
                                                        <div className={`w-full overflow-hidden bg-black/10 ${msg.content ? 'mb-2 rounded-xl' : 'rounded-[16px] ' + (isMe ? 'rounded-tr-sm' : 'rounded-tl-sm')}`}>
                                                            {msg.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.media_url.startsWith('blob:') ? (
                                                                <button type="button" onClick={() => setFullscreenMedia({ url: msg.media_url, type: 'image' })} className="w-full h-full block cursor-zoom-in">
                                                                    <img src={msg.media_url} className="w-full h-auto max-h-64 object-cover" alt="attachment" />
                                                                </button>
                                                            ) : msg.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                                                                <button type="button" onClick={() => setFullscreenMedia({ url: msg.media_url, type: 'video' })} className="w-full h-full block cursor-zoom-in">
                                                                    <video src={msg.media_url} className="w-full max-h-64 object-contain bg-black pointer-events-none" />
                                                                </button>
                                                            ) : (
                                                                <a href={msg.media_url} download target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 hover:bg-black/5 transition-colors ${isMe ? 'text-white' : 'text-ocean-text'}`}>
                                                                    <div className={`p-2 rounded-lg shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-biolum/20 text-biolum'}`}><FileText size={20} /></div>
                                                                    <span className="truncate text-sm font-semibold underline decoration-transparent hover:decoration-current transition-all">Download Attachment</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.content && (
                                                        <div className="break-words whitespace-pre-wrap">
                                                            {(() => {
                                                                let text = msg.content;
                                                                let callType = null;
                                                                
                                                                if (text.includes('Started a video call') || text === 'SYSTEM_CALL_VIDEO') {
                                                                    text = "Started a Video call. Click the Video icon to join!";
                                                                    callType = 'video';
                                                                } else if (text.includes('Started a audio call') || text.includes('Started a phone call') || text === 'SYSTEM_CALL_AUDIO') {
                                                                    text = "Started an Audio call. Click the Phone icon to join!";
                                                                    callType = 'audio';
                                                                }
                                                                
                                                                if (callType) {
                                                                    return (
                                                                        <div className="flex items-center gap-2.5 opacity-90">
                                                                            <div className="p-1.5 rounded-full bg-black/10 shrink-0">
                                                                                {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                                                            </div>
                                                                            <span className="italic font-medium text-sm">{text}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return <p>{text}</p>;
                                                            })()}
                                                        </div>
                                                    )}
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9.5px] font-bold uppercase tracking-widest ${isMe ? 'text-white/80' : 'text-ocean-text-dim'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && msg.id && msg.id > 100000000000 && ( // Just an optimistic ID check
                                                            <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        )}
                                                        {isMe && msg.read_at && (
                                                            <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        )}
                                                        {isMe && !msg.read_at && msg.id && msg.id < 100000000000 && (
                                                            <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                        <div ref={messagesEndRef} className="h-2 shrink-0" />
                                    </div>
                                </ScrollArea>
                                
                                {typingUsers.length > 0 && (
                                    <div className="absolute bottom-[80px] left-8 bg-ocean-card/80 backdrop-blur-sm border border-ocean-border rounded-full px-3 py-1.5 flex items-center gap-2 z-20 shadow-sm animate-pulse">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-biolum rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-biolum rounded-full animation-delay-200"></div>
                                            <div className="w-1.5 h-1.5 bg-biolum rounded-full animation-delay-400"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-ocean-text-dim uppercase tracking-wider">{typingUsers.map(u => u.name).join(', ')} is typing...</span>
                                    </div>
                                )}

                                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-ocean-card shrink-0 z-10 w-full">
                                    {isBlocked ? (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-ocean-surface border border-ocean-border/50 rounded-[20px] text-sm text-ocean-text-dim">
                                            <svg className="w-4 h-4 shrink-0 text-ocean-text-dim/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            <span>You are unable to send a message to this person.</span>
                                        </div>
                                    ) : (
                                        <form onSubmit={sendMessage} className="flex flex-col gap-2">
                                            {attachment && (
                                                <div className="mx-2 mb-1 p-2 bg-ocean-surface border border-ocean-border/50 rounded-xl flex items-center justify-between gap-3 animate-[slideUp_0.2s_ease-out]">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {attachment.type.startsWith('image/') ? (
                                                            <img src={URL.createObjectURL(attachment)} className="w-10 h-10 object-cover rounded-md border border-ocean-border shrink-0" />
                                                        ) : attachment.type.startsWith('video/') ? (
                                                             <video src={URL.createObjectURL(attachment)} className="w-10 h-10 object-cover rounded-md border border-ocean-border shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-biolum/10 text-biolum rounded-md flex items-center justify-center shrink-0">
                                                                <FileText size={20} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-ocean-text truncate font-semibold">{attachment.name}</p>
                                                            <p className="text-[10px] text-ocean-text-dim">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => setAttachment(null)} className="p-1 rounded-full text-ocean-text-dim hover:bg-ocean-card hover:text-red-400 transition-colors shrink-0">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-2 bg-ocean-surface border border-ocean-border rounded-[24px] px-2 py-1.5 focus-within:border-biolum/50 focus-within:ring-1 focus-within:ring-biolum/20 transition-all">
                                                <input type="file" ref={attachmentInputRef} className="hidden" onChange={(e) => { if(e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="ghost" size="icon" className="text-ocean-text-dim hover:text-ocean-text hover:bg-black/10 self-center shrink-0">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-48 bg-ocean-card border border-ocean-border/80">
                                                        <DropdownMenuLabel className="text-ocean-text text-[10px] uppercase font-bold tracking-widest opacity-50">Attach File</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-ocean-border/50" />
                                                        <DropdownMenuItem onClick={() => { attachmentInputRef.current.accept = 'image/*'; attachmentInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                            <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                                            Photo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { attachmentInputRef.current.accept = 'video/*'; attachmentInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                            <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                                            Video
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { attachmentInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip'; attachmentInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                                            <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                                            Document
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <textarea value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} placeholder="Message..." className="flex-1 min-w-0 bg-transparent border-none py-2 px-1 text-[15px] leading-relaxed text-ocean-text focus:outline-none focus:ring-0 placeholder-ocean-text-dim resize-none max-h-32 min-h-[44px] custom-scrollbar self-center" rows="1" />
                                                <Button type="submit" size="icon" disabled={(!newMessage.trim() && !attachment) || sending} className="w-9 h-9 rounded-full bg-biolum text-white hover:bg-biolum-bright flex items-center justify-center shrink-0 self-center">
                                                    <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </>
                        );
                    })() : (
                        <div className="flex flex-col items-center justify-center text-center opacity-40">
                            <svg className="w-16 h-16 text-ocean-text-dim mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <h3 className="text-ocean-text font-bold text-xl">Your Messages</h3>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <Dialog open={!!mediaDrawerType} onOpenChange={(open) => !open && setMediaDrawerType(null)}>
                    <DialogContent className="max-w-2xl bg-ocean-card border-ocean-border text-ocean-text">
                        <DialogHeader className="border-b border-ocean-border pb-4">
                            <DialogTitle className="capitalize font-bold flex items-center gap-2">{mediaDrawerType}</DialogTitle>
                            <DialogDescription className="text-xs text-ocean-text-dim">Browse shared {mediaDrawerType} in this conversation.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[50vh] pr-4 mt-2">
                            {(() => {
                                const images = sharedMedia.filter(m => m.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
                                const videos = sharedMedia.filter(m => m.media_url.match(/\.(mp4|webm|mov)$/i));
                                const docs = sharedMedia.filter(m => !m.media_url.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|mov)$/i));
                                
                                let targetMedia = [];
                                if (mediaDrawerType === 'images') targetMedia = images;
                                else if (mediaDrawerType === 'videos') targetMedia = videos;
                                else if (mediaDrawerType === 'documents') targetMedia = docs;

                                if (targetMedia.length === 0) {
                                    return <div className="py-16 text-center text-sm font-semibold text-ocean-text-dim opacity-50">No {mediaDrawerType} shared yet.</div>;
                                }

                                if (mediaDrawerType === 'images') {
                                    return (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {targetMedia.map(m => (
                                                <button type="button" onClick={() => setFullscreenMedia({ url: m.media_url, type: 'image' })} key={m.id} className="aspect-square rounded-xl overflow-hidden bg-black/20 hover:ring-2 hover:ring-biolum transition-all shadow-md group cursor-zoom-in">
                                                    <img src={m.media_url} className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal opacity-80 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    );
                                } else if (mediaDrawerType === 'videos') {
                                    return (
                                        <div className="flex flex-col gap-4">
                                            {targetMedia.map(m => (
                                                <button type="button" onClick={() => setFullscreenMedia({ url: m.media_url, type: 'video' })} key={m.id} className="w-full rounded-xl bg-black/20 border border-ocean-border shadow-md overflow-hidden cursor-zoom-in group relative">
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors z-10" />
                                                    <video src={m.media_url} className="w-full pointer-events-none" />
                                                </button>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="flex flex-col gap-2">
                                            {targetMedia.map(m => (
                                                <a href={m.media_url} download target="_blank" rel="noreferrer" key={m.id} className="flex items-center gap-4 p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:border-biolum/50 shadow-sm transition-all group">
                                                    <div className="p-3 bg-biolum/10 text-biolum rounded-lg group-hover:bg-biolum group-hover:text-white transition-colors shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <p className="font-bold text-sm truncate text-ocean-text group-hover:text-biolum transition-colors cursor-pointer">{m.media_url.split('/').pop() || `Document_${m.id}`}</p>
                                                        <p className="text-[10px] uppercase tracking-widest text-ocean-text-dim mt-0.5">Click to view/download</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    );
                                }
                            })()}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Report Modal */}
                <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                    <DialogContent className="max-w-sm bg-ocean-card border-ocean-border text-ocean-text">
                        {reportSuccess ? (
                            <div className="p-8 text-center">
                                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-ocean-text">Report Submitted</DialogTitle>
                                <DialogDescription className="text-sm text-ocean-text-dim mt-1">An admin will review this conversation.</DialogDescription>
                            </div>
                        ) : (
                            <>
                                <DialogHeader className="px-1 border-b border-ocean-border pb-4">
                                    <div className="flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-amber-400" />
                                        <DialogTitle className="font-bold text-ocean-text">Report Conversation</DialogTitle>
                                    </div>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <DialogDescription className="text-xs text-ocean-text-dim">Select a reason for reporting this conversation:</DialogDescription>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'harassment', label: 'Harassment or Bullying', Icon: ShieldAlert },
                                            { value: 'spam', label: 'Spam or Scam', Icon: Mail },
                                            { value: 'inappropriate', label: 'Inappropriate Content', Icon: AlertTriangle },
                                            { value: 'hate_speech', label: 'Hate Speech', Icon: Ban },
                                            { value: 'threats', label: 'Threats or Violence', Icon: Sword },
                                            { value: 'other', label: 'Other', Icon: ClipboardList },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setReportReason(opt.value)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${reportReason === opt.value ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 font-bold' : 'bg-ocean-surface border-ocean-border text-ocean-text hover:bg-ocean-card'}`}
                                            >
                                                <opt.Icon className="w-4 h-4 shrink-0" />
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={reportDetails}
                                        onChange={e => setReportDetails(e.target.value)}
                                        placeholder="Additional details (optional)..."
                                        rows={2}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text placeholder:text-ocean-text-dim/50 focus:outline-none focus:border-amber-500/50 resize-none"
                                    />
                                </div>
                                <DialogFooter className="flex gap-3 px-1 pt-2">
                                    <Button variant="outline" onClick={() => setShowReportModal(false)} className="flex-1 bg-ocean-surface border-ocean-border text-ocean-text hover:bg-ocean-card">Cancel</Button>
                                    <Button onClick={handleReport} disabled={!reportReason || reportSending} className="flex-1 bg-amber-500 text-white hover:bg-amber-600">
                                        {reportSending ? 'Sending...' : 'Submit Report'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Fullscreen Media Viewer */}
                {fullscreenMedia && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
                        <button 
                            type="button" 
                            onClick={() => setFullscreenMedia(null)}
                            className="absolute top-6 right-6 lg:top-10 lg:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 backdrop-blur-md"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="relative w-full h-full p-4 md:p-12 flex items-center justify-center" onClick={(e) => { if(e.target === e.currentTarget) setFullscreenMedia(null); }}>
                            {fullscreenMedia.type === 'video' ? (
                                <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] outline-none ring-1 ring-white/10" />
                            ) : (
                                <img src={fullscreenMedia.url} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ring-1 ring-white/10" alt="Fullscreen Media" />
                            )}
                        </div>
                    </div>
                )}

                {/* Create Group Modal */}
                <CreateGroupModal
                    open={showCreateGroup}
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(newConv) => {
                        setConversations(prev => [newConv, ...prev]);
                        setSelectedConversation(newConv);
                    }}
                    currentUserId={auth.user.id}
                />

                {/* Group Call Overlay */}
                {activeGroupCall && (
                    <GroupCallOverlay
                        conversationId={selectedConversation?.id}
                        conversationName={activeGroupCall.conversationName}
                        callData={activeGroupCall}
                        isHost={activeGroupCall.isHost}
                        onLeave={() => setActiveGroupCall(null)}
                        currentUser={auth.user}
                        participants={[]}
                    />
                )}
            </div>
        </MainLayout>
    );
}

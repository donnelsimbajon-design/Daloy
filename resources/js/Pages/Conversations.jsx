import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';
import { ShieldAlert, Mail, AlertTriangle, Ban, Sword, ClipboardList, CheckCircle, X, Flag, FileText } from 'lucide-react';

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
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSending, setReportSending] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [attachment, setAttachment] = useState(null);
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
            await axios.post(`/api/users/${userId}/block`);
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

            <div className="flex h-[calc(100vh-9rem)] w-full rounded-2xl border border-ocean-border bg-ocean-card overflow-hidden shadow-sm mt-4">
                {/* 1. List */}
                <div className={`w-full md:w-[320px] lg:w-[340px] flex flex-col shrink-0 border-r border-ocean-border bg-ocean-card ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="h-[72px] px-5 flex items-center justify-between border-b border-ocean-border bg-ocean-card shrink-0">
                        <div className="flex-1 w-full relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Search chats..." className="w-full bg-ocean-surface border border-ocean-border rounded-lg pl-9 pr-3 py-2 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 placeholder-ocean-text-dim/50 transition-all" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-biolum/30 border-t-biolum rounded-full animate-spin"></div></div>
                        ) : conversations.length === 0 ? (
                            <p className="text-center text-sm text-ocean-text-dim py-8">No conversations yet.</p>
                        ) : (
                            conversations.map(conv => {
                                const other = getOtherParticipant(conv);
                                const isActive = selectedConversation?.id === conv.id;
                                return (
                                    <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-ocean-border/30 transition-colors ${isActive ? 'bg-biolum/5 border-l-2 border-l-biolum' : 'hover:bg-ocean-surface border-l-2 border-l-transparent'}`}>
                                        <div className="relative shrink-0 w-12 h-12 rounded-full bg-biolum/20 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center font-bold text-ocean-text text-sm">
                                            {other?.profile_picture ? <img src={other.profile_picture} className="w-full h-full object-cover" /> : getAvatarText(getParticipantName(conv))}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-biolum' : 'text-ocean-text'}`}>{getParticipantName(conv)}</h3>
                                                {conv.latest_message && <span className="text-[10px] uppercase font-bold text-ocean-text-dim tracking-wider ml-2 shrink-0">{formatTime(conv.latest_message.created_at)}</span>}
                                            </div>
                                            <p className={`text-xs truncate ${isActive ? 'text-ocean-text' : 'text-ocean-text-dim'}`}>
                                                {conv.latest_message ? conv.latest_message.content : 'No messages'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Chat */}
                <div className={`flex-1 flex flex-col min-w-0 bg-ocean-deep relative ${!selectedConversation ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {selectedConversation ? (() => {
                        const otherUser = getOtherParticipant(selectedConversation);
                        return (
                            <>
                                <div className="h-[72px] px-6 border-b border-ocean-border bg-ocean-card flex items-center justify-between shrink-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedConversation(null)} className="md:hidden p-1.5 -ml-2 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                        </button>
                                        <h3 className="font-extrabold text-ocean-text text-base flex items-center gap-2">
                                            {otherUser ? otherUser.name : getParticipantName(selectedConversation)}
                                            {/* Never show online dot if conversation is blocked */}
                                            {!isBlocked && otherUser?.is_online && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                                        </h3>
                                    </div>
                                    <button className="p-2 text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface rounded-full transition-colors hidden lg:block">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex flex-col">
                                    {messages.map((msg) => {
                                        const isMe = msg.user_id === auth.user.id;
                                        return (
                                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] relative text-sm leading-relaxed px-4 py-2.5 shadow-sm border border-ocean-border/50 ${isMe ? 'bg-biolum text-white rounded-2xl rounded-tr-sm self-end' : 'bg-ocean-card text-ocean-text rounded-l-2xl rounded-r-2xl rounded-tl-sm self-start'}`}>
                                                    {msg.media_url && (
                                                        <div className="mb-2 w-full rounded-xl overflow-hidden border border-ocean-border/50 bg-black/10">
                                                            {msg.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.media_url.startsWith('blob:') ? (
                                                                <img src={msg.media_url} className="w-full h-auto max-h-64 object-cover" alt="attachment" />
                                                            ) : msg.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                                                                <video src={msg.media_url} controls className="w-full max-h-64 object-contain bg-black" />
                                                            ) : (
                                                                <a href={msg.media_url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 hover:bg-black/5 transition-colors ${isMe ? 'text-white' : 'text-ocean-text'}`}>
                                                                    <div className={`p-2 rounded-lg shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-biolum/20 text-biolum'}`}><FileText size={20} /></div>
                                                                    <span className="truncate text-sm font-semibold underline decoration-transparent hover:decoration-current transition-all">Download Attachment</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.content && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white/70' : 'text-ocean-text-dim'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && msg.id && msg.id > 100000000000 && ( // Just an optimistic ID check
                                                            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        )}
                                                        {isMe && msg.read_at && (
                                                            <svg className="w-3 h-3 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        )}
                                                        {isMe && !msg.read_at && msg.id && msg.id < 100000000000 && (
                                                            <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} className="h-2" />
                                </div>
                                
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

                                <div className="p-4 border-t border-ocean-border bg-ocean-card shrink-0 z-10">
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
                                                <input type="file" ref={attachmentInputRef} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" className="hidden" onChange={(e) => { if(e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />
                                                <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 text-ocean-text-dim hover:text-ocean-text self-center shrink-0">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                </button>
                                                <textarea value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} placeholder="Type a message..." className="flex-1 bg-transparent border-none py-2.5 px-1 text-sm text-ocean-text focus:outline-none focus:ring-0 placeholder-ocean-text-dim resize-none max-h-32 min-h-[40px] custom-scrollbar self-center" rows="1" />
                                                <button type="submit" disabled={(!newMessage.trim() && !attachment) || sending} className="w-10 h-10 rounded-full bg-biolum text-white flex items-center justify-center disabled:opacity-50 transition-all shrink-0 self-center hover:bg-biolum-bright">
                                                    <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                                </button>
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

                {/* 3. Details */}
                <div className="hidden lg:flex w-[280px] xl:w-[320px] bg-ocean-card flex-col border-l border-ocean-border shrink-0 z-10 overflow-hidden relative">
                    <div className="h-[72px] flex items-center justify-center border-b border-ocean-border bg-ocean-card shrink-0 z-10">
                        <h3 className="font-semibold text-sm text-ocean-text-dim">Details</h3>
                    </div>

                    {selectedConversation && getOtherParticipant(selectedConversation) ? (() => {
                        const otherUser = getOtherParticipant(selectedConversation);
                        return (
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between h-full bg-ocean-card">
                                {/* TOP SECTION: Profile Block & Quick Actions */}
                                <div className="p-6">
                                    <div className="bg-ocean-surface border border-ocean-border rounded-[24px] p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-b from-biolum/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div className="w-20 h-20 rounded-full border-2 border-ocean-border shadow-md mb-4 bg-ocean-card flex items-center justify-center overflow-hidden font-bold text-2xl text-ocean-text">
                                            {otherUser.profile_picture ? <img src={otherUser.profile_picture} className="w-full h-full object-cover" /> : getAvatarText(otherUser.name)}
                                        </div>
                                        <h3 className="font-bold text-lg text-ocean-text">{otherUser.name}</h3>
                                        <p className="text-xs font-semibold text-ocean-text-dim mb-5">@{otherUser.username || 'user'}</p>

                                        <Link href={`/users/${otherUser.id}`} className="w-full text-center px-5 py-2 rounded-xl bg-ocean-surface border border-ocean-border text-ocean-text text-xs font-semibold hover:bg-ocean-card hover:border-biolum/30 transition-colors">
                                            View Profile
                                        </Link>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center mt-4 px-2 gap-3">
                                        <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-ocean-surface border border-ocean-border hover:bg-ocean-card hover:border-biolum/30 transition-colors text-ocean-text group">
                                            <svg className="w-5 h-5 mb-1 text-ocean-text-dim group-hover:text-biolum transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                            <span className="text-xs font-semibold text-ocean-text-dim group-hover:text-ocean-text">Search</span>
                                        </button>
                                        <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-ocean-surface border border-ocean-border hover:bg-ocean-card hover:border-biolum/30 transition-colors text-ocean-text group">
                                            <svg className="w-5 h-5 mb-1 text-ocean-text-dim group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                            </svg>
                                            <span className="text-xs font-semibold text-ocean-text-dim group-hover:text-ocean-text">Mute</span>
                                        </button>
                                    </div>
                                </div>

                                {/* MIDDLE SECTION: Media & Files */}
                                <div className="px-6 flex-1">
                                    <div className="bg-ocean-surface border border-ocean-border rounded-[24px] p-5 mb-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs font-semibold text-ocean-text-dim">Shared Media</h4>
                                            {sharedMedia.length > 6 && <span className="text-[10px] font-bold text-biolum cursor-pointer uppercase hover:opacity-80">View All</span>}
                                        </div>
                                        {sharedMedia.length === 0 ? (
                                            <p className="text-xs text-ocean-text-dim italic text-center py-4">No media shared yet</p>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2">
                                                {sharedMedia.slice(0, 6).map(media => (
                                                    <div key={media.id} className="aspect-square bg-ocean-card border border-ocean-border rounded-xl overflow-hidden relative group cursor-pointer hover:border-biolum/50 transition-all shadow-sm">
                                                        <img src={media.media_url} className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:mix-blend-normal transition-all" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Mock Files inside card */}
                                    <div className="bg-ocean-surface border border-ocean-border rounded-[24px] p-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs font-semibold text-ocean-text-dim">Links & Files</h4>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="p-3 bg-ocean-card border border-ocean-border rounded-xl flex items-center gap-3 cursor-pointer hover:border-biolum/50 transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-biolum/10 text-biolum flex items-center justify-center group-hover:bg-biolum group-hover:text-white transition-colors shrink-0">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-ocean-text truncate group-hover:text-biolum transition-colors">Design_System.fig</p>
                                                    <p className="text-[9px] uppercase tracking-widest text-ocean-text-dim mt-0.5">2.4 MB • Figma</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM SECTION: Settings / Security */}
                                <div className="p-6 mt-4 space-y-2">
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full flex items-center justify-between p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:bg-ocean-card hover:border-amber-500/50 group transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-ocean-text-dim group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                                            </svg>
                                            <span className="text-xs font-semibold text-ocean-text group-hover:text-amber-500 transition-colors">Report Conversation</span>
                                        </div>
                                        <svg className="w-4 h-4 text-ocean-text-dim opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>

                                    <button
                                        onClick={() => handleBlockUser(otherUser?.id)}
                                        className="w-full flex items-center justify-between p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:bg-ocean-card hover:border-red-500/50 group transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-ocean-text-dim group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            <span className="text-xs font-semibold text-ocean-text group-hover:text-red-500 transition-colors">Block User</span>
                                        </div>
                                        <svg className="w-4 h-4 text-ocean-text-dim opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>

                                {/* Report Modal */}
                                {showReportModal && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                        <div className="bg-ocean-card border border-ocean-border rounded-2xl w-full max-w-sm shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
                                            {reportSuccess ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-ocean-text">Report Submitted</h3>
                                                    <p className="text-sm text-ocean-text-dim mt-1">An admin will review this conversation.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="px-5 py-4 border-b border-ocean-border flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Flag className="w-4 h-4 text-amber-400" />
                                                            <h3 className="font-bold text-ocean-text">Report Conversation</h3>
                                                        </div>
                                                        <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-lg hover:bg-ocean-surface text-ocean-text-dim transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-5 space-y-4">
                                                        <p className="text-xs text-ocean-text-dim">Select a reason for reporting this conversation:</p>
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
                                                            className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text placeholder-ocean-text-dim/50 focus:outline-none focus:border-amber-500/50 resize-none"
                                                        />
                                                    </div>
                                                    <div className="px-5 pb-5 flex gap-3">
                                                        <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-ocean-surface border border-ocean-border text-sm font-semibold text-ocean-text hover:bg-ocean-card transition-colors">Cancel</button>
                                                        <button onClick={handleReport} disabled={!reportReason || reportSending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors">
                                                            {reportSending ? 'Sending...' : 'Submit Report'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })() : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 px-6 text-center">
                            <svg className="w-12 h-12 text-ocean-text-dim mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                            <p className="text-xs font-bold text-ocean-text-dim tracking-widest uppercase">No Info</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

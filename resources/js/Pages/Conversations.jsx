import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';

export default function Conversations() {
    const { auth } = usePage().props;
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Check for user_id query param
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
            loadMessages(selectedConversation.id);
            const interval = setInterval(() => {
                loadMessages(selectedConversation.id, true);
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
            console.error("Error starting conversation:", error);
        }
    };

    const loadMessages = async (conversationId, background = false) => {
        if (!background) setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${conversationId}`);
            const newMessages = res.data.data.reverse();
            setMessages(newMessages);
        } catch (error) {
            console.error(error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            conversation_id: selectedConversation.id,
            user_id: auth.user.id,
            content: newMessage,
            created_at: new Date().toISOString(),
            user: auth.user
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setSending(true);

        try {
            const res = await axios.post('/api/messages/send', {
                conversation_id: selectedConversation.id,
                content: optimisticMessage.content
            });
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const getParticipantName = (conversation) => {
        if (conversation.type === 'group') return conversation.name || 'Group Chat';
        // Defensive: check participants exists and is an array
        if (!conversation.participants || !Array.isArray(conversation.participants)) {
            return 'Loading...';
        }
        const other = conversation.participants.find(p => p.id !== auth.user.id);
        return other ? other.name : 'Unknown User';
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation.participants || !Array.isArray(conversation.participants)) {
            return null;
        }
        return conversation.participants.find(p => p.id !== auth.user.id);
    };

    const getAvatarText = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const dayMs = 86400000;

        if (diff < dayMs) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < dayMs * 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <MainLayout>
            <Head title="Conversations" />

            <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto gap-0 md:gap-4 p-0 md:p-4">

                {/* ── Conversation List ─────────────────────────────── */}
                <div className={`w-full md:w-[380px] bg-ocean-card border border-ocean-border rounded-none md:rounded-2xl flex flex-col overflow-hidden ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-5 border-b border-ocean-border bg-ocean-surface/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-extrabold text-ocean-text tracking-tight">Messages</h2>
                                <p className="text-xs text-ocean-text-dim mt-0.5">
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-biolum/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Conversation Items */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-ocean-text-dim">
                                <div className="w-8 h-8 border-2 border-biolum/30 border-t-biolum rounded-full animate-spin mb-3" />
                                <span className="text-sm">Loading conversations...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-ocean-surface/50 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-ocean-text-dim opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-ocean-text-dim text-sm font-medium">No conversations yet</p>
                                <p className="text-ocean-text-dim/60 text-xs mt-1">Start chatting by visiting a user's profile</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const other = getOtherParticipant(conv);
                                const isActive = selectedConversation?.id === conv.id;
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-ocean-border/30 group ${isActive
                                            ? 'bg-biolum/10 border-l-2 border-l-biolum'
                                            : 'hover:bg-ocean-surface/60 border-l-2 border-l-transparent'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-ocean-text font-bold text-sm overflow-hidden ring-2 transition-all ${isActive ? 'ring-biolum/50' : 'ring-ocean-border group-hover:ring-ocean-text-dim/30'
                                                } bg-biolum/20`}>
                                                {other?.profile_picture ? (
                                                    <img src={other.profile_picture} alt={other.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    getAvatarText(getParticipantName(conv))
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-semibold text-sm truncate transition-colors ${isActive ? 'text-biolum' : 'text-ocean-text group-hover:text-biolum'
                                                    }`}>
                                                    {getParticipantName(conv)}
                                                </h3>
                                                {conv.latest_message && (
                                                    <span className="text-[10px] text-ocean-text-dim ml-2 shrink-0">
                                                        {formatTime(conv.latest_message.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-ocean-text-dim truncate mt-0.5">
                                                {conv.latest_message ? conv.latest_message.content : 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Chat Window ───────────────────────────────────── */}
                <div className={`flex-1 bg-ocean-card border border-ocean-border rounded-none md:rounded-2xl flex flex-col overflow-hidden ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (() => {
                        const otherUser = getOtherParticipant(selectedConversation);
                        return (
                            <>
                                {/* Chat Header */}
                                <div className="px-5 py-3.5 border-b border-ocean-border flex items-center justify-between bg-ocean-surface/60">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="md:hidden p-1.5 rounded-lg text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                        </button>

                                        {/* Clickable avatar → profile */}
                                        {otherUser ? (
                                            <Link href={`/users/${otherUser.id}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-full bg-biolum/20 flex items-center justify-center text-white font-bold text-sm ring-2 ring-ocean-border group-hover:ring-biolum/50 transition-all overflow-hidden">
                                                    {otherUser.profile_picture ? (
                                                        <img src={otherUser.profile_picture} alt={otherUser.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        getAvatarText(otherUser.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-ocean-text text-sm group-hover:text-biolum transition-colors">{otherUser.name}</h3>
                                                    {otherUser.username && (
                                                        <p className="text-[11px] text-ocean-text-dim">@{otherUser.username}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-biolum/20 flex items-center justify-center text-white font-bold text-sm ring-2 ring-ocean-border">
                                                    {getAvatarText(getParticipantName(selectedConversation))}
                                                </div>
                                                <h3 className="font-bold text-ocean-text text-sm">{getParticipantName(selectedConversation)}</h3>
                                            </div>
                                        )}
                                    </div>

                                    {/* Profile link button */}
                                    {otherUser && (
                                        <Link
                                            href={`/users/${otherUser.id}`}
                                            className="p-2 rounded-lg text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface transition-colors"
                                            title="View Profile"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </Link>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
                                    style={{ background: 'linear-gradient(180deg, rgba(11,17,32,0.6) 0%, rgba(21,31,50,0.4) 100%)' }}>
                                    {messages.length === 0 && !loading && (
                                        <div className="flex flex-col items-center justify-center h-full text-ocean-text-dim">
                                            <svg className="w-12 h-12 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p className="text-sm">Send a message to start the conversation</p>
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMe = msg.user_id === auth.user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe
                                                    ? 'bg-biolum text-white rounded-br-md'
                                                    : 'bg-ocean-surface border border-ocean-border text-ocean-text rounded-bl-md'
                                                    }`}
                                                    style={{}}
                                                >
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1.5 ${isMe ? 'text-ocean-text/60' : 'text-ocean-text-dim'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={sendMessage} className="p-4 border-t border-ocean-border bg-ocean-surface/30">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-ocean-deep border border-ocean-border rounded-full px-5 py-2.5 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder-ocean-text-dim"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="p-2.5 rounded-full bg-biolum text-white disabled:opacity-40 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </>
                        );
                    })() : (
                        <div className="flex-1 flex flex-col items-center justify-center text-ocean-text-dim p-8">
                            <div className="w-20 h-20 rounded-2xl bg-ocean-surface/30 flex items-center justify-center mb-5">
                                <svg className="w-10 h-10 opacity-25" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-ocean-text font-bold text-lg mb-1">Your Messages</h3>
                            <p className="text-sm text-center max-w-xs">Select a conversation to start messaging, or visit a user's profile to begin a new chat.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

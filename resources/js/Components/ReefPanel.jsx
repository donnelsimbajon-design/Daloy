import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';

/* ── Static data (swap with API later) ───────────────────────────────── */
const trendingCurrents = [
    '#OceanicTech', '#LiquidMotion', '#SaltLife2024', '#Biolum', '#DeepDiveUI',
    '#CoralCode', '#TidalWave', '#AquaDesign', '#SeaShell', '#DeepBlue',
];

const suggestedGroups = [
    { name: 'Coral Designers', members: '12.4k', active: 23, initial: 'C', color: 'bg-cyan-600' },
    { name: 'Aquatic Arch', members: '8.1k', active: 5, initial: 'A', color: 'bg-blue-600' },
    { name: 'Tidal Devs', members: '5.2k', active: 12, initial: 'T', color: 'bg-indigo-600' },
    { name: 'Reef Builders', members: '3.7k', active: 8, initial: 'R', color: 'bg-emerald-600' },
];

/* ── Search Input ────────────────────────────────────────────────────── */
function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2.5 bg-ocean-surface/40 border border-ocean-border rounded-xl text-xs text-ocean-text placeholder-ocean-text-dim/50 focus:outline-none focus:border-biolum/40 focus:ring-1 focus:ring-biolum/15 focus:bg-ocean-card transition-all"
            />
        </div>
    );
}

/* ── Trending Panel ──────────────────────────────────────────────────── */
function TrendingPanel() {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() =>
        trendingCurrents.filter(tag =>
            tag.toLowerCase().includes(search.toLowerCase())
        ), [search]
    );

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 animate-[fadeIn_0.25s_ease-out]">
            {/* Section 1: Header & Search */}
            <div className="pb-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-ocean-text leading-tight tracking-[-0.01em]">Trending Currents</h3>
                        <p className="text-[10px] text-ocean-text-dim/60">What&apos;s hot right now</p>
                    </div>
                </div>

                <SearchBar value={search} onChange={setSearch} placeholder="Search trends..." />
            </div>

            {/* Divider */}
            <div className="h-px bg-ocean-divider-subtle mx-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />

            {/* Section 2: Tags */}
            <div className="py-4">
                <div className="flex flex-wrap gap-2">
                    {filtered.length > 0 ? filtered.map((tag) => (
                        <button
                            key={tag}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-biolum bg-biolum/5 border border-biolum/20 hover:bg-biolum hover:text-ocean-deep hover:border-biolum transition-colors"
                        >
                            {tag}
                        </button>
                    )) : (
                        <p className="text-xs text-ocean-text-dim italic py-3">No trends matching &quot;{search}&quot;</p>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-ocean-divider-subtle mx-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />

            {/* Section 3: Popular Today */}
            <div className="pt-4">
                <h4 className="text-xs font-semibold text-ocean-text-dim mb-3">Popular Today</h4>
                <div className="space-y-3">
                    {['#OceanicTech', '#LiquidMotion', '#Biolum'].map((tag, i) => (
                        <div key={tag} className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-ocean-card/50 transition-all">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-ocean-text-dim/40 w-5">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-bold text-ocean-text tracking-[-0.01em]">{tag}</p>
                                    <p className="text-[10px] text-ocean-text-dim/50 font-normal">{Math.floor(Math.random() * 500 + 100)} posts</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-ocean-text-dim/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── Groups Panel ───────────────────────────────────────────────────── */
function GroupsPanel() {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() =>
        suggestedGroups.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        ), [search]
    );

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-ocean-text leading-tight">Suggested Groups</h3>
                    <p className="text-[10px] text-ocean-text-dim">Communities you might like</p>
                </div>
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="Search groups..." />

            <div className="space-y-2">
                {filtered.length > 0 ? filtered.map((group) => (
                    <div key={group.name} className="flex items-center justify-between p-3 rounded-[14px] bg-ocean-card/50 border border-ocean-divider-subtle hover:border-ocean-hover hover:bg-ocean-card/80 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center text-white font-bold text-sm`}>
                                {group.initial}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-ocean-text tracking-[-0.01em]">{group.name}</h4>
                                <p className="text-[11px] text-ocean-text-dim/60">{group.members} members · {group.active} active</p>
                            </div>
                        </div>
                        <button className="px-4 py-1.5 rounded-xl text-xs font-semibold text-ocean-deep bg-biolum hover:bg-biolum-bright transition-colors">
                            Join
                        </button>
                    </div>
                )) : (
                    <p className="text-xs text-ocean-text-dim italic py-3">No groups matching &quot;{search}&quot;</p>
                )}
            </div>

            {/* Browse all */}
            <div className="pt-3">
                <button className="w-full py-2.5 text-sm font-semibold text-biolum bg-biolum/10 rounded-xl hover:bg-biolum/20 transition-all">
                    Browse All Groups
                </button>
            </div>
        </div>
    );
}

/* ── Chat Thread View (Nested in Messages) ──────────────────────────── */
function ChatThreadView({ chat, onBack, currentUser }) {
    const [messageText, setMessageText] = React.useState('');
    const [messages, setMessages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const messagesEndRef = React.useRef(null);
    
    // Fetch live messages
    React.useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/messages/${chat.id}`);
                if (isMounted) {
                    setMessages(res.data.data.reverse());
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to load generic chat:", err);
                if (isMounted) setLoading(false);
            }
        };
        fetchMessages();
        
        // Optional polling every 3 seconds to stay updated
        const interval = setInterval(fetchMessages, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [chat.id]);

    // Auto-scroll to the bottom when new messages are added
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!messageText.trim()) return;
        
        const contentToSend = messageText.trim();
        setMessageText('');

        // Optimistic UI update
        const tempId = Date.now();
        setMessages(prev => [...prev, {
            id: tempId,
            user_id: currentUser.id,
            content: contentToSend,
            created_at: new Date().toISOString()
        }]);

        try {
            const res = await axios.post('/api/messages/send', {
                conversation_id: chat.id,
                content: contentToSend
            });
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (err) {
            console.error("Failed to send message:", err);
            // Revert on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return (
        <div className="flex flex-col h-[60vh] min-h-[400px] flex-1 animate-[slideInRight_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-ocean-divider shrink-0">
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-ocean-surface/50 text-ocean-text-dim hover:text-ocean-text transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    {chat.avatar ? (
                        <img src={chat.avatar} alt={chat.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {chat.initial || chat.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-ocean-text leading-tight">{chat.name}</h3>
                        <p className="text-[10px] text-biolum font-medium">Active now</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto w-full no-scrollbar py-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10 opacity-50">
                        <svg className="w-6 h-6 animate-spin text-biolum" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-ocean-text-dim italic py-10">No messages yet. Say hi!</p>
                ) : (
                    messages.map(msg => {
                        const isSelf = msg.user_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.2s_ease-out]`}>
                                <div className={`max-w-[85%] rounded-[18px] px-4 py-2.5 ${isSelf ? 'bg-biolum text-white rounded-tr-sm shadow-[0_1px_3px_rgba(25,25,112,0.15)]' : 'bg-ocean-card/60 border border-ocean-divider-subtle text-ocean-text rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]'}`}>
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <p className={`text-[9px] mt-1 text-right ${isSelf ? 'text-white/70' : 'text-ocean-text-dim'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="pt-4 pb-2 border-t border-ocean-divider flex items-center gap-2 shrink-0">
                <button type="button" className="p-2 rounded-full text-ocean-text-dim hover:bg-ocean-surface hover:text-biolum transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
                <input 
                    type="text" 
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-ocean-surface/40 border border-ocean-border rounded-full px-4 py-2 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/30 transition-all placeholder:text-ocean-text-dim"
                />
                <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-2 rounded-full text-biolum hover:bg-biolum/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                </button>
            </form>
        </div>
    );
}

/* ── Messages Panel ─────────────────────────────────────────────────── */
function MessagesPanel() {
    const { auth, social } = usePage().props;
    const conversations = social?.recent_conversations || [];
    const [search, setSearch] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);

    const filtered = conversations.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase())
    );

    const avatarColors = ['bg-cyan-600', 'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];

    if (selectedChat) {
        return <ChatThreadView chat={selectedChat} onBack={() => setSelectedChat(null)} currentUser={auth.user} />;
    }

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-ocean-text leading-tight">Messages</h3>
                    <p className="text-[10px] text-ocean-text-dim">Recent conversations</p>
                </div>
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="Search messages..." />

            <div className="space-y-1">
                {filtered.length > 0 ? filtered.map((msg, i) => (
                    <button 
                        key={msg.id} 
                        onClick={() => setSelectedChat(msg)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${msg.unread ? 'bg-ocean-surface/40 border border-biolum/20' : 'hover:bg-ocean-surface/30 border border-transparent'}`}
                    >
                        {msg.avatar ? (
                            <img src={msg.avatar} alt={msg.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                {msg.initial}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className={`text-xs font-semibold ${msg.unread ? 'text-ocean-text' : 'text-ocean-text-dim'}`}>{msg.name}</p>
                                <span className="text-[10px] text-ocean-text-dim shrink-0">{msg.time}</span>
                            </div>
                            <p className={`text-[11px] mt-0.5 truncate ${msg.unread ? 'text-ocean-text font-medium' : 'text-ocean-text-dim'}`}>{msg.message}</p>
                        </div>
                        {msg.unread && <div className="w-2 h-2 rounded-full bg-biolum shrink-0 mt-2" />}
                    </button>
                )) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <svg className="w-10 h-10 text-ocean-text-dim mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                        <p className="text-xs text-ocean-text-dim">{search ? `No messages matching "${search}"` : 'No conversations yet.'}</p>
                    </div>
                )}
            </div>

            <div className="pt-3">
                <a href="/conversations" className="block w-full py-2.5 text-sm font-semibold text-biolum bg-biolum/10 rounded-xl hover:bg-biolum/20 transition-all text-center">
                    View All Conversations
                </a>
            </div>
        </div>
    );
}

/* ── Notifications Panel ────────────────────────────────────────────── */
function NotificationsPanel() {
    const { social } = usePage().props;
    const notifications = social?.recent_notifications || [];
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const filtered = notifications.filter(n =>
        (n.user || '').toLowerCase().includes(search.toLowerCase()) ||
        (n.action || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAction = async (e, type, rawId) => {
        e.stopPropagation();
        setActionLoading(rawId);
        try {
            if (rawId.startsWith('fr_')) {
                const id = rawId.replace('fr_', '');
                if (type === 'accept') {
                    await axios.post('/api/friend-request/accept', { request_id: id });
                } else {
                    await axios.post('/api/friend-request/reject', { request_id: id });
                }
            } else if (rawId.startsWith('flr_')) {
                const id = rawId.replace('flr_', '');
                if (type === 'accept') {
                    await axios.post('/api/follow-request/accept', { request_id: id });
                } else {
                    await axios.post('/api/follow-request/reject', { request_id: id });
                }
            }
            router.reload({ only: ['social'] });
        } catch (error) {
            console.error('Error handling request:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const navigateToUser = (userId) => {
        if (userId) {
            router.visit(`/users/${userId}`);
        }
    };

    const typeColors = {
        friend: 'bg-blue-500',
        follow: 'bg-emerald-500',
        like: 'bg-rose-500',
        comment: 'bg-amber-500',
        share: 'bg-purple-500',
        mention: 'bg-cyan-500',
    };

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-ocean-text leading-tight">Notifications</h3>
                    <p className="text-[10px] text-ocean-text-dim">Recent activity & updates</p>
                </div>
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="Search activity..." />

            <div className="space-y-1">
                {filtered.length > 0 ? filtered.map((notif) => (
                    <div
                        key={notif.id}
                        onClick={() => navigateToUser(notif.user_id)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-ocean-surface/30 transition-colors cursor-pointer group/notif"
                    >
                        {notif.avatar ? (
                            <img src={notif.avatar} alt={notif.user} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${typeColors[notif.type] || 'bg-biolum'} shrink-0`} />
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-ocean-text leading-relaxed">
                                <span className="font-semibold text-ocean-text">{notif.user}</span>{' '}
                                {notif.action}
                            </p>
                            <p className="text-[10px] text-ocean-text-dim mt-0.5">{notif.time}</p>
                            
                            {notif.type === 'friend' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleAction(e, 'accept', notif.id)}
                                        disabled={actionLoading === notif.id}
                                        className="px-3 py-1 bg-biolum text-white text-[11px] font-medium rounded hover:bg-biolum-bright transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === notif.id ? '...' : 'Accept'}
                                    </button>
                                    <button
                                        onClick={(e) => handleAction(e, 'decline', notif.id)}
                                        disabled={actionLoading === notif.id}
                                        className="px-3 py-1 bg-transparent border border-ocean-border text-ocean-text-muted text-[11px] font-medium rounded hover:bg-ocean-surface transition-colors disabled:opacity-50"
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}

                            {notif.type === 'follow' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleAction(e, 'accept', notif.id)}
                                        disabled={actionLoading === notif.id}
                                        className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-medium rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === notif.id ? '...' : 'Accept'}
                                    </button>
                                    <button
                                        onClick={(e) => handleAction(e, 'decline', notif.id)}
                                        disabled={actionLoading === notif.id}
                                        className="px-3 py-1 bg-transparent border border-ocean-border text-ocean-text-muted text-[11px] font-medium rounded hover:bg-ocean-surface transition-colors disabled:opacity-50"
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <svg className="w-10 h-10 text-ocean-text-dim mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                        <p className="text-xs text-ocean-text-dim">{search ? `No activity matching "${search}"` : 'No notifications yet.'}</p>
                    </div>
                )}
            </div>

            <div className="pt-3">
                <button className="w-full py-2.5 text-sm font-semibold text-biolum bg-biolum/10 rounded-xl hover:bg-biolum/20 transition-all">
                    View All Notifications
                </button>
            </div>
        </div>
    );
}

/* ── Language Panel ──────────────────────────────────────────────────── */
function LanguagePanel() {
    // Use a simple local state approach since we can't import hooks here easily
    const languages = [
        { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
        { code: 'tl', name: 'Tagalog', native: 'Filipino', flag: '🇵🇭' },
    ];

    const [currentLang, setCurrentLang] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('daloy-lang') || 'en';
        }
        return 'en';
    });

    const handleLangChange = (code) => {
        setCurrentLang(code);
        localStorage.setItem('daloy-lang', code);
        window.location.reload();
    };

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-ocean-text leading-tight">Language</h3>
                    <p className="text-[10px] text-ocean-text-dim/60">Choose your preferred language</p>
                </div>
            </div>

            <div className="space-y-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLangChange(lang.code)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-[14px] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${currentLang === lang.code
                            ? 'bg-biolum/15 border border-biolum/40 text-biolum shadow-[0_1px_4px_rgba(25,25,112,0.1)]'
                            : 'bg-ocean-card/50 border border-ocean-divider-subtle hover:border-ocean-hover hover:bg-ocean-card/80 text-ocean-text'
                            }`}
                    >
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="text-left flex-1">
                            <p className="text-sm font-bold tracking-[-0.01em]">{lang.name}</p>
                            <p className="text-[11px] text-ocean-text-dim/60">{lang.native}</p>
                        </div>
                        {currentLang === lang.code && (
                            <svg className="w-5 h-5 text-biolum shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 rounded-[14px] bg-ocean-surface/20 border border-ocean-divider-subtle shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <p className="text-[11px] text-ocean-text-dim leading-relaxed">
                    Changing language will translate navigation labels, buttons, and common UI text throughout the app.
                </p>
            </div>
        </div>
    );
}

/* ── Main ReefPanel ──────────────────────────────────────────────────── */
export default function ReefPanel({ activePanel }) {
    if (!activePanel) return null;

    return (
        <div>
            {/* Panel content */}
            <div key={activePanel}>
                {activePanel === 'trending' && <TrendingPanel />}
                {activePanel === 'groups' && <GroupsPanel />}
                {activePanel === 'messages' && <MessagesPanel />}
                {activePanel === 'notifications' && <NotificationsPanel />}
                {activePanel === 'language' && <LanguagePanel />}
            </div>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                `
            }} />
        </div>
    );
}

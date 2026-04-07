import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/shadcn/card';
import { Button } from '@/Components/shadcn/button';
import { Input } from '@/Components/shadcn/input';
import { Badge } from '@/Components/shadcn/badge';
import { FileText, X, Video, Phone } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/Components/shadcn/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/shadcn/dialog';
import { ScrollArea } from '@/Components/shadcn/scroll-area';
function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
            </div>
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 h-9 rounded-xl border-ocean-border/60 shadow-sm"
            />
        </div>
    );
}

/* ── Trending Panel ──────────────────────────────────────────────────── */
function TrendingPanel() {
    const { reef } = usePage().props;
    const trendingHashtags = reef?.trending_hashtags || [];
    const popularToday = reef?.popular_today || [];
    const [search, setSearch] = useState('');

    const filtered = useMemo(() =>
        trendingHashtags.filter(tag =>
            tag.name.toLowerCase().includes(search.toLowerCase())
        ), [search, trendingHashtags]
    );

    return (
        <Card className="animate-[fadeIn_0.25s_ease-out] shadow-none">
            <CardHeader className="pb-3 border-b border-ocean-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="text-sm">Trending Currents</CardTitle>
                        <CardDescription className="text-[10px]">What's hot right now</CardDescription>
                    </div>
                </div>
                <SearchBar value={search} onChange={setSearch} placeholder="Search trends..." />
            </CardHeader>
            <CardContent className="py-4 space-y-4">
                {/* Section 2: Tags */}
                <div>
                    <div className="flex flex-wrap gap-2">
                        {filtered.length > 0 ? filtered.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-biolum hover:text-white transition-colors">
                                {tag.name}
                            </Badge>
                        )) : trendingHashtags.length === 0 ? (
                        <p className="text-xs text-ocean-text-dim italic py-3">No trending hashtags yet — start posting!</p>
                    ) : (
                        <p className="text-xs text-ocean-text-dim italic py-3">No trends matching &quot;{search}&quot;</p>
                    )}
                </div>
            </div>

            <div className="h-px bg-ocean-divider-subtle mx-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />

            {/* Section 3: Popular Today */}
            <div>
                <h4 className="text-xs font-semibold text-ocean-text-dim mb-3">Popular Today</h4>
                <div className="space-y-3">
                    {popularToday.length > 0 ? popularToday.map((tag, i) => (
                        <div key={tag.id} className="flex items-center justify-between p-2.5 rounded-xl border border-ocean-border/50 bg-ocean-surface/30 hover:bg-ocean-surface transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-ocean-text-dim/40 w-5">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-bold text-ocean-text tracking-tight">{tag.name}</p>
                                    <p className="text-[10px] text-ocean-text-dim/50 font-normal">{tag.posts} posts</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-ocean-text-dim/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22" />
                            </svg>
                        </div>
                    )) : (
                        <p className="text-xs text-ocean-text-dim italic py-2">No trending content yet</p>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
    );
}

/* ── Groups Panel ───────────────────────────────────────────────────── */
function GroupsPanel() {
    const { reef } = usePage().props;
    const groups = reef?.suggested_groups || [];
    const [search, setSearch] = useState('');
    const [joining, setJoining] = useState(null);

    const groupColors = ['bg-cyan-600', 'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600'];

    const filtered = useMemo(() =>
        groups.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        ), [search, groups]
    );

    const handleJoin = async (groupId) => {
        setJoining(groupId);
        try {
            await axios.post(`/schools/${groupId}/join`);
            router.reload({ only: ['reef'] });
        } catch (err) {
            console.error('Failed to join group:', err);
        } finally {
            setJoining(null);
        }
    };

    const formatMembers = (count) => {
        if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
        return count.toString();
    };

    return (
        <Card className="animate-[fadeIn_0.25s_ease-out] shadow-none">
            <CardHeader className="pb-3 border-b border-ocean-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="text-sm">Suggested Groups</CardTitle>
                        <CardDescription className="text-[10px]">Communities you might like</CardDescription>
                    </div>
                </div>
                <SearchBar value={search} onChange={setSearch} placeholder="Search groups..." />
            </CardHeader>
            
            <CardContent className="py-4 space-y-2">
                {filtered.length > 0 ? filtered.map((group, i) => (
                    <div key={group.id} className="flex items-center justify-between p-3 rounded-[14px] bg-ocean-card/50 border border-ocean-divider-subtle hover:border-ocean-hover hover:bg-ocean-card/80 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3">
                            {group.profile_image ? (
                                <img src={`/storage/${group.profile_image}`} alt={group.name} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                                <div className={`w-10 h-10 rounded-xl ${groupColors[i % groupColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                                    {group.initial}
                                </div>
                            )}
                            <div>
                                <h4 className="text-sm font-bold text-ocean-text tracking-[-0.01em]">{group.name}</h4>
                                <p className="text-[11px] text-ocean-text-dim/60">{formatMembers(group.members)} members</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleJoin(group.id)}
                            disabled={joining === group.id}
                            size="sm"
                            className="rounded-xl px-4"
                        >
                            {joining === group.id ? '...' : 'Join'}
                        </Button>
                    </div>
                )) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <svg className="w-10 h-10 text-ocean-text-dim/30 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                        </svg>
                        <p className="text-xs text-ocean-text-dim">You've joined all available groups!</p>
                    </div>
                ) : (
                    <p className="text-xs text-ocean-text-dim italic py-3">No groups matching &quot;{search}&quot;</p>
                )}
            </CardContent>

            {/* Browse all */}
            <div className="px-4 pb-4">
                <Button variant="secondary" className="w-full rounded-xl" asChild>
                    <a href="/schools">
                        Browse All Groups
                    </a>
                </Button>
            </div>
        </Card>
    );
}

/* ── Chat Thread View (Nested in Messages) ──────────────────────────── */
function ChatThreadView({ chat, onBack, currentUser }) {
    const [messageText, setMessageText] = React.useState('');
    const [messages, setMessages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [attachment, setAttachment] = React.useState(null);
    const messagesEndRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const [mediaDrawerType, setMediaDrawerType] = React.useState(null);
    
    // Fetch live messages
    React.useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/messages/${chat.id}`);
                if (isMounted) {
                    setMessages(res.data.data.reverse());
                    setLoading(false);
                    if (chat.unread) {
                        router.reload({ only: ['social'] });
                        chat.unread = false;
                    }
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
        if (!messageText.trim() && !attachment) return;
        
        const contentToSend = messageText.trim();
        setMessageText('');
        const currentAttachment = attachment;
        setAttachment(null);

        // Optimistic UI update
        const tempId = Date.now();
        setMessages(prev => [...prev, {
            id: tempId,
            user_id: currentUser.id,
            content: contentToSend,
            media_url: currentAttachment ? URL.createObjectURL(currentAttachment) : null,
            created_at: new Date().toISOString()
        }]);

        try {
            const formData = new FormData();
            formData.append('conversation_id', chat.id);
            if (contentToSend) formData.append('content', contentToSend);
            if (currentAttachment) formData.append('file', currentAttachment);

            const res = await axios.post('/api/messages/send', formData, {
                 headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (err) {
            console.error("Failed to send message:", err);
            // Revert on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[400px] flex-1 animate-[slideInRight_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-ocean-divider shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-ocean-surface/50 text-ocean-text-dim hover:text-ocean-text transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => { if (chat.user_id) router.visit(`/users/${chat.user_id}`); }}
                        className="flex items-center gap-3 group"
                    >
                        {chat.avatar ? (
                            <img src={chat.avatar} alt={chat.name} className="w-9 h-9 rounded-full object-cover shrink-0 group-hover:ring-2 group-hover:ring-biolum/50 transition-all" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {chat.initial || chat.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-bold text-ocean-text leading-tight group-hover:text-biolum transition-colors">{chat.name}</h3>
                            <p className="text-[10px] text-biolum font-medium">Active now</p>
                        </div>
                    </button>
                </div>

                {/* Call Actions + Info */}
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" size="icon" 
                        className="rounded-full text-ocean-text-dim hover:text-biolum hover:bg-biolum/10 transition-colors"
                        onClick={() => {
                            const callEvent = new CustomEvent('daloy:start-call', { detail: { conversation_id: chat.id, type: 'audio', channel_name: `call_${chat.id}_${Date.now()}` } });
                            window.dispatchEvent(callEvent);
                        }}
                        title="Audio Call"
                    >
                        <Phone className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" size="icon" 
                        className="rounded-full text-ocean-text-dim hover:text-biolum hover:bg-biolum/10 transition-colors"
                        onClick={() => {
                            const callEvent = new CustomEvent('daloy:start-call', { detail: { conversation_id: chat.id, type: 'video', channel_name: `call_${chat.id}_${Date.now()}` } });
                            window.dispatchEvent(callEvent);
                        }}
                        title="Video Call"
                    >
                        <Video className="w-4 h-4" />
                    </Button>
                    {/* Info Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-ocean-card border border-ocean-border/80 text-ocean-text">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest opacity-50">Conversation details</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-ocean-border/50" />
                            <DropdownMenuItem onClick={() => setMediaDrawerType('images')} className="cursor-pointer text-sm font-semibold hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                Images
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMediaDrawerType('videos')} className="cursor-pointer text-sm font-semibold hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                Videos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMediaDrawerType('documents')} className="cursor-pointer text-sm font-semibold hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                Documents
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                <div className={`max-w-[85%] relative text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-ocean-divider-subtle ${isSelf ? 'bg-biolum text-white rounded-[18px] rounded-tr-sm self-end' : 'bg-ocean-card/60 text-ocean-text rounded-[18px] rounded-tl-sm self-start'} ${(!msg.content && msg.media_url) ? 'p-1 pb-1.5' : 'px-4 py-2.5'}`}>
                                    {msg.story_id && (
                                        <div className={`w-full overflow-hidden pb-1 border-b mb-2 flex items-center gap-2 ${isSelf ? 'border-white/20' : 'border-ocean-border'}`}>
                                            {msg.story ? (
                                                <>
                                                    <div className="w-8 h-12 rounded overflow-hidden shrink-0 bg-black/20">
                                                        {msg.story.type === 'video' ? (
                                                            <video src={msg.story.media_url} className="w-full h-full object-cover pointer-events-none" />
                                                        ) : (
                                                            <img src={msg.story.media_url} alt="Story" className="w-full h-full object-cover pointer-events-none" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isSelf ? 'text-white/70' : 'text-ocean-text-dim'}`}>Replied to {msg.story.user?.name?.split(' ')[0]}'s story</span>
                                                        {msg.story.content && <span className={`text-[10px] font-semibold truncate ${isSelf ? 'text-white/90' : 'text-ocean-text'}`}>{msg.story.content}</span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 py-1 flex items-center gap-1.5">
                                                    <svg className={`w-3.5 h-3.5 ${isSelf ? 'text-white/40' : 'text-ocean-text-dim/40'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    <span className={`text-[10px] italic font-medium tracking-wide ${isSelf ? 'text-white/60' : 'text-ocean-text-dim'}`}>Story is no longer available</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {msg.media_url && (
                                        <div className={`w-full overflow-hidden bg-black/10 ${msg.content ? 'mb-2 rounded-xl border border-black/10' : 'rounded-[14px] ' + (isSelf ? 'rounded-tr-sm' : 'rounded-tl-sm')}`}>
                                            {msg.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.media_url.startsWith('blob:') ? (
                                                <img src={msg.media_url} className="w-full h-auto max-h-48 object-cover" alt="attachment" />
                                            ) : msg.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                                                <video src={msg.media_url} controls className="w-full max-h-48 object-contain bg-black" />
                                            ) : (
                                                <a href={msg.media_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 hover:bg-black/5 transition-colors ${isSelf ? 'text-white' : 'text-ocean-text'}`}>
                                                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelf ? 'bg-white/20' : 'bg-biolum/20 text-biolum'}`}><FileText size={16} /></div>
                                                    <span className="truncate text-xs font-semibold underline decoration-transparent hover:decoration-current transition-all">Attachment</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {msg.content && (
                                        <div className="text-sm break-words whitespace-pre-wrap">
                                            {(() => {
                                                let text = msg.content;
                                                let callType = null;
                                                if (text.includes('Started a video call') || text === 'SYSTEM_CALL_VIDEO') {
                                                    text = "Started a Video call";
                                                    callType = 'video';
                                                } else if (text.includes('Started a audio call') || text.includes('Started a phone call') || text === 'SYSTEM_CALL_AUDIO') {
                                                    text = "Started an Audio call";
                                                    callType = 'audio';
                                                }
                                                if (callType) {
                                                    return (
                                                        <div className="flex items-center gap-2 opacity-90">
                                                            {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                                            <span className="italic font-medium">{text}</span>
                                                        </div>
                                                    );
                                                }
                                                return <p>{text}</p>;
                                            })()}
                                        </div>
                                    )}
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
            <form onSubmit={handleSend} className="pt-2 pb-2 border-t border-ocean-divider flex flex-col shrink-0">
                {attachment && (
                    <div className="mx-2 mb-2 p-2 bg-ocean-surface border border-ocean-border/50 rounded-xl flex items-center justify-between gap-3 animate-[slideUp_0.2s_ease-out]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {attachment.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(attachment)} className="w-8 h-8 object-cover rounded-md border border-ocean-border shrink-0" />
                            ) : attachment.type.startsWith('video/') ? (
                                 <video src={URL.createObjectURL(attachment)} className="w-8 h-8 object-cover rounded-md border border-ocean-border shrink-0" />
                            ) : (
                                <div className="w-8 h-8 bg-biolum/10 text-biolum rounded-md flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs text-ocean-text truncate font-semibold">{attachment.name}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setAttachment(null)} className="p-1 rounded-full text-ocean-text-dim hover:bg-ocean-card hover:text-red-400 transition-colors shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-1.5 bg-ocean-surface/40 border border-ocean-border rounded-full px-1.5 py-1.5 focus-within:border-biolum/50 focus-within:ring-1 focus-within:ring-biolum/30 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-black/10 transition-colors shrink-0">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-ocean-card border border-ocean-border/80">
                            <DropdownMenuLabel className="text-ocean-text text-[10px] uppercase font-bold tracking-widest opacity-50">Attach File</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-ocean-border/50" />
                            <DropdownMenuItem onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                Photo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                Video
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip'; fileInputRef.current.click(); }} className="cursor-pointer text-sm font-semibold text-ocean-text hover:bg-ocean-surface focus:bg-ocean-surface focus:text-biolum flex items-center gap-3">
                                <svg className="w-4 h-4 text-ocean-text-dim shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input 
                        type="text" 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 min-w-0 bg-transparent border-none px-2 py-1 text-[13px] text-ocean-text focus:outline-none focus:ring-0 placeholder:text-ocean-text-dim"
                    />
                    <button 
                        type="submit"
                        disabled={!messageText.trim() && !attachment}
                        className="w-8 h-8 rounded-full bg-biolum text-white hover:bg-biolum-bright disabled:opacity-50 disabled:hover:bg-biolum transition-colors flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(25,25,112,0.2)]"
                    >
                        <svg className="w-3.5 h-3.5 ml-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    </button>
                </div>
            </form>

            <Dialog open={!!mediaDrawerType} onOpenChange={(open) => !open && setMediaDrawerType(null)}>
                <DialogContent className="max-w-2xl bg-ocean-card border-ocean-border text-ocean-text">
                    <DialogHeader className="border-b border-ocean-border pb-4">
                        <DialogTitle className="capitalize font-bold flex items-center gap-2">{mediaDrawerType}</DialogTitle>
                        <DialogDescription className="text-xs text-ocean-text-dim">Browse shared {mediaDrawerType} in this conversation.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[50vh] pr-4 mt-2">
                        {(() => {
                            const sharedMedia = messages.filter(m => m.media_url);
                            const images = sharedMedia.filter(m => m.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || m.media_url.startsWith('blob:'));
                            const videos = sharedMedia.filter(m => m.media_url.match(/\.(mp4|webm|mov)$/i));
                            const docs = sharedMedia.filter(m => !m.media_url.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|mov)$/i) && !m.media_url.startsWith('blob:'));
                            
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
                                            <a href={m.media_url} target="_blank" key={m.id} className="aspect-square rounded-xl overflow-hidden bg-black/20 hover:ring-2 hover:ring-biolum transition-all shadow-md group">
                                                <img src={m.media_url} className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal opacity-80 group-hover:opacity-100 transition-all" />
                                            </a>
                                        ))}
                                    </div>
                                );
                            } else if (mediaDrawerType === 'videos') {
                                return (
                                    <div className="flex flex-col gap-4">
                                        {targetMedia.map(m => (
                                            <video key={m.id} src={m.media_url} controls className="w-full rounded-xl bg-black/20 border border-ocean-border shadow-md" />
                                        ))}
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="flex flex-col gap-2">
                                        {targetMedia.map(m => (
                                            <a href={m.media_url} target="_blank" key={m.id} className="flex items-center gap-4 p-4 bg-ocean-surface border border-ocean-border rounded-xl hover:border-biolum/50 shadow-sm transition-all group">
                                                <div className="p-3 bg-biolum/10 text-biolum rounded-lg group-hover:bg-biolum group-hover:text-white transition-colors shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="min-w-0">
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
                            <div className={`text-[11px] mt-0.5 truncate ${msg.unread ? 'text-ocean-text font-medium' : 'text-ocean-text-dim'}`}>
                                {(() => {
                                    let text = msg.message;
                                    let callType = null;
                                    if (text.includes('Started a video call') || text === 'SYSTEM_CALL_VIDEO') {
                                        text = "Video call";
                                        callType = 'video';
                                    } else if (text.includes('Started a audio call') || text.includes('Started a phone call') || text === 'SYSTEM_CALL_AUDIO') {
                                        text = "Audio call";
                                        callType = 'audio';
                                    }
                                    if (callType) {
                                        return (
                                            <div className="flex items-center gap-1.5 opacity-80">
                                                {callType === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                                                <span>{text}</span>
                                            </div>
                                        );
                                    }
                                    return <p className="truncate">{text}</p>;
                                })()}
                            </div>
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

    React.useEffect(() => {
        if (social?.unread_notifications > 0) {
            axios.post('/api/ripples/mark-all-read').then(() => {
                router.reload({ only: ['social'] }); // Reload social props to clear badge
            }).catch(console.error);
        }
    }, [social?.unread_notifications]);

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

    const navigateToTarget = (notif) => {
        if (['reaction', 'comment', 'share', 'mention'].includes(notif.type) && notif.data && notif.data.post_id) {
            router.visit(`/posts/${notif.data.post_id}`);
        } else if (notif.user_id) {
            router.visit(`/users/${notif.user_id}`);
        }
    };

    const typeColors = {
        friend: 'bg-blue-500',
        follow: 'bg-emerald-500',
        like: 'bg-rose-500',
        story_like: 'bg-rose-500',
        story_reply: 'bg-emerald-600',
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
                        onClick={() => navigateToTarget(notif)}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group/notif ${notif.is_unread ? 'bg-biolum/10 border border-biolum/20' : 'hover:bg-ocean-surface/30'}`}
                    >
                        <div className="relative shrink-0 flex items-center gap-2">
                            <div className="relative">
                                {notif.avatar ? (
                                    <img src={notif.avatar} alt={notif.user} className="w-8 h-8 rounded-full object-cover mt-0.5" />
                                ) : (
                                    <div className={`mt-0.5 w-8 h-8 flex justify-center items-center rounded-full ${typeColors[notif.type] || 'bg-biolum'}`} />
                                )}
                                {notif.is_unread && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-biolum border-2 border-ocean-card rounded-full" />
                                )}
                            </div>
                            {(notif.type === 'story_like' || notif.type === 'story_reply') && notif.data?.story_image && (
                                <div className="w-8 h-10 rounded overflow-hidden shadow-sm shrink-0 bg-black/20">
                                    <img src={notif.data.story_image} alt="Story" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <p className={`text-xs leading-relaxed ${notif.is_unread ? 'text-ocean-text font-medium' : 'text-ocean-text-dim/90'}`}>
                                <span className={`font-bold ${notif.is_unread ? 'text-ocean-text' : 'text-ocean-text'}`}>{notif.user}</span>{' '}
                                {notif.action}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${notif.is_unread ? 'text-biolum font-medium' : 'text-ocean-text-dim'}`}>{notif.time}</p>
                            
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

/* ── Announcements Panel ────────────────────────────────────────────── */
function AnnouncementsPanel() {
    const { announcements } = usePage().props;
    const items = announcements || [];

    const typeStyles = {
        info:     { border: 'border-biolum/30',     icon: 'text-biolum',      bg: 'bg-biolum/[0.06]',      badge: 'bg-biolum/15 text-biolum' },
        success:  { border: 'border-emerald-500/30', icon: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]',  badge: 'bg-emerald-500/15 text-emerald-400' },
        warning:  { border: 'border-amber-500/30',   icon: 'text-amber-400',   bg: 'bg-amber-500/[0.06]',    badge: 'bg-amber-500/15 text-amber-400' },
        critical: { border: 'border-rose-500/30',    icon: 'text-rose-400',    bg: 'bg-rose-500/[0.06]',     badge: 'bg-rose-500/15 text-rose-400' },
    };

    const typeLabels = {
        info: 'Information',
        success: 'Good News',
        warning: 'Heads Up',
        critical: 'Critical',
    };

    return (
        <div className="bg-ocean-card rounded-2xl border border-ocean-border p-4 space-y-4 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-ocean-text leading-tight">Announcements</h3>
                    <p className="text-[10px] text-ocean-text-dim">Official updates from Daloy</p>
                </div>
            </div>

            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((ann) => {
                        const s = typeStyles[ann.type] || typeStyles.info;
                        return (
                            <div key={ann.id} className={`p-3.5 rounded-[14px] border ${s.border} ${s.bg} transition-all hover:shadow-sm`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${s.badge}`}>
                                        {typeLabels[ann.type] || 'Info'}
                                    </span>
                                    {ann.priority === 'high' && (
                                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Urgent</span>
                                    )}
                                </div>
                                <h4 className="text-[13px] font-bold text-ocean-text leading-snug">{ann.title}</h4>
                                <p className="text-[11px] text-ocean-text-dim/70 mt-1 leading-relaxed line-clamp-3">{ann.message}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-10 h-10 text-ocean-text-dim/30 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                    </svg>
                    <p className="text-xs text-ocean-text-dim">All clear — no active announcements.</p>
                </div>
            )}
        </div>
    );
}


import { useCurrents } from '@/Contexts/CurrentsContext';

import MusicPlayer from '@/Components/Features/Schools/MusicPlayer';
import { Radio, ArrowLeft, Headphones, Play } from 'lucide-react';

function CurrentsPanel() {
    const { reef } = usePage().props;
    const currents = useCurrents();
    const myGroups = reef?.my_groups || [];

    // Multi-view state: 'list' | 'detail'
    const [view, setView] = useState('list');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [joining, setJoining] = useState(false);

    // Create session form state (admin only)
    const [sessionName, setSessionName] = useState('');
    const [trackUrl, setTrackUrl] = useState('');
    const [creating, setCreating] = useState(false);

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setView('detail');
    };

    const handleBack = () => {
        setView('list');
        setSelectedGroup(null);
        setSessionName('');
        setTrackUrl('');
    };

    const handleJoinSession = async () => {
        if (!selectedGroup) return;
        try {
            setJoining(true);
            await currents.joinSession(selectedGroup, []);
        } catch (err) {
            console.error(err);
        } finally {
            setJoining(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!selectedGroup || !trackUrl.trim()) return;
        try {
            setCreating(true);
            await currents.startSession(selectedGroup, trackUrl, sessionName || 'Live Broadcast', []);
            setSessionName('');
            setTrackUrl('');
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    // ── VIEW: Groups List ─────────────────────────────────────────────
    if (view === 'list') {
        return (
            <Card className="animate-[fadeIn_0.25s_ease-out] shadow-none flex-1 min-h-0 flex flex-col overflow-hidden relative">
                <CardHeader className="pb-3 border-b border-ocean-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center">
                            <Radio className="w-4 h-4 text-biolum" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Live Currents</CardTitle>
                            <CardDescription className="text-[10px]">Select a group to tune in</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                    {myGroups.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-ocean-surface flex items-center justify-center mb-3">
                                <Headphones className="w-7 h-7 text-ocean-text-dim" />
                            </div>
                            <p className="text-sm font-semibold text-ocean-text mb-1">No Groups Yet</p>
                            <p className="text-xs text-ocean-text-dim">Join a group to see their live streams here.</p>
                        </div>
                    ) : (
                        myGroups.map(group => (
                            <div key={group.id} onClick={() => handleSelectGroup(group)}
                                className="flex items-center gap-3 p-3 rounded-[14px] bg-ocean-card/50 border border-ocean-divider-subtle hover:border-biolum/30 hover:bg-ocean-card/80 transition-all cursor-pointer shadow-sm group">
                                {group.profile_image ? (
                                    <img src={`/storage/${group.profile_image}`} alt={group.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                ) : (
                                    <div className="w-11 h-11 rounded-xl bg-ocean-deep border border-ocean-divider flex items-center justify-center font-bold text-ocean-text-dim text-base shrink-0">
                                        {group.initial}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors block truncate">{group.name}</span>
                                    {group.has_active_current ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full bg-biolum animate-pulse" />
                                            <span className="text-xs font-bold text-biolum">{group.active_session?.session_name}</span>
                                            <span className="text-[10px] text-ocean-text-dim">· {group.active_session?.listener_count || 0} listening</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-ocean-text-dim mt-0.5 block">
                                            {group.is_admin ? 'You can start a broadcast' : 'No active broadcast'}
                                        </span>
                                    )}
                                </div>
                                <svg className="w-4 h-4 text-ocean-text-dim group-hover:text-biolum transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        ))
                    )}
                </CardContent>

                {/* Docked player bar if in session */}
                {currents?.isInSession && <MusicPlayer />}
            </Card>
        );
    }

    // ── VIEW: Group Detail ────────────────────────────────────────────
    const group = selectedGroup;
    const isConnectedHere = currents.isInSession && currents.currentSchool?.id === group?.id;

    return (
        <Card className="animate-[fadeIn_0.2s_ease-out] shadow-none flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {/* Header with back button */}
            <CardHeader className="pb-3 border-b border-ocean-divider shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-ocean-surface transition-colors text-ocean-text-dim hover:text-ocean-text">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    {group?.profile_image ? (
                        <img src={`/storage/${group.profile_image}`} className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                        <div className="w-7 h-7 rounded-lg bg-ocean-deep border border-ocean-divider flex items-center justify-center text-xs font-bold text-ocean-text-dim">{group?.initial}</div>
                    )}
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">{group?.name}</CardTitle>
                        <CardDescription className="text-[10px]">
                            {group?.is_admin ? 'Admin' : 'Member'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4">
                {isConnectedHere ? (
                    /* ── Connected State ── */
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-biolum/10 border border-biolum/30 flex items-center justify-center mb-4 relative">
                            <span className="absolute inset-0 rounded-2xl bg-biolum/10 animate-ping" />
                            <Radio className="w-7 h-7 text-biolum relative z-10" />
                        </div>
                        <h3 className="text-lg font-bold text-ocean-text mb-1">You're Connected</h3>
                        <p className="text-sm text-ocean-text-dim mb-1">Playing: {currents.session?.current_track_title || 'Untitled'}</p>
                        <p className="text-xs text-ocean-text-dim/60">Use the player below to control audio, chat, and view participants.</p>
                    </div>
                ) : group?.has_active_current ? (
                    /* ── Active Session — Join ── */
                    <div className="space-y-4">
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-biolum/10 border border-biolum/20 flex items-center justify-center mb-4 relative">
                                <div className="absolute inset-0 rounded-2xl bg-biolum/10 animate-pulse" />
                                <Radio className="w-7 h-7 text-biolum relative z-10" />
                            </div>
                            <h3 className="text-lg font-bold text-ocean-text mb-1">{group.active_session?.session_name}</h3>
                            <p className="text-sm text-ocean-text-dim mb-1">Now Playing: {group.active_session?.track_title || 'Music'}</p>
                        </div>

                        {/* Host info */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-ocean-surface/40 border border-ocean-border/30">
                            <img src={group.active_session?.host_avatar || '/images/default-avatar.png'} className="w-9 h-9 rounded-full object-cover border border-ocean-border" />
                            <div>
                                <p className="text-xs font-bold text-ocean-text">Hosted by {group.active_session?.host_name}</p>
                                <p className="text-[11px] text-ocean-text-dim">{group.active_session?.listener_count || 0} listeners tuned in</p>
                            </div>
                        </div>

                        {/* Join button */}
                        <button
                            onClick={handleJoinSession}
                            disabled={joining}
                            className="w-full py-3 bg-biolum text-biolum-foreground font-bold text-sm rounded-xl hover:bg-biolum-bright transition-all shadow-[0_4px_16px_rgba(0,255,240,0.25)] hover:shadow-[0_6px_24px_rgba(0,255,240,0.35)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Headphones className="w-4 h-4" />
                            {joining ? 'Connecting...' : 'Join This Current'}
                        </button>
                    </div>
                ) : group?.is_admin ? (
                    /* ── No Session — Admin Can Create ── */
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-ocean-surface flex items-center justify-center mb-3">
                                <Radio className="w-7 h-7 text-ocean-text-dim" />
                            </div>
                            <h3 className="text-base font-bold text-ocean-text mb-1">No Active Broadcast</h3>
                            <p className="text-xs text-ocean-text-dim">Start a new session and invite members to listen.</p>
                        </div>

                        <form onSubmit={handleCreateSession} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-ocean-text block mb-1.5">Session Name</label>
                                <input
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-3.5 py-2.5 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder:text-ocean-text-dim"
                                    placeholder="e.g. Chill Vibes Friday"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-ocean-text block mb-1.5">Music Link</label>
                                <input
                                    type="url"
                                    value={trackUrl}
                                    onChange={(e) => setTrackUrl(e.target.value)}
                                    className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-3.5 py-2.5 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder:text-ocean-text-dim"
                                    placeholder="YouTube, Spotify, or MP3 URL..."
                                    required
                                />
                                <p className="text-[10px] text-ocean-text-dim/60 mt-1 pl-1">Supports YouTube, Spotify, and direct MP3 links</p>
                            </div>
                            <button
                                type="submit"
                                disabled={creating || !trackUrl.trim()}
                                className="w-full py-3 bg-biolum text-biolum-foreground font-bold text-sm rounded-xl hover:bg-biolum-bright transition-all shadow-[0_4px_16px_rgba(0,255,240,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Play className="w-4 h-4" />
                                {creating ? 'Starting...' : 'Start Broadcasting'}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* ── No Session — Member View ── */
                    <div className="text-center py-12">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-ocean-surface flex items-center justify-center mb-3">
                            <Radio className="w-7 h-7 text-ocean-text-dim" />
                        </div>
                        <h3 className="text-base font-bold text-ocean-text mb-1">No Active Broadcast</h3>
                        <p className="text-xs text-ocean-text-dim">Waiting for an admin to start a session.</p>
                        <p className="text-[10px] text-ocean-text-dim/60 mt-2">You'll be notified when a broadcast goes live.</p>
                    </div>
                )}
            </CardContent>

            {/* Docked player bar if in session */}
            {currents?.isInSession && <MusicPlayer />}
        </Card>
    );
}

/* ── River Flow Notes Panel ──────────────────────────────────────────── */
function RiverFlowPanel() {
    const [notes, setNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');

    // Local notes stored in localStorage
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('daloy_river_flow_notes');
            if (saved) setNotes(JSON.parse(saved));
        } catch {}
    }, []);

    const saveNotes = (updated) => {
        setNotes(updated);
        localStorage.setItem('daloy_river_flow_notes', JSON.stringify(updated));
    };

    const createNote = () => {
        if (!newTitle.trim() && !newContent.trim()) return;
        const note = {
            id: Date.now(),
            title: newTitle.trim() || 'Untitled Note',
            content: newContent.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        saveNotes([note, ...notes]);
        setNewTitle('');
        setNewContent('');
        setShowCreate(false);
    };

    const deleteNote = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    const saveEdit = () => {
        if (!editingNote) return;
        saveNotes(notes.map(n => n.id === editingNote.id
            ? { ...n, title: editingNote.title, content: editingNote.content, updated_at: new Date().toISOString() }
            : n
        ));
        setEditingNote(null);
    };

    const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    const getTimeAgo = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Card className="animate-[fadeIn_0.25s_ease-out] shadow-none h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-ocean-divider shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">River Flow</CardTitle>
                            <CardDescription className="text-[10px]">Personal notes & thoughts</CardDescription>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="w-8 h-8 rounded-lg bg-biolum/15 flex items-center justify-center text-biolum hover:bg-biolum/25 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={showCreate ? "M6 18L18 6M6 6l12 12" : "M12 4.5v15m7.5-7.5h-15"} />
                        </svg>
                    </button>
                </div>
                <SearchBar value={search} onChange={setSearch} placeholder="Search notes..." />
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
                {/* Create Note Form */}
                {showCreate && (
                    <div className="p-3 bg-ocean-surface/60 border border-ocean-border rounded-xl space-y-2 mb-3 animate-[fadeIn_0.2s_ease-out]">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Note title..."
                            className="w-full bg-transparent border-none text-sm font-bold text-ocean-text placeholder:text-ocean-text-dim/50 focus:outline-none"
                            autoFocus
                        />
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Write your thoughts..."
                            className="w-full bg-transparent border-none text-xs text-ocean-text-muted placeholder:text-ocean-text-dim/40 focus:outline-none resize-none min-h-[60px]"
                            rows={3}
                        />
                        <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setShowCreate(false); setNewTitle(''); setNewContent(''); }} className="px-3 py-1.5 text-[10px] font-semibold text-ocean-text-dim bg-ocean-surface border border-ocean-border rounded-lg hover:text-ocean-text transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={createNote} className="px-3 py-1.5 text-[10px] font-bold text-black bg-biolum rounded-lg hover:bg-biolum-bright transition-colors cursor-pointer">
                                Save Note
                            </button>
                        </div>
                    </div>
                )}

                {/* Editing a Note */}
                {editingNote && (
                    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingNote(null)}>
                        <div className="w-[380px] max-w-[90vw] bg-ocean-card border border-ocean-border rounded-2xl p-5 space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                value={editingNote.title}
                                onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                                className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-3 py-2 text-sm font-bold text-ocean-text focus:outline-none focus:border-biolum/40"
                                autoFocus
                            />
                            <textarea
                                value={editingNote.content}
                                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                                className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-3 py-2 text-sm text-ocean-text focus:outline-none focus:border-biolum/40 resize-none min-h-[140px]"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingNote(null)} className="px-3 py-2 text-xs font-semibold text-ocean-text-dim hover:text-ocean-text transition-colors cursor-pointer">Cancel</button>
                                <button onClick={saveEdit} className="px-4 py-2 text-xs font-bold text-black bg-biolum rounded-lg hover:bg-biolum-bright transition-colors cursor-pointer">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes List */}
                {filtered.length > 0 ? (
                    filtered.map(note => (
                        <div
                            key={note.id}
                            className="group p-3 bg-ocean-surface/40 border border-ocean-border/60 rounded-xl hover:border-biolum/20 hover:bg-ocean-surface/60 transition-all cursor-pointer relative"
                            onClick={() => setEditingNote({...note})}
                        >
                            <div className="absolute top-0 left-0 w-0.5 h-full bg-cyan-400/40 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-sm font-bold text-ocean-text mb-0.5 truncate pr-8">{note.title}</h4>
                            <p className="text-xs text-ocean-text-dim line-clamp-2 leading-relaxed">{note.content || 'Empty note...'}</p>
                            <p className="text-[9px] text-ocean-text-dim/50 mt-1.5 font-semibold uppercase tracking-wider">{getTimeAgo(note.updated_at)}</p>
                            {/* Delete button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-rose-500/0 hover:bg-rose-500/15 flex items-center justify-center text-ocean-text-dim/30 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-ocean-surface flex items-center justify-center mb-3">
                            <FileText className="w-6 h-6 text-ocean-text-dim" />
                        </div>
                        <h3 className="text-sm font-bold text-ocean-text mb-1">{search ? 'No matching notes' : 'No notes yet'}</h3>
                        <p className="text-xs text-ocean-text-dim">{search ? 'Try a different search term.' : 'Tap + to create your first note.'}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ── Main ReefPanel ──────────────────────────────────────────────────── */
export default function ReefPanel({ activePanel }) {
    if (!activePanel) return null;

    const isCurrents = activePanel === 'currents';

    return (
        <div className={isCurrents ? 'h-[calc(100vh-5.5rem)] flex flex-col' : 'h-full'}>
            {/* Panel content */}
            <div key={activePanel} className={isCurrents ? 'flex-1 flex flex-col min-h-0' : 'h-full'}>
                {activePanel === 'trending' && <TrendingPanel />}
                {activePanel === 'groups' && <GroupsPanel />}
                {activePanel === 'messages' && <MessagesPanel />}
                {activePanel === 'announcements' && <AnnouncementsPanel />}
                {activePanel === 'language' && <LanguagePanel />}
                {activePanel === 'currents' && <CurrentsPanel />}
                {activePanel === 'notes' && <RiverFlowPanel />}
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


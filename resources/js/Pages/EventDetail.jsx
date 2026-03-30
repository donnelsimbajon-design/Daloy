import React, { useState, useRef } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/PostCard';
import axios from 'axios';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const statusStyle = {
    live: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    ended: 'bg-zinc-200/60 text-zinc-500 border-zinc-300/40',
};

const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export default function EventDetail() {
    const { event: initialEvent, goingAttendees, interestedAttendees, posts: initialPosts, isMember, auth } = usePage().props;
    const [event, setEvent] = useState(initialEvent);
    const [posts] = useState(initialPosts?.data || []);

    // Post composer
    const [showPostForm, setShowPostForm] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [posting, setPosting] = useState(false);
    const postFileRef = useRef(null);

    // RSVP handler
    const handleRsvp = async (status) => {
        try {
            const res = await axios.post(`/events/${event.id}/rsvp`, { status });
            setEvent(prev => ({
                ...prev,
                user_rsvp: res.data.status,
                going_count: res.data.going_count,
                interested_count: res.data.interested_count,
            }));
        } catch (err) { console.error(err); }
    };

    // Media helpers
    const handlePostFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const remaining = 4 - mediaFiles.length;
        const newFiles = files.slice(0, remaining);
        if (!newFiles.length) return;
        setMediaFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews(prev => [...prev, {
                    url: ev.target.result,
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                }]);
            };
            reader.readAsDataURL(file);
        });
        if (postFileRef.current) postFileRef.current.value = '';
    };

    const removeMedia = (i) => {
        setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
        setMediaPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleCreatePost = (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && mediaFiles.length === 0) return;
        setPosting(true);
        const fd = new FormData();
        fd.append('content', newPostContent || '');
        mediaFiles.forEach((file, i) => fd.append(`media[${i}]`, file));
        router.post(`/events/${event.id}/posts`, fd, {
            forceFormData: true,
            onSuccess: () => {
                setNewPostContent('');
                setMediaFiles([]);
                setMediaPreviews([]);
                setShowPostForm(false);
            },
            onFinish: () => setPosting(false),
        });
    };

    const timeUntil = () => {
        const now = new Date();
        const start = new Date(event.starts_at);
        const diff = start - now;
        if (diff <= 0) return null;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <MainLayout>
            <Head title={event.title} />

            {/* ═══════ COVER BANNER ═══════ */}
            <div className="relative -mt-4 w-full">
                <div className="h-48 sm:h-56 md:h-72 overflow-hidden relative">
                    {event.cover_image ? (
                        <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-biolum/10 via-ocean-surface to-ocean-deep relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-20 h-20 text-ocean-border" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/40 to-transparent" />

                    {/* Status badge */}
                    <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${statusStyle[event.status] || statusStyle.upcoming}`}>
                        {event.status === 'live' && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                        {event.status}
                    </span>

                    {/* Countdown */}
                    {event.status === 'upcoming' && timeUntil() && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold">
                            Starts in {timeUntil()}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ EVENT INFO ═══════ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
                <div className="bg-ocean-card border border-ocean-border rounded-[24px] p-6 sm:p-8 shadow-lg">
                    {/* Group breadcrumb */}
                    {event.school && (
                        <Link href={`/schools/${event.school.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-biolum hover:underline mb-3">
                            {event.school.profile_image && <img src={event.school.profile_image} className="w-5 h-5 rounded-md object-cover" />}
                            {event.school.name}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            <span className="text-ocean-text-dim">Event</span>
                        </Link>
                    )}

                    <h1 className="text-2xl sm:text-3xl font-black text-ocean-text tracking-tight leading-tight">{event.title}</h1>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                        <span className="flex items-center gap-2 text-sm text-ocean-text-dim font-semibold">
                            <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                            {formatDate(event.starts_at)}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-ocean-text-dim font-semibold">
                            <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatTime(event.starts_at)}{event.ends_at ? ` — ${formatTime(event.ends_at)}` : ''}
                        </span>
                        {event.location && (
                            <span className="flex items-center gap-2 text-sm text-ocean-text-dim font-semibold">
                                <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                {event.location}
                            </span>
                        )}
                    </div>

                    {/* Organizer */}
                    {event.creator && (
                        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-ocean-border">
                            <Link href={`/users/${event.creator.id}`} className="w-10 h-10 rounded-full bg-biolum/10 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center text-sm font-bold">
                                {event.creator.profile_picture
                                    ? <img src={event.creator.profile_picture} className="w-full h-full object-cover" />
                                    : <span className="text-biolum">{event.creator.name?.charAt(0)}</span>}
                            </Link>
                            <div>
                                <p className="text-[10px] font-black text-ocean-text-dim uppercase tracking-widest">Organized by</p>
                                <Link href={`/users/${event.creator.id}`} className="text-sm font-bold text-ocean-text hover:text-biolum transition-colors">{event.creator.name}</Link>
                            </div>
                        </div>
                    )}

                    {/* RSVP Actions */}
                    {isMember && event.status !== 'ended' && (
                        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-ocean-border">
                            <button
                                onClick={() => handleRsvp('going')}
                                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                    event.user_rsvp === 'going'
                                        ? 'bg-biolum text-biolum-foreground border-biolum'
                                        : 'bg-ocean-surface text-ocean-text border-ocean-border hover:border-biolum/40'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                Going {event.going_count ? `(${event.going_count})` : ''}
                            </button>
                            <button
                                onClick={() => handleRsvp('interested')}
                                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                    event.user_rsvp === 'interested'
                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                        : 'bg-ocean-surface text-ocean-text border-ocean-border hover:border-amber-500/40'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                Interested {event.interested_count ? `(${event.interested_count})` : ''}
                            </button>
                            {event.meeting_link && event.status === 'live' && (
                                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all ml-auto">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.086-7.074a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" /></svg>
                                    Join Meeting
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ CONTENT GRID ═══════ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 self-start order-2 lg:order-1">

                        {/* Description */}
                        {event.description && (
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                <h3 className="text-sm font-black text-ocean-text tracking-tight mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                    About
                                </h3>
                                <p className="text-sm text-ocean-text-dim leading-relaxed whitespace-pre-wrap">{event.description}</p>
                            </div>
                        )}

                        {/* Going */}
                        <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                            <h3 className="text-sm font-black text-ocean-text tracking-tight mb-3">Going ({event.going_count || 0})</h3>
                            {goingAttendees?.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {goingAttendees.map(u => (
                                        <Link key={u.id} href={`/users/${u.id}`} className="group text-center">
                                            <div className="aspect-square rounded-xl bg-ocean-surface overflow-hidden border border-ocean-border group-hover:border-biolum/40 transition-all">
                                                {u.profile_picture
                                                    ? <img src={u.profile_picture} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-biolum/10 text-biolum font-bold text-xs">{u.name?.charAt(0)}</div>}
                                            </div>
                                            <span className="block text-[9px] font-bold text-ocean-text truncate mt-1 group-hover:text-biolum transition-colors">{u.name?.split(' ')[0]}</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-ocean-text-dim">No attendees yet. Be the first!</p>
                            )}
                        </div>

                        {/* Interested */}
                        {interestedAttendees?.length > 0 && (
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                <h3 className="text-sm font-black text-ocean-text tracking-tight mb-3">Interested ({event.interested_count || 0})</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {interestedAttendees.map(u => (
                                        <Link key={u.id} href={`/users/${u.id}`} className="group text-center">
                                            <div className="aspect-square rounded-xl bg-ocean-surface overflow-hidden border border-ocean-border group-hover:border-amber-500/40 transition-all">
                                                {u.profile_picture
                                                    ? <img src={u.profile_picture} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-600 font-bold text-xs">{u.name?.charAt(0)}</div>}
                                            </div>
                                            <span className="block text-[9px] font-bold text-ocean-text truncate mt-1 group-hover:text-amber-600 transition-colors">{u.name?.split(' ')[0]}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Meeting link card */}
                        {event.meeting_link && (
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] p-5 shadow-sm">
                                <h3 className="text-sm font-black text-ocean-text tracking-tight mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.086-7.074a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" /></svg>
                                    Meeting Link
                                </h3>
                                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-biolum hover:underline break-all">{event.meeting_link}</a>
                            </div>
                        )}
                    </div>

                    {/* ── Discussion Feed ── */}
                    <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">

                        {/* Post Composer */}
                        {isMember && (
                            <div className="bg-ocean-card border border-ocean-border rounded-[20px] shadow-sm overflow-hidden">
                                {!showPostForm ? (
                                    <button
                                        onClick={() => setShowPostForm(true)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-ocean-hover transition-colors text-left"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-biolum/10 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center text-sm font-bold text-biolum shrink-0">
                                            {auth.user?.profile_picture
                                                ? <img src={auth.user.profile_picture} className="w-full h-full object-cover" />
                                                : auth.user?.name?.charAt(0)}
                                        </div>
                                        <span className="text-sm text-ocean-text-dim font-semibold">Share something about this event...</span>
                                    </button>
                                ) : (
                                    <div className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-biolum/10 overflow-hidden ring-1 ring-ocean-border flex items-center justify-center text-sm font-bold">
                                                {auth.user?.profile_picture
                                                    ? <img src={auth.user.profile_picture} className="w-full h-full object-cover" />
                                                    : <span className="text-biolum">{auth.user?.name?.charAt(0)}</span>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-ocean-text">{auth.user?.name}</p>
                                                <p className="text-[10px] text-ocean-text-dim font-semibold">Discussing <span className="text-biolum">{event.title}</span></p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleCreatePost}>
                                            <textarea
                                                value={newPostContent}
                                                onChange={e => setNewPostContent(e.target.value)}
                                                placeholder="Share your thoughts..."
                                                className="w-full bg-ocean-surface border border-ocean-border rounded-2xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 placeholder-ocean-text-dim resize-none min-h-[80px] transition-all"
                                                rows="3" autoFocus
                                            />
                                            {mediaPreviews.length > 0 && (
                                                <div className={`grid gap-1 mt-3 rounded-xl overflow-hidden border border-ocean-border ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                    {mediaPreviews.map((p, i) => (
                                                        <div key={i} className="relative aspect-video bg-ocean-surface group/media">
                                                            {p.type === 'video' ? <video src={p.url} className="w-full h-full object-cover" muted /> : <img src={p.url} className="w-full h-full object-cover" />}
                                                            <button type="button" onClick={() => removeMedia(i)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover/media:opacity-100">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-ocean-border">
                                                <div>
                                                    <input ref={postFileRef} type="file" multiple accept="image/*,video/mp4,video/webm" onChange={handlePostFileSelect} className="hidden" />
                                                    <button type="button" onClick={() => postFileRef.current?.click()} disabled={mediaFiles.length >= 4} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-ocean-text-dim hover:text-biolum hover:bg-biolum/10 transition-all text-xs font-bold disabled:opacity-30">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                                                        Photo/Video
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => { setShowPostForm(false); setNewPostContent(''); setMediaFiles([]); setMediaPreviews([]); }} className="px-4 py-2 rounded-xl border border-ocean-border text-ocean-text text-xs font-semibold hover:bg-ocean-surface transition-colors">Cancel</button>
                                                    <button type="submit" disabled={posting || (!newPostContent.trim() && !mediaFiles.length)} className="px-5 py-2 rounded-xl bg-biolum text-biolum-foreground text-xs font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-40">
                                                        {posting ? <><SpinnerIcon /> Posting...</> : 'Post'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Discussion header */}
                        <h3 className="text-base font-black text-ocean-text tracking-tight flex items-center gap-2">
                            <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                            Discussion ({event.discussion_count || 0})
                        </h3>

                        {/* Posts */}
                        {posts.length > 0 ? (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-ocean-card border border-ocean-border rounded-[20px] text-center">
                                <div className="w-14 h-14 rounded-2xl bg-ocean-surface flex items-center justify-center mb-3">
                                    <svg className="w-7 h-7 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                                </div>
                                <h4 className="text-base font-bold text-ocean-text mb-1">No discussion yet</h4>
                                <p className="text-sm text-ocean-text-dim">{isMember ? 'Start the conversation!' : 'Join the group to participate.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

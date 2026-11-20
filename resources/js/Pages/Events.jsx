import React, { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const formatFullDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const getMonth = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const getDay = (d) => new Date(d).getDate();

export default function Events() {
    const { events: initialEvents = [] } = usePage().props;
    const [events, setEvents] = useState(initialEvents);
    const [filter, setFilter] = useState('upcoming');

    const filtered = events.filter(ev => {
        if (filter === 'all') return true;
        return ev.status === filter;
    });

    const handleRsvp = async (e, eventId, status) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await axios.post(`/events/${eventId}/rsvp`, { status });
            setEvents(prev => prev.map(ev =>
                ev.id === eventId ? { ...ev, user_rsvp: res.data.status, going_count: res.data.going_count, interested_count: res.data.interested_count } : ev
            ));
        } catch (err) { console.error(err); }
    };

    const filters = [
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'live', label: 'Live Now' },
        { key: 'ended', label: 'Past' },
        { key: 'all', label: 'All Tides' },
    ];

    return (
        <MainLayout>
            <Head title="Events" />

            <div className="daloy-page daloy-events max-w-5xl mx-auto px-4 py-10 lg:px-8">
                {/* ── Editorial Header ── */}
                <div className="relative mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-ocean-border">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-biolum/10 backdrop-blur-md border border-biolum/20 rounded-full text-[11px] font-black tracking-widest text-biolum uppercase mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-biolum animate-pulse"></span>
                            Platform Events
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-ocean-text tracking-tight leading-[1.1] animate-subtle-in">
                            The upcoming <span className="text-biolum">tides</span>
                        </h1>
                        <p className="text-ocean-text-dim mt-4 text-base md:text-lg leading-relaxed animate-subtle-in" style={{ animationDelay: '0.1s' }}>
                            Discover live streams, meetups, and exclusive editorial sessions hosted across the network.
                        </p>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="flex bg-ocean-surface p-1.5 rounded-2xl border border-ocean-border w-max mb-10 overflow-x-auto mx-auto md:mx-0 animate-subtle-in" style={{ animationDelay: '0.2s' }}>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                                filter === f.key
                                    ? 'bg-ocean-card text-ocean-text shadow-sm border border-ocean-border/50'
                                    : 'text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-hover'
                            }`}
                        >
                            {f.label}
                            {f.key === 'live' && filter !== 'live' && (
                                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Events List ── */}
                <div className="space-y-6">
                    {filtered.length > 0 ? filtered.map((event, index) => (
                        <div 
                            key={event.id} 
                            className="group relative flex flex-col md:flex-row bg-ocean-card rounded-[24px] overflow-hidden border border-ocean-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-biolum/30 transition-all duration-500 animate-subtle-in hover:-translate-y-1"
                            style={{ animationDelay: `${0.1 * Math.min(index, 6)}s` }}
                        >
                            {/* Date Box */}
                            <div className="md:w-32 shrink-0 bg-ocean-surface/50 border-b md:border-b-0 md:border-r border-ocean-border flex flex-row md:flex-col items-center justify-center py-4 md:py-0 gap-2 md:gap-0 group-hover:bg-biolum/5 transition-colors">
                                <span className="text-xs md:text-sm font-black text-biolum tracking-[0.2em]">{getMonth(event.starts_at)}</span>
                                <span className="text-3xl md:text-5xl font-black text-ocean-text leading-none md:mt-1 tracking-tighter">{getDay(event.starts_at)}</span>
                                {event.status === 'live' && (
                                    <span className="md:mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <Link href={`/events/${event.id}`} className="p-6 md:p-8 flex-1 min-w-0 flex flex-col justify-center relative">
                                {/* Subtle background gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-biolum/0 to-biolum/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="min-w-0 flex-1">
                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-xs font-semibold text-ocean-text-dim mb-3 flex-wrap">
                                            <span className="flex items-center gap-1.5 bg-ocean-surface px-2.5 py-1 rounded-md border border-ocean-border">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {formatTime(event.starts_at)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-black text-ocean-text tracking-tight group-hover:text-biolum transition-colors mb-2 truncate">
                                            {event.title}
                                        </h3>
                                        
                                        {event.school && (
                                            <div className="flex items-center gap-2 text-sm text-ocean-text-dim font-medium mb-5">
                                                Hosted by 
                                                <span className="flex items-center gap-1.5 text-biolum font-bold bg-biolum/5 px-2 py-0.5 rounded border border-biolum/20">
                                                    {event.school.profile_image && <img src={event.school.profile_image} className="w-4 h-4 rounded-sm object-cover" />}
                                                    {event.school.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Attendee Data */}
                                        <div className="flex items-center gap-4 mt-auto">
                                            <div className="flex -space-x-2">
                                                {(event.going_avatars || []).slice(0, 4).map((a, i) => (
                                                    <div key={a.id} className="w-8 h-8 rounded-full bg-ocean-surface border-2 border-ocean-card overflow-hidden shadow-sm" style={{ zIndex: 10 - i }}>
                                                        {a.profile_picture
                                                            ? <img src={a.profile_picture} className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-biolum bg-biolum/10">{a.name?.charAt(0)}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-ocean-text-dim bg-ocean-surface px-2.5 py-1 rounded border border-ocean-border">
                                                <span className="text-ocean-text">{event.going_count || 0}</span> going · <span className="text-ocean-text">{event.interested_count || 0}</span> interested
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Desktop Area (hidden on mobile, shown on md+) */}
                                    {event.status !== 'ended' && (
                                        <div className="hidden md:flex shrink-0">
                                            <button
                                                onClick={(e) => handleRsvp(e, event.id, 'going')}
                                                className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all border shadow-sm hover:-translate-y-0.5 ${
                                                    event.user_rsvp === 'going'
                                                        ? 'bg-ocean-surface text-ocean-text border-ocean-border hover:bg-ocean-hover'
                                                        : 'bg-biolum text-biolum-foreground border-biolum hover:bg-biolum-bright'
                                                }`}
                                            >
                                                {event.user_rsvp === 'going' ? 'Going' : 'RSVP'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            
                            {/* Action Mobile Area (shown only on mobile) */}
                            {event.status !== 'ended' && (
                                <div className="flex md:hidden p-4 pt-0">
                                    <button
                                        onClick={(e) => handleRsvp(e, event.id, 'going')}
                                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all border ${
                                            event.user_rsvp === 'going'
                                                ? 'bg-ocean-surface text-ocean-text border-ocean-border'
                                                : 'bg-biolum text-biolum-foreground border-biolum'
                                        }`}
                                    >
                                        {event.user_rsvp === 'going' ? 'Going' : 'RSVP Now'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-24 bg-ocean-card border border-ocean-border border-dashed rounded-3xl text-center">
                            <div className="w-20 h-20 bg-ocean-surface rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <svg className="w-8 h-8 text-ocean-text-dim opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-ocean-text mb-2 animate-subtle-in">No {filter === 'all' ? '' : filter} events</h3>
                            <p className="text-sm text-ocean-text-dim max-w-sm leading-relaxed animate-subtle-in" style={{ animationDelay: '0.1s' }}>
                                The calendar is quiet right now. Wait for groups to announce their upcoming tides or check back later!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

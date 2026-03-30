import React, { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const formatFull = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const statusColors = {
    live: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    ended: 'bg-zinc-200/60 text-zinc-500 border-zinc-300/40',
};

export default function Events() {
    const { events: initialEvents = [] } = usePage().props;
    const [events, setEvents] = useState(initialEvents);
    const [filter, setFilter] = useState('upcoming');

    const filtered = events.filter(ev => {
        if (filter === 'all') return true;
        return ev.status === filter;
    });

    const handleRsvp = async (eventId, status) => {
        try {
            const res = await axios.post(`/events/${eventId}/rsvp`, { status });
            setEvents(prev => prev.map(ev =>
                ev.id === eventId ? { ...ev, user_rsvp: res.data.status, going_count: res.data.going_count, interested_count: res.data.interested_count } : ev
            ));
        } catch (err) { console.error(err); }
    };

    return (
        <MainLayout>
            <Head title="Events" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black text-ocean-text tracking-tight">Upcoming Tides</h1>
                    <div className="flex items-center gap-1 bg-ocean-surface border border-ocean-border rounded-xl p-1">
                        {[
                            { key: 'upcoming', label: 'Upcoming' },
                            { key: 'live', label: 'Live' },
                            { key: 'ended', label: 'Past' },
                            { key: 'all', label: 'All' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    filter === f.key
                                        ? 'bg-biolum text-biolum-foreground'
                                        : 'text-ocean-text-dim hover:text-ocean-text'
                                }`}
                            >{f.label}</button>
                        ))}
                    </div>
                </div>

                {/* Event List */}
                <div className="space-y-4">
                    {filtered.length > 0 ? filtered.map(event => (
                        <div key={event.id} className="flex bg-ocean-card rounded-[20px] overflow-hidden border border-ocean-border hover:shadow-lg hover:border-biolum/20 transition-all group">
                            {/* Date Box */}
                            <div className="w-24 shrink-0 bg-ocean-surface flex flex-col items-center justify-center border-r border-ocean-border group-hover:bg-biolum/5 transition-colors py-5">
                                <span className="text-[10px] font-black text-biolum uppercase tracking-widest">{new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-3xl font-black text-ocean-text leading-none mt-1">{new Date(event.starts_at).getDate()}</span>
                                {event.status === 'live' && (
                                    <span className="mt-2 flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <Link href={`/events/${event.id}`} className="p-5 flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-ocean-text group-hover:text-biolum transition-colors truncate">{event.title}</h3>
                                        <div className="flex items-center gap-4 text-xs text-ocean-text-dim mt-2 flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {formatTime(event.starts_at)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                                    {event.location}
                                                </span>
                                            )}
                                            {event.school && (
                                                <span className="flex items-center gap-1.5 text-biolum font-semibold">
                                                    {event.school.profile_image && <img src={event.school.profile_image} className="w-4 h-4 rounded-md object-cover" />}
                                                    {event.school.name}
                                                </span>
                                            )}
                                        </div>
                                        {/* Attendee info */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex -space-x-2">
                                                {(event.going_avatars || []).slice(0, 3).map((a, i) => (
                                                    <div key={a.id} className="w-6 h-6 rounded-full bg-ocean-surface border-2 border-ocean-card overflow-hidden" style={{ zIndex: 5 - i }}>
                                                        {a.profile_picture
                                                            ? <img src={a.profile_picture} className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-biolum bg-biolum/10">{a.name?.charAt(0)}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold text-ocean-text-dim">
                                                {event.going_count || 0} going · {event.interested_count || 0} interested
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* RSVP Action */}
                            {event.status !== 'ended' && (
                                <div className="flex flex-col items-center justify-center px-5 gap-2 border-l border-ocean-border">
                                    <button
                                        onClick={() => handleRsvp(event.id, 'going')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                                            event.user_rsvp === 'going'
                                                ? 'bg-biolum text-biolum-foreground border-biolum'
                                                : 'bg-ocean-surface text-ocean-text border-ocean-border hover:bg-biolum hover:text-biolum-foreground hover:border-biolum'
                                        }`}
                                    >{event.user_rsvp === 'going' ? '✓ Going' : 'RSVP'}</button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-ocean-card border border-ocean-border rounded-[20px] text-center">
                            <div className="w-16 h-16 rounded-2xl bg-ocean-surface flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-ocean-text mb-1">No {filter === 'all' ? '' : filter} events</h3>
                            <p className="text-sm text-ocean-text-dim">Join a group and check back later for events!</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

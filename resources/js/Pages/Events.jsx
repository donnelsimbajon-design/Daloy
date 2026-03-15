import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const events = [
    { title: 'Midnight Dive', date: 'Oct 24 • 11:00 PM', location: 'Pacific Hub', attendees: 45 },
    { title: 'Coral Restoration Workshop', date: 'Nov 02 • 9:00 AM', location: 'Great Reef', attendees: 128 },
    { title: 'Oceanic Tech Summit', date: 'Nov 15 • 1:00 PM', location: 'Virtual Stream', attendees: 842 },
];

export default function Events() {
    return (
        <MainLayout>
            <Head title="Events" />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ocean-text">Upcoming Tides</h1>
                    <div className="flex gap-2">
                        <button className="text-sm text-ocean-text-dim hover:text-ocean-text transition-colors">Past</button>
                        <span className="text-ocean-text-dim">|</span>
                        <button className="text-sm text-biolum font-bold">Upcoming</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {events.map((event, i) => (
                        <div key={i} className="flex bg-ocean-card rounded-2xl overflow-hidden border border-ocean-border transition-all group cursor-pointer">
                            {/* Date Box */}
                            <div className="w-24 bg-ocean-surface flex flex-col items-center justify-center border-r border-ocean-border group-hover:bg-biolum/10 transition-colors">
                                <span className="text-xs font-bold text-biolum uppercase tracking-wide">{event.date.split('•')[0].split(' ')[0]}</span>
                                <span className="text-2xl font-black text-ocean-text">{event.date.split('•')[0].split(' ')[1]}</span>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-ocean-text mb-1 group-hover:text-biolum transition-colors">{event.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-ocean-text-dim mt-2">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {event.date.split('•')[1]}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                        {event.location}
                                    </span>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="flex items-center px-6">
                                <button className="px-4 py-2 rounded-lg bg-ocean-surface text-sm font-bold text-ocean-text hover:bg-biolum hover:text-ocean-deep transition-all">
                                    RSVP
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

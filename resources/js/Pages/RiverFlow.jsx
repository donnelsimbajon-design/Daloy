import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const notes = [
    { title: 'Project Deep Blue Ideas', preview: 'Research on bioluminescence implementation...', date: '2 days ago' },
    { title: 'Meeting Notes: Coral Team', preview: 'Discussed the new UI patterns for schools...', date: '1 week ago' },
    { title: 'Design System Checklist', preview: '- Primary color: #38BDF8\n- Background: #0B1120...', date: '2 weeks ago' },
];

export default function RiverFlow() {
    return (
        <MainLayout>
            <Head title="River Flow" />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-ocean-text">River Flow</h1>
                        <p className="text-ocean-text-dim">Your personal stream of thoughts & notes</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-ocean-text hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card */}
                    <button className="h-48 rounded-2xl border-2 border-dashed border-ocean-border flex flex-col items-center justify-center text-ocean-text-dim hover:text-biolum hover:border-biolum/50 hover:bg-ocean-card/30 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-ocean-surface flex items-center justify-center mb-3 group-hover:bg-biolum/10 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <span className="font-semibold">New Note</span>
                    </button>

                    {/* Note Cards */}
                    {notes.map((note, i) => (
                        <div key={i} className="h-48 p-6 rounded-2xl bg-ocean-card border border-ocean-border hover:border-biolum/30 hover:-translate-y-1 transition-all cursor-pointer flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-biolum/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-lg font-bold text-ocean-text mb-2">{note.title}</h3>
                            <p className="text-sm text-ocean-text-dim flex-1 whitespace-pre-line">{note.preview}</p>
                            <p className="text-[10px] text-ocean-text-muted mt-4 uppercase tracking-wider font-semibold">{note.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

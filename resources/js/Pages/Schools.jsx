import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const schools = [
    { name: 'Coral Designers', desc: 'UI/UX designers focusing on fluid interfaces.', members: 12400, role: 'Member' },
    { name: 'Aquatic Arch', desc: 'Sustainable underwater architecture discussion.', members: 8100, role: 'Join' },
    { name: 'Biolum Devs', desc: 'Developers working on DALOY ecosystem.', members: 3200, role: 'Join' },
    { name: 'Deep Sea Photo', desc: 'Sharing photography from the abyss.', members: 5600, role: 'Member' },
];

export default function Schools() {
    return (
        <MainLayout>
            <Head title="Schools" />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-ocean-text">Your Schools</h1>
                        <p className="text-ocean-text-dim">Communities swimming together</p>
                    </div>
                    <button className="px-4 py-2 bg-biolum text-white text-sm font-bold rounded-full hover:bg-biolum-bright transition-colors">
                        + Create School
                    </button>
                </div>

                <div className="grid gap-4">
                    {schools.map((school, i) => (
                        <div key={i} className="flex items-center p-4 bg-ocean-card/40 border border-ocean-border rounded-2xl hover:bg-ocean-card/60 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center text-xl font-bold text-ocean-text">
                                {school.name.charAt(0)}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-ocean-text group-hover:text-biolum transition-colors">{school.name}</h3>
                                <p className="text-sm text-ocean-text-dim">{school.desc}</p>
                                <p className="text-xs text-ocean-text-muted mt-1">{school.members.toLocaleString()} members</p>
                            </div>
                            <button className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${school.role === 'Member'
                                    ? 'bg-ocean-surface text-ocean-text border border-ocean-border'
                                    : 'bg-biolum text-white hover:bg-biolum-bright'
                                }`}>
                                {school.role}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

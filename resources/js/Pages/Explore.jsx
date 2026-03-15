import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const exploreCategories = [
    { name: 'Marine Biology', count: '12k flows', color: 'bg-cyan-600' },
    { name: 'Ocean Tech', count: '8.5k flows', color: 'bg-indigo-600' },
    { name: 'Conservation', count: '6.2k flows', color: 'bg-emerald-600' },
    { name: 'Deep Sea Life', count: '4.1k flows', color: 'bg-violet-600' },
];

const trendingFlows = [
    { title: 'The hidden coral reefs of Palawan', author: 'Reef Explorer', likes: '1.2k' },
    { title: 'New bioluminescent species discovered', author: 'Deep Science', likes: '984' },
    { title: 'Sustainable fishing practices 2026', author: 'Ocean Guard', likes: '856' },
];

export default function Explore() {
    return (
        <MainLayout>
            <Head title="Explore" />

            <div className="space-y-8">
                {/* Header */}
                <div className="text-center py-8">
                    <h1 className="text-3xl font-extrabold text-ocean-text tracking-tight mb-2">Discover New Currents</h1>
                    <p className="text-ocean-text-dim">Dive into trending topics and emerging streams.</p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {exploreCategories.map((cat) => (
                        <div key={cat.name} className={`relative overflow-hidden rounded-2xl h-32 p-4 flex flex-col justify-end ${cat.color} group cursor-pointer hover:scale-[1.02] transition-transform`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <h3 className="relative text-lg font-bold text-white z-10">{cat.name}</h3>
                            <p className="relative text-xs text-white/80 z-10">{cat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Trending Content */}
                <div>
                    <h2 className="text-xl font-bold text-biolum mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                        </svg>
                        Trending Across the Ocean
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {trendingFlows.map((flow, i) => (
                            <div key={i} className="bg-ocean-card/60 rounded-xl p-5 border border-ocean-border hover:border-biolum/30 transition-all cursor-pointer">
                                <h3 className="font-semibold text-ocean-text mb-2 line-clamp-2">{flow.title}</h3>
                                <div className="flex items-center justify-between text-xs text-ocean-text-dim">
                                    <span>by {flow.author}</span>
                                    <span className="flex items-center gap-1 text-rose-400">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                                        {flow.likes}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

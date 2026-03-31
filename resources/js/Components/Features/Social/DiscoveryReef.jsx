import React from 'react';

const trendingCurrents = [
    '#OceanicTech', '#LiquidMotion', '#SaltLife2024', '#Biolum', '#DeepDiveUI',
];

const suggestedSchools = [
    { name: 'Coral Designers', members: '12.4k', active: 23, initial: 'C', color: 'bg-cyan-600' },
    { name: 'Aquatic Arch', members: '8.1k', active: 5, initial: 'A', color: 'bg-blue-600' },
];

const liveRipples = [
    { user: 'Kai Storm', action: "liked your flow 'Midnight Dive'", time: '2m ago' },
    { user: 'Ocean_Lover', action: 'started following you', time: '15m ago' },
    { user: 'TechCurrent', action: 'mentioned you in "Future of UI"', time: '1h ago' },
];

export default function DiscoveryReef() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-biolum tracking-tight">Discovery Reef</h2>
                <p className="text-sm text-ocean-text-dim mt-0.5">Explore trending ripples and schools</p>
            </div>

            {/* Trending Currents */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                    <h3 className="text-xs font-bold text-biolum tracking-widest uppercase">Trending Currents</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trendingCurrents.map((tag) => (
                        <button
                            key={tag}
                            className="px-3 py-1.5 rounded-full text-xs font-medium text-biolum bg-biolum/10 border border-biolum/20 hover:bg-biolum/20 hover:border-biolum/40 transition-all"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Suggested Schools */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    <h3 className="text-xs font-bold text-biolum tracking-widest uppercase">Suggested Schools</h3>
                </div>
                <div className="space-y-2">
                    {suggestedSchools.map((school) => (
                        <div key={school.name} className="flex items-center justify-between p-3 rounded-xl bg-ocean-card/50 border border-ocean-border hover:border-ocean-hover transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${school.color} flex items-center justify-center text-white font-bold text-sm`}>
                                    {school.initial}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-ocean-text">{school.name}</h4>
                                    <p className="text-xs text-ocean-text-dim">{school.members} members · {school.active} active</p>
                                </div>
                            </div>
                            <button className="px-4 py-1.5 rounded-full text-xs font-bold text-ocean-text bg-biolum hover:bg-biolum-bright transition-colors uppercase tracking-wide">
                                Join
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Ripples */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <h3 className="text-xs font-bold text-biolum tracking-widest uppercase">Live Ripples</h3>
                </div>
                <div className="space-y-1">
                    {liveRipples.map((ripple, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-ocean-card/30 transition-colors">
                            <div className="mt-1 w-2 h-2 rounded-full bg-biolum shrink-0"></div>
                            <div className="min-w-0">
                                <p className="text-xs text-ocean-text leading-relaxed">
                                    <span className="font-semibold text-ocean-text">{ripple.user}</span>{' '}
                                    {ripple.action}
                                </p>
                                <p className="text-[10px] text-ocean-text-dim mt-0.5">{ripple.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

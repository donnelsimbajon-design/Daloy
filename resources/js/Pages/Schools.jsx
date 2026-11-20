import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';

export default function Schools() {
    const { schools: initialSchools, filter: initialFilter } = usePage().props;
    const [schools, setSchools] = useState(initialSchools || []);
    const [filter, setFilter] = useState(initialFilter || 'all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', privacy: 'public' });

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        router.get('/schools', { filter: newFilter }, { preserveState: true, replace: true });
    };

    const handleToggleMembership = async (e, schoolId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await axios.post(`/schools/${schoolId}/toggle-membership`);
            setSchools(prev => prev.map(s => {
                if (s.id === schoolId) {
                    return { ...s, is_member: res.data.is_member };
                }
                return s;
            }));
        } catch (err) {
            console.error('Toggle membership error:', err);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            router.post('/schools', newGroup, {
                onSuccess: () => {
                    setShowCreateModal(false);
                    setNewGroup({ name: '', description: '', privacy: 'public' });
                },
                onFinish: () => setCreating(false),
            });
        } catch (err) {
            console.error('Create group error:', err);
            setCreating(false);
        }
    };

    const filters = [
        { key: 'all', label: 'All Communities' },
        { key: 'my', label: 'My Hubs' },
        { key: 'discover', label: 'Discover' },
    ];

    return (
        <MainLayout>
            <Head title="Schools & Groups" />

            <div className="daloy-page daloy-schools max-w-7xl mx-auto px-4 py-10 lg:px-8">
                {/* ── Editorial Header ── */}
                <div className="relative mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-ocean-border">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-biolum/10 backdrop-blur-md border border-biolum/20 rounded-full text-[11px] font-black tracking-widest text-biolum uppercase mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-biolum animate-pulse"></span>
                            Communities & Hubs
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-ocean-text tracking-tight leading-[1.1] animate-subtle-in">
                            Discover where you <span className="text-biolum">belong</span>
                        </h1>
                        <p className="text-ocean-text-dim mt-4 text-base md:text-lg leading-relaxed animate-subtle-in" style={{ animationDelay: '0.1s' }}>
                            Join vibrant learning communities, creative circles, and editorial hubs that align with your passions.
                        </p>
                    </div>
                    <div className="shrink-0 animate-subtle-in" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="group relative px-6 py-3 bg-biolum text-biolum-foreground text-sm font-bold rounded-2xl overflow-hidden shadow-lg hover:shadow-biolum/20 transition-all hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Create Hub
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Modern Navigation ── */}
                <div className="flex bg-ocean-surface p-1.5 rounded-2xl border border-ocean-border w-max mb-10 overflow-x-auto mx-auto md:mx-0 animate-subtle-in" style={{ animationDelay: '0.3s' }}>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                filter === f.key
                                    ? 'bg-ocean-card text-ocean-text shadow-sm border border-ocean-border/50'
                                    : 'text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-hover'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ── Grid Layout ── */}
                {schools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-ocean-card border border-ocean-border border-dashed rounded-3xl text-center">
                        <div className="w-20 h-20 bg-ocean-surface rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="w-8 h-8 text-ocean-text-dim opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-ocean-text mb-2">No communities found</h3>
                        <p className="text-ocean-text-dim text-sm max-w-sm mx-auto leading-relaxed">
                            Looks quiet here. Try adjusting your filters or take the leap and create a new hub!
                        </p>
                        <button onClick={() => setShowCreateModal(true)} className="mt-6 px-6 py-2 border border-ocean-border rounded-xl text-sm font-bold text-ocean-text hover:bg-ocean-hover transition-colors">
                            Start a Community
                        </button>
                    </div>
                ) : (
                    <div className="daloy-community-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {schools.map((school, index) => (
                            <Link 
                                href={`/schools/${school.id}`} 
                                key={school.id} 
                                className="group flex flex-col bg-ocean-card border border-ocean-border rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-biolum/20 transition-all duration-500 animate-subtle-in hover:-translate-y-1"
                                style={{ animationDelay: `${0.1 * Math.min(index, 5)}s` }}
                            >
                                {/* Cover Image area */}
                                <div className="h-44 w-full relative overflow-hidden bg-ocean-surface">
                                    {school.cover_image ? (
                                        <img src={school.cover_image} alt={school.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-biolum/10 to-ocean-surface flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
                                            <span className="text-5xl font-black text-ocean-border uppercase opacity-50 tracking-tighter">
                                                {school.name.substring(0, 2)}
                                            </span>
                                        </div>
                                    )}
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-card via-ocean-card/20 to-transparent"></div>
                                    
                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {school.privacy === 'private' && (
                                            <div className="px-2.5 py-1 bg-ocean-card/80 backdrop-blur-md border border-ocean-border text-[10px] font-bold text-ocean-text uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-sm">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                                Private
                                            </div>
                                        )}
                                    </div>

                                    {/* Avatar/Logo overlapping cover */}
                                    <div className="absolute -bottom-6 left-6 p-1 bg-ocean-card rounded-2xl shadow-sm border border-ocean-border">
                                        <div className="w-16 h-16 bg-ocean-surface rounded-xl overflow-hidden flex items-center justify-center text-biolum font-black text-xl">
                                            {school.profile_image ? (
                                                <img src={school.profile_image} className="w-full h-full object-cover" />
                                            ) : (
                                                school.name.charAt(0)
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="pt-8 p-6 flex flex-col flex-1 h-full">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h3 className="text-xl font-bold text-ocean-text tracking-tight leading-tight group-hover:text-biolum transition-colors line-clamp-2">
                                            {school.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-ocean-text-dim leading-relaxed mb-6 line-clamp-2 flex-1">
                                        {school.description || 'Welcome to the community. No description has been provided yet.'}
                                    </p>

                                    {/* Footer Details */}
                                    <div className="mt-auto pt-4 border-t border-ocean-border/50 flex flex-col gap-4">
                                        {/* Stats Row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-ocean-text-dim">
                                                <svg className="w-4 h-4 text-biolum/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                </svg>
                                                <span>{school.members_count} Members</span>
                                            </div>
                                            
                                            {/* Avatars */}
                                            <div className="flex items-center">
                                                {(school.member_avatars || []).slice(0, 3).map((member, idx) => (
                                                    <div key={member.id} className={`w-6 h-6 rounded-full border-2 border-ocean-card bg-ocean-surface overflow-hidden ${idx > 0 && '-ml-2'}`}>
                                                        {member.profile_picture ? (
                                                            <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-ocean-text-dim bg-biolum/10">
                                                                {member.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {school.members_count > 3 && (
                                                    <div className="w-6 h-6 -ml-2 rounded-full border-2 border-ocean-card bg-ocean-surface flex items-center justify-center text-[8px] font-bold text-ocean-text-dim">
                                                        +{Math.min(school.members_count - 3, 99)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={(e) => handleToggleMembership(e, school.id)}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${
                                                school.is_member
                                                    ? 'bg-ocean-surface border border-ocean-border text-ocean-text hover:bg-ocean-border/50'
                                                    : 'bg-ocean-text text-ocean-card hover:bg-biolum hover:text-biolum-foreground'
                                            }`}
                                        >
                                            {school.is_member ? 'Joined' : 'Join Community'}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── Create Group Modal ── */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-ocean-deep/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                        <div className="relative bg-ocean-card border border-ocean-border rounded-3xl p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-subtle-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-ocean-text tracking-tight">Create a Hub</h2>
                                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center bg-ocean-surface rounded-full text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-hover transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateGroup} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-ocean-text-dim uppercase tracking-widest mb-1.5 ml-1">Community Name</label>
                                    <input
                                        type="text"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-2xl px-4 py-3.5 text-sm font-semibold text-ocean-text focus:outline-none focus:border-biolum focus:ring-1 focus:ring-biolum placeholder:font-normal placeholder-ocean-text-dim/60 transition-all"
                                        placeholder="E.g. Creative Collective"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-ocean-text-dim uppercase tracking-widest mb-1.5 ml-1">About</label>
                                    <textarea
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-2xl px-4 py-3.5 text-sm text-ocean-text focus:outline-none focus:border-biolum focus:ring-1 focus:ring-biolum resize-none placeholder-ocean-text-dim/60 transition-all h-28"
                                        placeholder="What's the purpose of this space?"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer flex items-center justify-center border rounded-2xl py-3 text-sm font-bold transition-all ${newGroup.privacy === 'public' ? 'border-biolum bg-biolum/5 text-biolum' : 'border-ocean-border text-ocean-text-dim hover:bg-ocean-hover'}`}>
                                        <input type="radio" value="public" checked={newGroup.privacy === 'public'} onChange={(e) => setNewGroup(prev => ({ ...prev, privacy: e.target.value }))} className="hidden" />
                                        Public Arena
                                    </label>
                                    <label className={`cursor-pointer flex items-center justify-center border rounded-2xl py-3 text-sm font-bold transition-all ${newGroup.privacy === 'private' ? 'border-biolum bg-biolum/5 text-biolum' : 'border-ocean-border text-ocean-text-dim hover:bg-ocean-hover'}`}>
                                        <input type="radio" value="private" checked={newGroup.privacy === 'private'} onChange={(e) => setNewGroup(prev => ({ ...prev, privacy: e.target.value }))} className="hidden" />
                                        Private Vault
                                    </label>
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-6 py-4 border border-ocean-border text-ocean-text font-bold rounded-2xl hover:bg-ocean-hover transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newGroup.name.trim()}
                                        className="flex-1 flex items-center justify-center px-6 py-4 bg-biolum text-biolum-foreground text-sm font-black rounded-2xl hover:bg-biolum-bright focus:outline-none focus:ring-4 focus:ring-biolum/20 transition-all disabled:opacity-50 tracking-wide"
                                    >
                                        {creating ? 'Establishing...' : 'Create Hub'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

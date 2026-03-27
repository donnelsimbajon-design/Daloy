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

    const handleToggleMembership = async (schoolId) => {
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
        { key: 'all', label: 'All Groups' },
        { key: 'my', label: 'My Groups' },
        { key: 'discover', label: 'Discover' },
    ];

    return (
        <MainLayout>
            <Head title="Schools & Groups" />

            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                    <div>
                        <p className="text-sm font-semibold text-biolum mb-1">Community</p>
                        <h1 className="text-3xl font-bold text-ocean-text tracking-tight">Schools & Groups</h1>
                        <p className="text-ocean-text-dim mt-1.5 text-sm md:text-base max-w-xl">
                            Join learning communities and editorial circles that match your interests.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-5 py-2 bg-biolum text-ocean-deep text-sm font-semibold rounded-xl hover:bg-biolum-bright transition-colors"
                        >
                            Create New
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-8 border-b border-ocean-border pb-4">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filter === f.key
                                    ? 'bg-biolum text-ocean-deep'
                                    : 'bg-ocean-surface border border-ocean-border text-ocean-text hover:bg-ocean-card'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {schools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <svg className="w-16 h-16 text-ocean-text-dim mb-4 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        <h3 className="text-ocean-text font-bold text-lg mb-1">No groups found</h3>
                        <p className="text-ocean-text-dim text-sm">Try a different filter or create your own group!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {schools.map((school) => (
                            <div key={school.id} className="flex flex-col bg-ocean-card border border-ocean-border rounded-[20px] overflow-hidden hover:border-biolum/30 transition-all cursor-pointer group shadow-sm">
                                {/* Cover */}
                                <Link href={`/schools/${school.id}`} className="block h-40 w-full relative border-b border-ocean-border overflow-hidden">
                                    {school.cover_image ? (
                                        <img src={school.cover_image} alt={school.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-biolum/20 to-biolum/5 flex items-center justify-center">
                                            <span className="text-2xl font-black text-biolum/30 tracking-[0.2em] uppercase">{school.name.substring(0, 3)}</span>
                                        </div>
                                    )}
                                    {school.privacy === 'private' && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-ocean-card/90 backdrop-blur-sm border border-ocean-border text-xs font-semibold text-ocean-text rounded-lg">
                                            Private
                                        </div>
                                    )}
                                </Link>

                                {/* Body */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link href={`/schools/${school.id}`}>
                                            <h3 className="text-[22px] font-bold text-ocean-text tracking-tight leading-none group-hover:text-biolum transition-colors">
                                                {school.name}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-1.5 text-ocean-text-dim text-xs font-semibold shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                            </svg>
                                            {school.members_count}
                                        </div>
                                    </div>
                                    <p className="text-sm text-ocean-text-dim leading-relaxed mb-6 flex-1 line-clamp-2">
                                        {school.description || 'No description yet.'}
                                    </p>

                                    {/* Footer: Avatars + Action */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center">
                                            {school.member_avatars && school.member_avatars.map((member, idx) => (
                                                <div key={member.id} className={`w-8 h-8 rounded-full border-2 border-ocean-card bg-ocean-surface overflow-hidden ${idx > 0 && '-ml-2'}`}>
                                                    {member.profile_picture ? (
                                                        <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ocean-text-dim bg-biolum/10">
                                                            {member.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {school.members_count > 3 && (
                                                <div className="w-8 h-8 -ml-2 rounded-full border-2 border-ocean-card bg-ocean-surface flex items-center justify-center text-[10px] font-bold text-ocean-text-dim">
                                                    +{school.members_count - 3}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleToggleMembership(school.id)}
                                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                                school.is_member
                                                    ? 'bg-transparent border border-ocean-border text-ocean-text-dim hover:text-ocean-text flex items-center gap-1.5'
                                                    : 'bg-biolum text-ocean-deep hover:bg-biolum-bright flex items-center justify-center'
                                            }`}
                                        >
                                            {school.is_member && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                            {school.is_member ? 'Member' : 'Join Group'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                        <div className="relative bg-ocean-card border border-ocean-border rounded-[24px] p-8 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-extrabold text-ocean-text mb-6">Create New Group</h2>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-ocean-text-dim uppercase tracking-widest mb-2">Group Name</label>
                                    <input
                                        type="text"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 placeholder-ocean-text-dim"
                                        placeholder="e.g. Digital Futurists"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ocean-text-dim uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-3 text-sm text-ocean-text focus:outline-none focus:border-biolum/50 placeholder-ocean-text-dim resize-none"
                                        placeholder="What is this group about?"
                                        rows="3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ocean-text-dim uppercase tracking-widest mb-2">Privacy</label>
                                    <div className="flex gap-3">
                                        {['public', 'private'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setNewGroup(prev => ({ ...prev, privacy: p }))}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border ${
                                                    newGroup.privacy === p
                                                        ? 'bg-biolum text-white border-biolum'
                                                        : 'bg-ocean-surface text-ocean-text border-ocean-border hover:bg-ocean-card'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-ocean-border text-ocean-text text-sm font-medium hover:bg-ocean-surface transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating || !newGroup.name.trim()} className="flex-1 py-2.5 rounded-xl bg-biolum text-ocean-deep text-sm font-semibold hover:bg-biolum-bright transition-colors disabled:opacity-50">
                                        {creating ? 'Creating...' : 'Create Group'}
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

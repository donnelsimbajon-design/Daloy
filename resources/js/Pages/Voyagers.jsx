import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import UserCard from '@/Components/UserCard';
import axios from 'axios';

export default function Voyagers() {
    const { auth } = usePage().props;

    // Read initial ?q= from URL (set by TopNav search)
    const urlParams = new URLSearchParams(window.location.search);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(urlParams.get('q') || '');
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);
    const debounceTimer = useRef(null);

    // Fetch whenever search or filter change (debounced for typing)
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchUsers(search, filter);
        }, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [search, filter]);

    const fetchUsers = async (q, type) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('/api/search', {
                params: { q: q.trim(), type },
            });
            // API returns paginated: { data: [...], total, ... }
            setUsers(res.data.data || []);
        } catch (err) {
            console.error('Search error:', err);
            if (err.response?.status === 401) {
                setError('Session expired. Please refresh the page.');
            } else {
                setError('Failed to load users. Please try again.');
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    };

    return (
        <MainLayout>
            <Head title="Voyagers — Discover People" />

            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* ── Page Header ──────────────────────────────────── */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-ocean-text tracking-tight">Voyagers</h1>
                    <p className="text-ocean-text-dim mt-1 text-sm">Search and discover fellow explorers of the deep.</p>
                </div>

                {/* ── Search + Filter Row ──────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <input
                            id="voyagers-search-input"
                            type="text"
                            placeholder="Search by name or username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-ocean-card text-ocean-text border border-ocean-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-biolum/50 focus:ring-1 focus:ring-biolum/20 transition-all placeholder-ocean-text-dim"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ocean-text-dim hover:text-ocean-text"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <select
                        id="voyagers-filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-ocean-surface text-ocean-text border border-ocean-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-biolum transition-colors"
                    >
                        <option value="all">All Voyagers</option>
                        <option value="friends">Friends Only</option>
                        <option value="following">Following</option>
                    </select>
                </div>

                {/* ── Status / Error ────────────────────────────────── */}
                {error && (
                    <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Results ──────────────────────────────────────── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-ocean-text-dim">
                        <div className="w-8 h-8 border-2 border-biolum/30 border-t-biolum rounded-full animate-spin mb-3" />
                        <span className="text-sm">Searching the depths...</span>
                    </div>
                ) : (
                    <>
                        {!error && users.length > 0 && (
                            <p className="text-xs text-ocean-text-dim mb-3">
                                {users.length} voyager{users.length !== 1 ? 's' : ''} found
                                {search ? ` for "${search}"` : ''}
                            </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        onUpdate={handleUserUpdate}
                                    />
                                ))
                            ) : !error && (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-ocean-text-dim">
                                    <svg className="w-12 h-12 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                    <p className="text-sm font-medium">
                                        {search
                                            ? `No voyagers found for "${search}"`
                                            : filter === 'friends'
                                                ? "You haven't made any friends yet."
                                                : filter === 'following'
                                                    ? "You aren't following anyone yet."
                                                    : "No voyagers to show."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

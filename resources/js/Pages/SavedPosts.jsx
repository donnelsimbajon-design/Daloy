import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/UI/Cards/PostCard';
import { Bookmark, FileText, BarChart2, Image as ImageIcon } from 'lucide-react';

export default function SavedPosts({ bookmarks, collections = [] }) {
    const [filter, setFilter] = useState('all');
    // Always use fresh Inertia pagination props instead of a stale initial copy.
    const bookmarkItems = bookmarks?.data || [];

    const filters = [
        { key: 'all', label: 'All Saved', icon: <Bookmark size={14} /> },
        { key: 'posts', label: 'Posts', icon: <FileText size={14} /> },
        { key: 'polls', label: 'Polls', icon: <BarChart2 size={14} /> },
        { key: 'media', label: 'Media', icon: <ImageIcon size={14} /> },
    ];

    const filteredItems = bookmarkItems.filter(item => {
        const post = item.post;
        if (!post) return false;
        if (filter === 'polls') return post.poll;
        if (filter === 'media') return post.media?.length > 0 || post.media_urls?.length > 0;
        if (filter === 'posts') return !post.poll && (!post.media || post.media.length === 0);
        return true;
    });

    return (
        <MainLayout>
            <Head title="Saved Posts" />

            <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-ocean-text">Saved Posts</h1>
                            <p className="text-xs text-ocean-text-dim">{bookmarkItems.length} saved item{bookmarkItems.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                filter === f.key
                                    ? 'bg-biolum/20 text-biolum border border-biolum/30'
                                    : 'bg-ocean-card/70 text-ocean-text-dim border border-ocean-divider hover:bg-ocean-surface hover:text-ocean-text'
                            }`}
                        >
                            <span>{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Saved Posts */}
                {filteredItems.length > 0 ? (
                    <div className="space-y-4">
                        {filteredItems.map((item) => {
                            const post = item.post;
                            return (
                                <div key={item.id || post.id} className="relative">
                                    <PostCard post={post} />
                                    {/* Saved date tag */}
                                    {item.created_at && (
                                        <div className="absolute top-3 right-14 text-[10px] text-ocean-text-dim/60 font-medium">
                                            Saved {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-ocean-surface/60 border border-ocean-divider flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-ocean-text-dim/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-ocean-text mb-1">No saved posts yet</h3>
                        <p className="text-sm text-ocean-text-dim max-w-xs mx-auto">
                            {filter === 'all'
                                ? 'Bookmark posts from your feed to save them here for later.'
                                : `No saved ${filter} found. Try a different filter.`
                            }
                        </p>
                        <Link
                            href="/app"
                            className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-biolum/10 border border-biolum/20 text-biolum text-sm font-bold rounded-xl hover:bg-biolum/20 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                            Browse Feed
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {bookmarks?.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {bookmarks.links?.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => link.url && router.get(link.url)}
                                disabled={!link.url}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    link.active
                                        ? 'bg-biolum text-ocean-deep'
                                        : 'bg-ocean-card border border-ocean-divider text-ocean-text-dim hover:text-ocean-text disabled:opacity-30'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

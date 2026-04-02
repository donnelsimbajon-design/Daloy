import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/PostCard';

export default function Hashtag({ hashtag, posts }) {
    const postItems = posts?.data || [];

    return (
        <MainLayout>
            <Head title={`#${hashtag}`} />

            <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/explore" className="inline-flex items-center gap-1 text-xs text-ocean-text-dim hover:text-biolum transition-colors mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        Back to Explore
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-biolum/10 border border-biolum/20 flex items-center justify-center">
                            <span className="text-2xl font-black text-biolum">#</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-ocean-text">#{hashtag}</h1>
                            <p className="text-xs text-ocean-text-dim">{posts?.total || 0} post{(posts?.total || 0) !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Posts */}
                {postItems.length > 0 ? (
                    <div className="space-y-4">
                        {postItems.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-ocean-surface/60 border border-ocean-divider flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-ocean-text-dim/40">#</span>
                        </div>
                        <h3 className="text-lg font-bold text-ocean-text mb-1">No posts yet</h3>
                        <p className="text-sm text-ocean-text-dim">Be the first to post with #{hashtag}</p>
                    </div>
                )}

                {/* Pagination */}
                {posts?.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {posts.links?.map((link, i) => (
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

import React from 'react';
import { Link } from '@inertiajs/react';
import PostCard from '@/Components/UI/Cards/PostCard';

export default function Feed({ posts = [] }) {
    return (
        <div className="daloy-post-list space-y-5 sm:space-y-6">
            {/* Posts */}
            <div className="space-y-4 sm:space-y-5">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="daloy-empty-feed text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-ocean-surface/50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-ocean-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-ocean-text mb-1">The waters are calm</h3>
                        <p className="text-sm text-ocean-text-dim mb-5">Be the first to cast a post into the flow!</p>
                        <Link href="/schools" className="inline-flex rounded-full bg-biolum/10 border border-biolum/25 text-biolum text-sm font-semibold px-5 py-2.5 hover:bg-biolum/20">Find your community</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

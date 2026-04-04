import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PostCard from '@/Components/UI/Cards/PostCard';

export default function Show({ post }) {
    return (
        <MainLayout>
            <Head title={`Post by ${post.user?.name || 'User'}`} />
            
            <div className="max-w-2xl mx-auto pt-6 px-4 pb-20">
                <div className="mb-6 flex items-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-ocean-text-dim hover:text-ocean-text transition-colors text-sm font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Stream
                    </Link>
                </div>
                
                {post ? (
                    <PostCard post={post} />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-ocean-text-dim">Post not found or unavailable.</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

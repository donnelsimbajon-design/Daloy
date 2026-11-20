import React, { useMemo } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';

import MainLayout from '@/Layouts/MainLayout';
import Feed from '@/Components/UI/Misc/Feed';
import ReefPanel from '@/Components/UI/Panels/ReefPanel';
import StoryRail from '@/Components/Features/Stories/StoryRail';
import QuickPostCard from '@/Components/QuickPostCard';
import FeedAnnouncementCard from '@/Components/Features/Announcements/FeedAnnouncementCard';

export default function Dashboard({ posts }) {
    const postItems = posts?.data || [];
    const { social, announcements, auth } = usePage().props;
    const firstName = auth?.user?.name?.trim()?.split(/\s+/)?.[0] || 'Voyager';

    // Filter feed-type announcements that haven't been dismissed
    const feedAnnouncements = useMemo(() => {
        if (!announcements || announcements.length === 0) return [];
        const dismissed = JSON.parse(localStorage.getItem('daloy_dismissed_feed_announcements') || '[]');
        return announcements.filter(a =>
            (a.display_location === 'feed' || a.display_location === 'all') &&
            !dismissed.includes(a.id)
        );
    }, [announcements]);

    return (
        <MainLayout>
            <Head title="Your Feed" />

            {/* ── Fixed Left Rail: Stories (Desktop only) ── */}
            <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-20 xl:w-24 border-r border-ocean-border z-20 bg-ocean-card/40" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <div className="pt-3 px-1.5 h-full flex flex-col items-center w-full overflow-hidden">
                    <div className="bg-ocean-card/50 rounded-2xl border border-ocean-border w-full h-[calc(100%-8px)] overflow-hidden">
                        <StoryRail />
                    </div>
                </div>
            </aside>

            {/* Dashboard Content — Main Area ───────────────────── */}
            <div className={`daloy-page daloy-feed transition-all duration-500 ease-in-out md:ml-20 xl:ml-24 w-full md:w-auto overflow-x-hidden`}>
                <div className="flex flex-col items-start w-full min-h-screen">

                    {/* Main Area: Feed & Mobile Stories — fixed width, shifts to center when panel closes */}
                    <div className="flex-1 w-full max-w-[850px] mx-auto pt-4 md:pt-6 px-2 sm:px-4 transition-all duration-400">
                        <section className="daloy-feed-header">
                            <p className="daloy-eyebrow mb-2">Your Daloy feed</p>
                            <h1 className="mb-2">Good to see you, {firstName}.</h1>
                            <p className="text-sm leading-relaxed mb-4">See updates from friends, share a post, and join your school communities.</p>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/explore" className="inline-flex items-center rounded-full bg-biolum px-4 py-2 text-xs font-bold text-biolum-foreground hover:brightness-110 transition-all">Explore posts</Link>
                                <Link href="/schools" className="inline-flex items-center rounded-full border border-ocean-border px-4 py-2 text-xs font-bold text-ocean-text hover:bg-ocean-hover transition-all">Find communities</Link>
                            </div>
                            <details className="mt-4 border-t border-ocean-divider pt-4 text-sm">
                                <summary className="cursor-pointer font-semibold text-ocean-text-muted hover:text-ocean-text">
                                    New to Daloy? See how it works
                                </summary>
                                <ol className="mt-3 grid gap-2 text-ocean-text-muted sm:grid-cols-3" aria-label="Getting started">
                                    <li className="rounded-xl bg-ocean-surface px-3 py-3"><strong className="block text-ocean-text">1. Share</strong>Use the post box below to share an update.</li>
                                    <li className="rounded-xl bg-ocean-surface px-3 py-3"><strong className="block text-ocean-text">2. Connect</strong>Like, comment, or message your classmates.</li>
                                    <li className="rounded-xl bg-ocean-surface px-3 py-3"><strong className="block text-ocean-text">3. Join</strong>Find your school or another community.</li>
                                </ol>
                            </details>
                        </section>

                        {/* Mobile/Tablet Stories - shown only on small screens */}
                        <div className="daloy-story-rail md:hidden mb-6 bg-ocean-card border border-ocean-border rounded-2xl py-4 overflow-hidden">
                            <StoryRail horizontal={true} />
                        </div>

                        {/* Feed Container */}
                        <div className="w-full">
                            {/* Pinned Admin Announcements (Feed-type) */}
                            {feedAnnouncements.map(ann => (
                                <FeedAnnouncementCard key={ann.id} announcement={ann} />
                            ))}

                            <QuickPostCard />
                            <Feed posts={postItems} />
                        </div>
                    </div>
                </div>
            </div>

        </MainLayout>
    );
}

import React, { useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';

import MainLayout from '@/Layouts/MainLayout';
import Feed from '@/Components/UI/Misc/Feed';
import ReefPanel from '@/Components/UI/Panels/ReefPanel';
import StoryRail from '@/Components/Features/Stories/StoryRail';
import QuickPostCard from '@/Components/QuickPostCard';
import FeedAnnouncementCard from '@/Components/Features/Announcements/FeedAnnouncementCard';

export default function Dashboard({ posts }) {
    const postItems = posts?.data || [];
    const { social, announcements } = usePage().props;

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
            <Head title="Deep Flow" />

            {/* ── Fixed Left Rail: Stories (Desktop only) ── */}
            <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-24 xl:w-28 border-r border-ocean-border z-20 bg-ocean-deep/50 backdrop-blur-sm shadow-[1px_0_3px_rgba(0,0,0,0.025)]">
                <div className="pt-3 px-1.5 h-full flex flex-col items-center w-full overflow-hidden">
                    <div className="bg-ocean-card rounded-2xl border border-ocean-border w-full h-[calc(100%-8px)] overflow-hidden">
                        <StoryRail />
                    </div>
                </div>
            </aside>

            {/* Dashboard Content — Main Area ───────────────────── */}
            <div className={`transition-all duration-500 ease-in-out md:ml-24 xl:ml-28 w-full md:w-auto overflow-x-hidden`}>
                <div className="flex flex-col items-start w-full min-h-screen">

                    {/* Main Area: Feed & Mobile Stories */}
                    <div className="flex-1 w-full pt-4 md:pt-6 px-2 sm:px-4 md:pl-3 xl:pl-4 md:pr-12 xl:pr-17">

                        {/* Mobile/Tablet Stories - shown only on small screens */}
                        <div className="md:hidden mb-6 bg-ocean-card border border-ocean-border rounded-[20px] py-4 shadow-sm overflow-hidden">
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

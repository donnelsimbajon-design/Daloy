import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import TopNav from '@/Components/UI/Navigation/TopNav';
import StatusBar from '@/Components/UI/Badges/StatusBar';
import FloatingActionButton from '@/Components/UI/Buttons/FloatingActionButton';
import GlobalRightRailWrapper from '@/Layouts/GlobalRightRailWrapper';
import GlobalAnnouncementBanner from '@/Components/Features/Announcements/GlobalAnnouncementBanner';

export default function MainLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    // Apply accessibility preferences to the document
    useEffect(() => {
        const root = document.documentElement;

        // Font size
        const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
        const fontSize = user?.font_size || 'medium';
        root.style.setProperty('--base-font-size', fontSizeMap[fontSize] || '16px');
        root.setAttribute('data-font-size', fontSize);

        // Reduce motion
        if (user?.reduce_motion) {
            root.setAttribute('data-reduce-motion', 'true');
        } else {
            root.removeAttribute('data-reduce-motion');
        }

        // High contrast
        if (user?.high_contrast) {
            root.setAttribute('data-high-contrast', 'true');
        } else {
            root.removeAttribute('data-high-contrast');
        }

        // Dark mode
        if (user?.dark_mode) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.removeAttribute('data-theme');
        }
    }, [user?.font_size, user?.reduce_motion, user?.high_contrast, user?.dark_mode]);

    return (
        <div className="min-h-screen bg-ocean-deep text-ocean-text">
            <TopNav />

            {/* Main Content Area */}
            <main className="pt-0 mx-auto w-full max-w-[1920px] overflow-x-hidden relative">
                <GlobalRightRailWrapper>
                    <div className="pt-20 pb-16 w-full px-0 sm:px-6 lg:px-8 max-w-[1536px] mx-auto transition-all duration-300">
                        {/* Inline announcement banner — flows naturally, no extra padding when empty */}
                        <GlobalAnnouncementBanner />
                        {children}
                    </div>
                </GlobalRightRailWrapper>
            </main>

            <StatusBar />
        </div>
    );
}


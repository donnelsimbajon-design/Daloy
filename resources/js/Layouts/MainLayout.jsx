import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import TopNav from '@/Components/UI/Navigation/TopNav';
import FloatingActionButton from '@/Components/UI/Buttons/FloatingActionButton';
import GlobalRightRailWrapper from '@/Layouts/GlobalRightRailWrapper';

import GlobalAnnouncementPopup from '@/Components/Features/Announcements/GlobalAnnouncementPopup';
import GlobalCallManager from '@/Components/Features/Messaging/GlobalCallManager';

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

    // Listen for locally initiated calls
    const [activeCallParam, setActiveCallParam] = React.useState(null);
    useEffect(() => {
        const handleStartCall = (e) => {
            setActiveCallParam(e.detail);
        };
        window.addEventListener('daloy:start-call', handleStartCall);
        return () => window.removeEventListener('daloy:start-call', handleStartCall);
    }, []);

    return (
        <div className="min-h-screen bg-ocean-deep text-ocean-text relative overflow-hidden">
            {/* Minimal glass backdrop — barely-visible color washes */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-[0.07]" style={{ background: '#A78BFA' }} />
                <div className="absolute -top-[5%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.05]" style={{ background: '#60A5FA' }} />
                <div className="absolute -bottom-[15%] left-[20%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.04]" style={{ background: '#F9A8D4' }} />
            </div>

            <TopNav />

            {/* Main Content Area */}
            <main className="pt-0 mx-auto w-full max-w-[1920px] overflow-x-hidden relative z-10">
                <GlobalRightRailWrapper>
                    <div className="pt-20 pb-16 w-full px-0 sm:px-6 lg:px-8 max-w-[1536px] mx-auto transition-all duration-300">

                        {children}
                    </div>
                </GlobalRightRailWrapper>
            </main>

            <GlobalAnnouncementPopup />
        </div>
    );
}

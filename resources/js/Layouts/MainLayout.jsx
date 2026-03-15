import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import TopNav from '@/Components/TopNav';
import StatusBar from '@/Components/StatusBar';
import FloatingActionButton from '@/Components/FloatingActionButton';

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
    }, [user?.font_size, user?.reduce_motion, user?.high_contrast]);

    return (
        <div className="min-h-screen bg-ocean-deep text-ocean-text">
            <TopNav />

            {/* Main Content Area */}
            <main className="pt-20 pb-16 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            <StatusBar />
        </div>
    );
}

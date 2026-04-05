import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { LanguageProvider } from '@/Contexts/LanguageContext';
import { CurrentsProvider } from '@/Contexts/CurrentsContext';
import GlobalAudioLayer from '@/Components/Features/Schools/GlobalAudioLayer';
import PersistentMiniPlayer from '@/Components/Features/Schools/PersistentMiniPlayer';
import NowPlayingBar from '@/Components/Features/Schools/NowPlayingBar';

const appName = import.meta.env.VITE_APP_NAME || 'DALOY';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <LanguageProvider>
                <CurrentsProvider>
                    <App {...props} />

                    {/* These render at the ROOT level — never unmount on navigation */}
                    <GlobalAudioLayer />
                    <PersistentMiniPlayer />
                    <NowPlayingBar />
                </CurrentsProvider>
            </LanguageProvider>
        );
    },
    progress: {
        color: '#38BDF8',
    },
});

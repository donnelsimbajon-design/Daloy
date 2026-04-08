import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { LanguageProvider } from '@/Contexts/LanguageContext';
import { CurrentsProvider } from '@/Contexts/CurrentsContext';
import GlobalAudioLayer from '@/Components/Features/Schools/GlobalAudioLayer';
import PersistentMiniPlayer from '@/Components/Features/Schools/PersistentMiniPlayer';
import NowPlayingBar from '@/Components/Features/Schools/NowPlayingBar';
import GlobalCallManager from '@/Components/Features/Messaging/GlobalCallManager';

const appName = import.meta.env.VITE_APP_NAME || 'DALOY';

/** Root-level call state — survives Inertia full-page navigations */
function PersistentCallLayer({ user }) {
    const [activeCallParam, setActiveCallParam] = React.useState(null);
    const currentUser = user;

    React.useEffect(() => {
        const handler = (e) => setActiveCallParam(e.detail);
        window.addEventListener('daloy:start-call', handler);
        return () => window.removeEventListener('daloy:start-call', handler);
    }, []);

    return (
        <GlobalCallManager
            activeCallParam={activeCallParam}
            onClearActiveCallParam={() => setActiveCallParam(null)}
            currentUser={currentUser}
        />
    );
}

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
                    <PersistentCallLayer user={props?.initialPage?.props?.auth?.user} />
                </CurrentsProvider>
            </LanguageProvider>
        );
    },
    progress: {
        color: '#38BDF8',
    },
});

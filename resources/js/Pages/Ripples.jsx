import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const notifications = [
    { type: 'like', user: 'Kai Storm', action: 'liked your flow', content: '"Midnight Dive photos..."', time: '2m ago', read: false },
    { type: 'follow', user: 'Ocean_Lover', action: 'started following you', time: '1h ago', read: false },
    { type: 'mention', user: 'TechCurrent', action: 'mentioned you in a comment', content: '"@Marina check this out!"', time: '3h ago', read: true },
    { type: 'system', user: 'DALOY', action: 'System Update', content: 'New features available in Schools', time: '1d ago', read: true },
];

export default function Ripples() {
    return (
        <MainLayout>
            <Head title="Ripples" />

            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ocean-text">Ripples</h1>
                    <button className="text-sm text-biolum hover:text-ocean-text transition-colors">Mark all as read</button>
                </div>

                <div className="space-y-2">
                    {notifications.map((notif, i) => (
                        <div key={i} className={`p-4 rounded-xl flex gap-4 transition-all ${notif.read ? 'bg-transparent hover:bg-ocean-card/30' : 'bg-ocean-card border-l-2 border-biolum'
                            }`}>
                            {/* Icon Type */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'like' ? 'bg-rose-500/20 text-rose-500' :
                                notif.type === 'follow' ? 'bg-biolum/20 text-biolum' :
                                    notif.type === 'system' ? 'bg-purple-500/20 text-purple-500' :
                                        'bg-emerald-500/20 text-emerald-500'
                                }`}>
                                {notif.type === 'like' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>}
                                {notif.type === 'follow' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15a7.125 7.125 0 0114.25 0v.004a3.375 3.375 0 010 6.75v0A3.75 3.75 0 0118 25.5H6a3.75 3.75 0 01-3.75-3.75V15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                                {notif.type === 'mention' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" /></svg>}
                                {notif.type === 'system' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /></svg>}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-ocean-text">
                                    <span className="font-bold text-ocean-text hover:underline cursor-pointer">{notif.user}</span>{' '}
                                    {notif.action}
                                </p>
                                {notif.content && <p className="text-sm text-ocean-text-dim mt-0.5 font-medium">{notif.content}</p>}
                                <p className="text-xs text-ocean-text-muted mt-1.5">{notif.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

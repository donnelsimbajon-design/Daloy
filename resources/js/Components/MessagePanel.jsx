import React from 'react';
import { useLanguage } from '@/Contexts/LanguageContext';

const messages = [
    { id: 1, user: 'Kai Storm', message: 'Bro, the waves are insane today! 🌊', time: '2m', unread: true, avatar: 'KS', bg: 'bg-blue-600' },
    { id: 2, user: 'Ocean_Lover', message: 'Did you see the new coral garden photos?', time: '1h', unread: false, avatar: 'OL', bg: 'bg-emerald-600' },
    { id: 3, user: 'TechCurrent', message: 'Meeting moved to 3pm at the Reef.', time: '3h', unread: false, avatar: 'TC', bg: 'bg-indigo-600' },
    { id: 4, user: 'Marina Cruz', message: 'Thanks for the tips on the gear!', time: '1d', unread: false, avatar: 'MC', bg: 'bg-orange-600' },
];

export default function MessagePanel({ isOpen, onClose }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose}></div>

            {/* Panel */}
            <div className="absolute top-16 right-4 mt-2 w-full max-w-sm bg-ocean-deep border border-ocean-border rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-ocean-border flex justify-between items-center bg-ocean-card/60 backdrop-blur-md sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-ocean-text tracking-wide">{t('Messages')}</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-1.5 rounded-full text-ocean-text-dim hover:bg-ocean-card hover:text-ocean-text transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`p-4 rounded-xl transition-all duration-200 cursor-pointer border border-transparent group relative overflow-hidden ${msg.unread
                                ? 'bg-ocean-card border-biolum/20'
                                : 'bg-ocean-card/40 hover:bg-ocean-card border-ocean-border/50 hover:border-ocean-border'
                                }`}
                        >
                            {/* Unread Indicator Dot */}
                            {msg.unread && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-biolum animate-pulse"></div>
                            )}

                            <div className="flex gap-4 items-start">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full ${msg.bg} flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-ocean-deep`}>
                                    {msg.avatar}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`text-sm font-bold truncate ${msg.unread ? 'text-ocean-text' : 'text-ocean-text-bright'}`}>
                                            {msg.user}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-snug line-clamp-2 ${msg.unread ? 'text-ocean-text-bright' : 'text-ocean-text-muted'}`}>
                                        {msg.message}
                                    </p>
                                    <p className="text-[10px] text-ocean-text-dim mt-2 font-medium">{msg.time} {t('ago')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-ocean-border bg-ocean-card/30 backdrop-blur-sm">
                    <button className="w-full py-2.5 rounded-xl bg-biolum/10 text-biolum font-semibold text-sm hover:bg-biolum hover:text-ocean-text transition-all group">
                        {t('View all messages')}
                        <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </button>
                </div>
            </div>
        </>
    );
}

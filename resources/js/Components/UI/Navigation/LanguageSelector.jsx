import React from 'react';
import { useLanguage } from '@/Contexts/LanguageContext';

const languages = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
    // { code: 'es', name: 'Español', flag: '🇪🇸' },
    // { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector({ isOpen, onClose }) {
    const { language, changeLanguage } = useLanguage();

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose}></div>

            <div className="absolute top-16 right-0 md:right-32 mt-2 w-56 bg-ocean-deep border border-ocean-border rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="py-1">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                changeLanguage(lang.code);
                                onClose();
                            }}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-ocean-card/50 transition-colors ${language === lang.code ? 'bg-biolum/10 text-ocean-text' : 'text-ocean-text'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <span className="text-lg">{lang.flag}</span>
                                <span className="text-sm font-medium">{lang.name}</span>
                            </span>
                            {language === lang.code && (
                                <svg className="w-4 h-4 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // Nav
        'Deep Flow': 'Deep Flow',
        'Explore': 'Explore',
        'Schools': 'Schools',
        'Voyagers': 'Voyagers',
        'Events': 'Events',
        'River Flow': 'River Flow',
        'Ripples': 'Ripples',
        'Navigate the deep': 'Navigate the deep',
        'Pro Voyager': 'Pro Voyager',
        'Search the tide...': 'Search the tide...',

        // Headers
        'Messages': 'Messages',
        'Notifications': 'Notifications',
        'Mark all as read': 'Mark all as read',
        'View all messages': 'View all messages',
        'View all notifications': 'View all notifications',

        // Content
        'Your main feed': 'Your main feed',
        'Discover new currents': 'Discover new currents',
        'Your groups & communities': 'Your groups & communities',
        'Friends & connections': 'Friends & connections',
        'Meetups & live sessions': 'Meetups & live sessions',
        'Your saved notes & bookmarks': 'Your saved notes & bookmarks',
        'Notifications & activity': 'Notifications & activity',

        // Time
        'ago': 'ago',
        'just now': 'just now',

        // Auth
        'Sign out': 'Sign out',
    },
    tl: {
        // Nav
        'Deep Flow': 'Malalim na Agos',
        'Explore': 'Tuklasin',
        'Schools': 'Mga Paaralan',
        'Voyagers': 'Mga Manlalakbay',
        'Events': 'Mga Kaganapan',
        'River Flow': 'Daloy ng Ilog',
        'Ripples': 'Mga Alon',
        'Navigate the deep': 'Maglayag sa kailaliman',
        'Pro Voyager': 'Pro Manlalakbay',
        'Search the tide...': 'Maghanap sa alon...',

        // Headers
        'Messages': 'Mga Mensahe',
        'Notifications': 'Mga Abiso',
        'Mark all as read': 'Markahang nabasa na lahat',
        'View all messages': 'Tingnan lahat ng mensahe',
        'View all notifications': 'Tingnan lahat ng abiso',

        // Content
        'Your main feed': 'Ang iyong pangunahing daloy',
        'Discover new currents': 'Tumuklas ng mga bagong agos',
        'Your groups & communities': 'Ang iyong mga grupo at komunidad',
        'Friends & connections': 'Mga kaibigan at koneksyon',
        'Meetups & live sessions': 'Mga pagkikita at live session',
        'Your saved notes & bookmarks': 'Ang iyong mga naka-save na tala',
        'Notifications & activity': 'Mga abiso at aktibidad',

        // Time
        'ago': 'ang nakalipas',
        'just now': 'ngayon lang',

        // Auth
        'Sign out': 'Mag-sign out',
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    // Load saved language
    useEffect(() => {
        const savedLang = localStorage.getItem('daloy-lang');
        if (savedLang) setLanguage(savedLang);
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('daloy-lang', lang);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

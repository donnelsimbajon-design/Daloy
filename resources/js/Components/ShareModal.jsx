import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

export default function ShareModal({ isOpen, onClose, postUrl }) {
    const [view, setView] = useState('main'); // main, qr, message
    const [copied, setCopied] = useState(false);

    // Message State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setView('main');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUser(null);
            setMessage('');
            setSent(false);
        }
    }, [isOpen]);

    // Search Users
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const response = await axios.get(`/share/search-users?query=${searchQuery}`);
                    setSearchResults(response.data);
                } catch (error) {
                    console.error("Search error", error);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!selectedUser) return;
        setSending(true);
        try {
            await axios.post('/share/send', {
                recipient_id: selectedUser.id,
                post_url: postUrl,
                message: message
            });
            setSent(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Send error", error);
        } finally {
            setSending(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-sm bg-ocean-deep border border-ocean-border rounded-2xl p-6 relative animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-ocean-text-muted hover:text-ocean-text transition-colors z-10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* --- MAIN VIEW --- */}
                {view === 'main' && (
                    <>
                        <h3 className="text-lg font-bold text-ocean-text mb-6 text-center">Share to Friends</h3>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Copy Link */}
                            <button
                                onClick={handleCopy}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ocean-surface border border-ocean-border text-ocean-text group-hover:border-biolum/50 group-hover:bg-biolum/10'
                                    }`}>
                                    {copied ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-xs text-ocean-text-dim group-hover:text-ocean-text transition-colors">
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </span>
                            </button>

                            {/* QR Code */}
                            <button
                                onClick={() => setView('qr')}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-ocean-surface border border-ocean-border text-ocean-text flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                                    </svg>
                                </div>
                                <span className="text-xs text-ocean-text-dim group-hover:text-ocean-text transition-colors">QR Code</span>
                            </button>

                            {/* Message */}
                            <button
                                onClick={() => setView('message')}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-ocean-surface border border-ocean-border text-ocean-text flex items-center justify-center group-hover:border-blue-400/50 group-hover:bg-blue-400/10 transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <span className="text-xs text-ocean-text-dim group-hover:text-ocean-text transition-colors">Message</span>
                            </button>
                        </div>
                        <div className="bg-ocean-surface/50 rounded-xl p-3 flex items-center gap-3 border border-ocean-border/50">
                            <div className="flex-1 truncate text-xs text-ocean-text-muted font-mono">{postUrl}</div>
                        </div>
                    </>
                )}

                {/* --- QR VIEW --- */}
                {view === 'qr' && (
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-bold text-ocean-text mb-6">QR Code</h3>
                        <div className="bg-white p-4 rounded-xl mb-6">
                            <QRCodeSVG value={postUrl} size={200} />
                        </div>
                        <button
                            onClick={() => setView('main')}
                            className="text-sm text-ocean-text-dim hover:text-ocean-text transition-colors"
                        >
                            Back to Options
                        </button>
                    </div>
                )}

                {/* --- MESSAGE VIEW --- */}
                {view === 'message' && (
                    <div className="flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setView('main')} className="text-ocean-text-dim hover:text-ocean-text">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-bold text-ocean-text">Send to Friend</h3>
                        </div>

                        {!sent ? (
                            <>
                                {/* User Search */}
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search people..."
                                        className="w-full bg-ocean-surface border border-ocean-border rounded-xl px-4 py-2.5 text-sm text-ocean-text focus:outline-none focus:ring-2 focus:ring-biolum/20"
                                    />
                                    {searchResults.length > 0 && !selectedUser && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-ocean-deep border border-ocean-border rounded-xl z-20 max-h-48 overflow-y-auto">
                                            {searchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => { setSelectedUser(user); setSearchQuery(''); setSearchResults([]); }}
                                                    className="w-full text-left px-4 py-3 hover:bg-ocean-surface flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-ocean-surface border border-ocean-border flex items-center justify-center text-xs font-bold text-ocean-text">
                                                        {user.name && user.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-ocean-text font-medium">{user.name}</p>
                                                        <p className="text-xs text-ocean-text-dim">@{user.username}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected User */}
                                {selectedUser ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 p-3 bg-ocean-surface/30 rounded-xl mb-4 border border-ocean-border/30">
                                            <div className="w-10 h-10 rounded-full bg-biolum/20 flex items-center justify-center text-sm font-bold text-biolum">
                                                {selectedUser.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-ocean-text">{selectedUser.name}</p>
                                                <button
                                                    onClick={() => setSelectedUser(null)}
                                                    className="text-xs text-rose-400 hover:text-rose-300"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Write a message..."
                                            className="flex-1 w-full bg-ocean-surface/50 border border-ocean-border rounded-xl p-3 text-sm text-ocean-text focus:outline-none resize-none mb-4"
                                        />

                                        <button
                                            onClick={handleSend}
                                            disabled={sending}
                                            className="w-full py-3 bg-biolum text-white font-bold rounded-xl hover:bg-biolum-bright transition-colors disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-ocean-text-muted opacity-50">
                                        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                        </svg>
                                        <p className="text-sm">Search for a friend to message</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-emerald-400">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-ocean-text mb-1">Sent!</h3>
                                <p className="text-sm text-ocean-text-dim text-center">Your message has been sent to {selectedUser?.name}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

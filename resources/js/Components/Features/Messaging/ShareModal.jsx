import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const iconClass = 'h-5 w-5 shrink-0';
const actionClass = 'flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-ocean-border bg-ocean-surface/60 px-2 text-ocean-text transition-colors hover:bg-ocean-hover focus-visible:outline-2 focus-visible:outline-offset-2';

export default function ShareModal({ isOpen, onClose, postUrl, postId }) {
    const [view, setView] = useState('main');
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setView('main');
        setCopied(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setMessage('');
        setSent(false);
        setError('');
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const closeOnEscape = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || view !== 'message' || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        let active = true;
        const delay = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await axios.get('/share/search-users', {
                    params: { query: searchQuery.trim() },
                });
                if (active) setSearchResults(Array.isArray(data) ? data : []);
            } catch {
                if (active) {
                    setError('Could not search classmates. Please try again.');
                    setSearchResults([]);
                }
            } finally {
                if (active) setSearching(false);
            }
        }, 350);
        return () => { active = false; clearTimeout(delay); };
    }, [isOpen, searchQuery, view]);

    if (!isOpen) return null;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setError('');
        } catch {
            setError('Copy is not available here. Select the link below to copy it manually.');
        }
    };

    const sendMessage = async () => {
        if (!selectedUser || sending) return;
        setSending(true);
        setError('');
        try {
            await axios.post('/share/send', {
                recipient_id: selectedUser.id,
                post_id: postId || null,
                post_url: postUrl,
                message: message.trim(),
            });
            setSent(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Message could not be sent. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            role="presentation"
            onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label="Share post"
                className="relative flex max-h-[min(90dvh,650px)] w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-ocean-border bg-ocean-card text-ocean-text shadow-2xl"
            >
                <header className="flex items-center justify-between gap-3 border-b border-ocean-divider px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ocean-text-muted">Daloy · Share</p>
                        <h2 className="mt-1 text-lg font-bold tracking-tight">{view === 'qr' ? 'Scan to open' : view === 'message' ? 'Send to a classmate' : 'Share this post'}</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close share dialog"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ocean-border text-ocean-text-muted hover:bg-ocean-surface hover:text-ocean-text">
                        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6 18 18M18 6 6 18" /></svg>
                    </button>
                </header>

                <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
                    {view === 'main' && (
                        <>
                            <p className="mb-5 text-sm leading-relaxed text-ocean-text-muted">Share a link, show a QR code, or send this post directly to someone.</p>
                            <div className="grid grid-cols-3 gap-2.5" aria-label="Share options">
                                <button type="button" onClick={copyLink} className={actionClass} aria-label="Copy Link">
                                    <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    <span className="text-xs font-semibold">{copied ? 'Copied' : 'Copy Link'}</span>
                                </button>
                                <button type="button" onClick={() => setView('qr')} className={actionClass} aria-label="QR Code">
                                    <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zm5 0h2m-2 5h2v2h-2m-5-1v1h2"/>
                                    </svg>
                                    <span className="text-xs font-semibold">QR Code</span>
                                </button>
                                <button type="button" onClick={() => { setError(''); setView('message'); }} className={actionClass} aria-label="Message">
                                    <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <rect x="3" y="5" width="18" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6"/>
                                    </svg>
                                    <span className="text-xs font-semibold">Message</span>
                                </button>
                            </div>
                            <label htmlFor="daloy-share-url" className="mt-6 mb-2 block text-xs font-semibold text-ocean-text-muted">Post link</label>
                            <input id="daloy-share-url" readOnly value={postUrl} onFocus={event => event.target.select()}
                                className="w-full min-h-[44px] rounded-xl border border-ocean-border bg-ocean-surface px-3 text-xs text-ocean-text" />
                            {copied && <p role="status" className="mt-3 text-xs text-ocean-text-muted">Link copied. You can paste it anywhere.</p>}
                        </>
                    )}
                    {view === 'qr' && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-center text-sm text-ocean-text-muted">Scan this code to open the original post.</p>
                            {/* The white square is intentionally needed for reliable QR scanning, not a lightbox background. */}
                            <div className="rounded-2xl border border-ocean-border bg-white p-4" aria-label="Post QR code">
                                <QRCodeSVG value={postUrl} size={198} fgColor="#000000" bgColor="#ffffff" />
                            </div>
                            <button type="button" onClick={() => setView('main')}
                                className="min-h-[44px] rounded-xl border border-ocean-border px-5 text-sm font-semibold text-ocean-text hover:bg-ocean-hover">Back to sharing</button>
                        </div>
                    )}
                    {view === 'message' && (sent ? (
                        <div className="flex flex-col items-center gap-3 py-7 text-center" role="status">
                            <svg className="h-10 w-10 text-ocean-text" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6"/>
                            </svg>
                            <h3 className="text-lg font-bold">Message sent</h3>
                            <p className="text-sm text-ocean-text-muted">Your post has been shared with {selectedUser?.name}.</p>
                            <button type="button" onClick={onClose} className="mt-3 min-h-[44px] rounded-xl bg-ocean-text px-6 text-sm font-semibold text-ocean-deep">Done</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button type="button" onClick={() => { setView('main'); setError(''); }}
                                className="min-h-[44px] text-xs font-semibold text-ocean-text-muted hover:text-ocean-text">Back to sharing options</button>
                            {!selectedUser ? (
                                <>
                                    <label htmlFor="daloy-share-search" className="block text-sm font-semibold">Find a classmate</label>
                                    <input id="daloy-share-search" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setError(''); }}
                                        placeholder="Search by name or username" autoFocus
                                        className="min-h-[46px] w-full rounded-xl border border-ocean-border bg-ocean-surface px-4 text-sm text-ocean-text" />
                                    {searching && <p role="status" className="text-xs text-ocean-text-muted">Searching…</p>}
                                    {searchResults.length > 0 && (
                                        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ocean-border p-1" aria-label="People found">
                                            {searchResults.map(person => (
                                                <button key={person.id} type="button"
                                                    onClick={() => { setSelectedUser(person); setSearchQuery(''); setSearchResults([]); }}
                                                    className="flex min-h-[50px] w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-ocean-hover">
                                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean-surface text-xs font-bold text-ocean-text">{person.name?.slice(0,1)}</span>
                                                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{person.name}</span><span className="block truncate text-xs text-ocean-text-muted">@{person.username}</span></span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchQuery.trim().length < 2 && <p className="text-xs text-ocean-text-muted">Type at least two letters to search.</p>}
                                    {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && !error && (
                                        <p className="text-xs text-ocean-text-muted">No matching classmates found.</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 rounded-xl border border-ocean-border bg-ocean-surface p-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-full border border-ocean-border text-sm font-bold">{selectedUser.name?.slice(0,1)}</span>
                                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{selectedUser.name}</span>
                                        <button type="button" onClick={() => setSelectedUser(null)} className="min-h-[44px] px-2 text-xs font-semibold text-ocean-text-muted hover:text-ocean-text">Change</button>
                                    </div>
                                    <label htmlFor="daloy-share-message" className="block text-sm font-semibold">Add a message (optional)</label>
                                    <textarea id="daloy-share-message" value={message} onChange={event => setMessage(event.target.value)}
                                        maxLength={500} rows={3} placeholder="Say something about this post…"
                                        className="w-full resize-y rounded-xl border border-ocean-border bg-ocean-surface p-3 text-sm text-ocean-text" />
                                    <button type="button" disabled={sending} onClick={sendMessage}
                                        className="min-h-[46px] w-full rounded-xl bg-ocean-text px-4 text-sm font-bold text-ocean-deep hover:opacity-90 disabled:opacity-50">{sending ? 'Sending…' : 'Send post'}</button>
                                </>
                            )}
                        </div>
                    ))}
                    {error && <p role="alert" className="mt-4 rounded-xl border border-ocean-border bg-ocean-surface px-3 py-2 text-xs text-ocean-text">{error}</p>}
                </div>
            </section>
        </div>
    );
}

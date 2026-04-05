import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    X, ThumbsUp, ThumbsDown, Sparkles,
    Info, AlertTriangle, AlertOctagon, Wrench, Rocket
} from 'lucide-react';
import axios from 'axios';

export default function GlobalAnnouncementPopup() {
    const [announcement, setAnnouncement] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voted, setVoted] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    let inertiaAnnouncements = [];
    try {
        const page = usePage();
        inertiaAnnouncements = page?.props?.announcements || [];
    } catch { /* admin layout fallback */ }

    useEffect(() => {
        if (inertiaAnnouncements.length > 0) {
            const localDismissed = JSON.parse(localStorage.getItem('daloy_dismissed_announcements') || '[]');
            const found = inertiaAnnouncements.find(ann => !localDismissed.includes(ann.id));
            if (found) { setAnnouncement(found); return; }
        }
        const fetchLive = async () => {
            try {
                const res = await axios.get('/api/announcements/live');
                if (res.data?.announcement) {
                    const ld = JSON.parse(localStorage.getItem('daloy_dismissed_announcements') || '[]');
                    if (!ld.includes(res.data.announcement.id)) setAnnouncement(res.data.announcement);
                }
            } catch { /* silent */ }
        };
        fetchLive();
        const poll = setInterval(fetchLive, 10000);
        return () => clearInterval(poll);
    }, [inertiaAnnouncements?.length]);

    if (!announcement) return null;

    const handleDismiss = async () => {
        const ld = JSON.parse(localStorage.getItem('daloy_dismissed_announcements') || '[]');
        if (!ld.includes(announcement.id)) localStorage.setItem('daloy_dismissed_announcements', JSON.stringify([...ld, announcement.id]));
        try { await axios.post(`/api/announcements/${announcement.id}/interact`, { vote: voted || 'none', feedback, dismissed: true }); } catch {}
        setAnnouncement(null); setVoted(null); setFeedback('');
    };

    const handleVote = async (vote) => {
        if (isSubmitting) return;
        setIsSubmitting(true); setVoted(vote);
        try { await axios.post(`/api/announcements/${announcement.id}/interact`, { vote, feedback, dismissed: false }); } catch {}
        setIsSubmitting(false);
    };

    const handleFeedbackSubmit = async () => {
        if (isSubmitting || !feedback.trim()) return;
        setIsSubmitting(true);
        try {
            await axios.post(`/api/announcements/${announcement.id}/interact`, { vote: voted || 'none', feedback, dismissed: false });
            setShowSuccess(true);
            setTimeout(() => { handleDismiss(); setShowSuccess(false); }, 2000);
        } catch {}
        setIsSubmitting(false);
    };

    // ── Icon per type ──
    const typeConfig = {
        info:        { Icon: Info,           label: 'Information' },
        warning:     { Icon: AlertTriangle,  label: 'Warning' },
        critical:    { Icon: AlertOctagon,   label: 'Critical Alert' },
        maintenance: { Icon: Wrench,         label: 'Maintenance' },
        feature:     { Icon: Rocket,         label: 'New Feature' },
    };
    const { Icon: TypeIcon, label: typeLabel } = typeConfig[announcement.type] || typeConfig.info;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)',
            padding: 16, animation: 'annFadeIn 0.3s ease-out',
        }}>
            <style>{`
                @keyframes annFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes annSlide { from { opacity:0; transform:scale(0.92) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
                @keyframes annIconPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
                .ann-vote-btn { transition: all 0.2s; }
                .ann-vote-btn:hover { transform: translateY(-2px); }
                .ann-vote-btn.voted-up { background: rgba(34,197,94,0.15) !important; border-color: rgba(34,197,94,0.5) !important; }
                .ann-vote-btn.voted-down { background: rgba(239,68,68,0.15) !important; border-color: rgba(239,68,68,0.5) !important; }
            `}</style>

            <div style={{
                display: 'flex', width: '100%', maxWidth: 820, minHeight: 440,
                borderRadius: 20, overflow: 'hidden',
                background: '#0c0c0f',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
                animation: 'annSlide 0.45s cubic-bezier(0.22,1,0.36,1)',
            }}>
                {/* ───── LEFT: Icon Panel ───── */}
                <div style={{
                    width: '38%', minWidth: 240, position: 'relative',
                    background: 'linear-gradient(160deg, #141418 0%, #1a1a22 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '40px 24px',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {/* Subtle grid pattern */}
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.03,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }} />
                    {/* Glow behind icon */}
                    <div style={{
                        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                    }} />

                    {/* Rotated type label */}
                    <div style={{
                        position: 'absolute', top: '50%', left: 14,
                        transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left center',
                        color: 'rgba(255,255,255,0.1)', fontWeight: 900, fontSize: 18,
                        letterSpacing: '0.35em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{announcement.type}</div>

                    {/* Main icon */}
                    <div style={{
                        background: 'rgba(255,255,255,0.06)', borderRadius: '50%', padding: 28,
                        border: '1px solid rgba(255,255,255,0.08)',
                        animation: 'annIconPulse 3s ease-in-out infinite',
                    }}>
                        <TypeIcon size={72} color="#ffffff" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.15))' }} />
                    </div>

                    {/* Type label */}
                    <p style={{
                        marginTop: 20, color: 'rgba(255,255,255,0.35)',
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    }}>{typeLabel}</p>

                    {/* Corner accents (no emoji) */}
                    <div style={{ position: 'absolute', top: 20, right: 20, width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: 24, left: 20, width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* ───── RIGHT: Content Panel ───── */}
                <div style={{
                    flex: 1, padding: '36px 32px 28px', display: 'flex', flexDirection: 'column',
                    background: '#111114', position: 'relative',
                }}>
                    {/* Close */}
                    <button onClick={handleDismiss} style={{
                        position: 'absolute', top: 14, right: 14,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <X size={16} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                    </button>

                    {/* Title */}
                    <h2 style={{
                        fontSize: 28, fontWeight: 800, color: '#ffffff',
                        lineHeight: 1.15, marginBottom: 14, paddingRight: 36,
                        letterSpacing: '-0.02em',
                    }}>{announcement.title}</h2>

                    {/* Message */}
                    <div style={{
                        color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7,
                        flex: 1, whiteSpace: 'pre-wrap', fontWeight: 400, marginBottom: 20,
                    }}>{announcement.message}</div>

                    {/* ── Success overlay ── */}
                    {showSuccess && (
                        <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(17,17,20,0.97)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10, borderRadius: '0 20px 20px 0',
                        }}>
                            <Sparkles size={40} color="#ffffff" />
                            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 12 }}>Thank you!</p>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your feedback has been recorded</p>
                        </div>
                    )}

                    {/* ── Voting ── */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
                        <p style={{
                            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                            textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10,
                        }}>What do you think about this update?</p>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                            <button
                                className={`ann-vote-btn ${voted === 'upvote' ? 'voted-up' : ''}`}
                                onClick={() => handleVote('upvote')} disabled={isSubmitting}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                                    cursor: 'pointer', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.6)',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                <ThumbsUp size={16} /> AWESOME
                            </button>
                            <button
                                className={`ann-vote-btn ${voted === 'downvote' ? 'voted-down' : ''}`}
                                onClick={() => handleVote('downvote')} disabled={isSubmitting}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                                    cursor: 'pointer', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.6)',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                <ThumbsDown size={16} /> NOT GOOD
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text" value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Share your thoughts..."
                                onKeyDown={e => e.key === 'Enter' && handleFeedbackSubmit()}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                                    padding: '11px 14px', fontSize: 13, fontWeight: 400,
                                    color: '#fff', outline: 'none', transition: 'border-color 0.2s',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={isSubmitting || !feedback.trim()}
                                style={{
                                    background: feedback.trim() ? '#fff' : 'rgba(255,255,255,0.06)',
                                    color: feedback.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                                    border: 'none', borderRadius: 10, padding: '11px 18px',
                                    fontWeight: 700, fontSize: 11, cursor: feedback.trim() ? 'pointer' : 'not-allowed',
                                    textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.2s',
                                }}
                            >Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    X, ThumbsUp, ThumbsDown, Sparkles,
    Info, AlertTriangle, AlertOctagon, Wrench, Rocket, Send
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
        if (!ld.includes(announcement.id))
            localStorage.setItem('daloy_dismissed_announcements', JSON.stringify([...ld, announcement.id]));
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

    // ── Type config ──
    const typeConfig = {
        info:        { Icon: Info,          label: 'Information', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
        warning:     { Icon: AlertTriangle, label: 'Warning',     color: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
        critical:    { Icon: AlertOctagon,  label: 'Critical',    color: '#f87171', glow: 'rgba(248,113,113,0.15)' },
        maintenance: { Icon: Wrench,        label: 'Maintenance', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
        feature:     { Icon: Rocket,        label: 'New Feature', color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
    };
    const { Icon: TypeIcon, label: typeLabel, color: typeColor, glow: typeGlow } =
        typeConfig[announcement.type] || typeConfig.info;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
            padding: '12px',
            animation: 'annFadeIn 0.3s ease-out',
        }}>
            <style>{`
                @keyframes annFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes annSlide { from { opacity:0; transform:scale(0.93) translateY(24px) } to { opacity:1; transform:scale(1) translateY(0) } }
                @keyframes annIconPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } }
                .ann-vote-btn { transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
                .ann-vote-btn:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08) !important; }
                .ann-vote-btn.voted-up { background: rgba(34,197,94,0.15) !important; border-color: rgba(34,197,94,0.4) !important; color: #4ade80 !important; }
                .ann-vote-btn.voted-down { background: rgba(239,68,68,0.15) !important; border-color: rgba(239,68,68,0.4) !important; color: #f87171 !important; }
            `}</style>

            {/* ── Card — single column on mobile, two-column on desktop ── */}
            <div style={{
                width: '100%', maxWidth: 780,
                maxHeight: '90dvh',
                borderRadius: 20, overflow: 'hidden',
                background: '#0e0e12',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                animation: 'annSlide 0.4s cubic-bezier(0.22,1,0.36,1)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
            }}>

                {/* ── Top accent bar ── */}
                <div style={{
                    height: 4, width: '100%',
                    background: `linear-gradient(90deg, transparent 0%, ${typeColor} 40%, ${typeColor} 60%, transparent 100%)`,
                    opacity: 0.7,
                }} />

                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: typeGlow,
                        border: `1px solid ${typeColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'annIconPulse 3s ease-in-out infinite',
                    }}>
                        <TypeIcon size={26} color={typeColor} strokeWidth={1.8} />
                    </div>

                    {/* Type + title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 10, fontWeight: 700, color: typeColor,
                            textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4,
                        }}>{typeLabel}</p>
                        <h2 style={{
                            fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 800, color: '#ffffff',
                            lineHeight: 1.2, letterSpacing: '-0.02em',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>{announcement.title}</h2>
                    </div>

                    {/* Close */}
                    <button onClick={handleDismiss} style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', alignSelf: 'flex-start',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <X size={16} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                    </button>
                </div>

                {/* ── Message body — scrollable on small screens ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '20px',
                    minHeight: 0,
                }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: 1.75, whiteSpace: 'pre-wrap', fontWeight: 400,
                    }}>{announcement.message}</p>
                </div>

                {/* ── Success overlay ── */}
                {showSuccess && (
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(14,14,18,0.97)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, borderRadius: 20,
                    }}>
                        <Sparkles size={40} color={typeColor} />
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 14 }}>Thank you!</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your feedback has been recorded</p>
                    </div>
                )}

                {/* ── Voting + Feedback ── */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    padding: '16px 20px 20px',
                    flexShrink: 0,
                    background: 'rgba(0,0,0,0.2)',
                }}>
                    <p style={{
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                        textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10,
                    }}>What do you think?</p>

                    {/* Vote buttons */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <button
                            className={`ann-vote-btn ${voted === 'upvote' ? 'voted-up' : ''}`}
                            onClick={() => handleVote('upvote')} disabled={isSubmitting}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '10px 12px', borderRadius: 12,
                                cursor: 'pointer', fontWeight: 700, fontSize: 12,
                                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em',
                            }}
                        >
                            <ThumbsUp size={15} /> Awesome
                        </button>
                        <button
                            className={`ann-vote-btn ${voted === 'downvote' ? 'voted-down' : ''}`}
                            onClick={() => handleVote('downvote')} disabled={isSubmitting}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '10px 12px', borderRadius: 12,
                                cursor: 'pointer', fontWeight: 700, fontSize: 12,
                                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em',
                            }}
                        >
                            <ThumbsDown size={15} /> Not Good
                        </button>
                    </div>

                    {/* Feedback input */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text" value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Share your thoughts..."
                            onKeyDown={e => e.key === 'Enter' && handleFeedbackSubmit()}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                                padding: '10px 14px', fontSize: 13, fontWeight: 400,
                                color: '#fff', outline: 'none', transition: 'border-color 0.2s',
                                minWidth: 0,
                            }}
                            onFocus={e => { e.target.style.borderColor = typeColor + '60'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        />
                        <button
                            onClick={handleFeedbackSubmit}
                            disabled={isSubmitting || !feedback.trim()}
                            style={{
                                background: feedback.trim() ? '#fff' : 'rgba(255,255,255,0.06)',
                                color: feedback.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                                border: 'none', borderRadius: 10, padding: '10px 16px',
                                fontWeight: 700, fontSize: 11, cursor: feedback.trim() ? 'pointer' : 'not-allowed',
                                textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                            }}
                        >
                            <Send size={13} /> Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

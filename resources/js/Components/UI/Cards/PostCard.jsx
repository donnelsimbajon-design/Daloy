import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage, Link } from '@inertiajs/react';
import axios from 'axios';
import SafeMediaImage from '@/Components/UI/SafeMediaImage';
import PostActions from '@/Components/Features/Posts/PostActions';
import CommentsSection from '@/Components/Features/Comments/CommentsSection';
import ShareModal from '@/Components/Features/Messaging/ShareModal';
import { Globe2, Users, Lock, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PostCard({ post }) {
    const currentUser = usePage().props?.auth?.user;
    const isOwner = currentUser?.id === post.user?.id;
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [editVisibility, setEditVisibility] = useState(post.visibility || 'public');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Interaction States
    const [isLiked, setIsLiked] = useState(post.liked_by_user);
    const [reactionsCount, setReactionsCount] = useState(post.reactions_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(Boolean(post.is_bookmarked));
    const [isReposted, setIsReposted] = useState(Boolean(post.is_reposted || (post.repost_of_id && post.user_id === currentUser?.id)));
    const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
    const [repostBusy, setRepostBusy] = useState(false);
    const [repostNotice, setRepostNotice] = useState('');
    const [pollError, setPollError] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDetails, setReportDetails] = useState('');
    const [reportBusy, setReportBusy] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportError, setReportError] = useState('');
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Poll state
    const [pollData, setPollData] = useState(post.poll || null);
    const [votedOptionId, setVotedOptionId] = useState(post.poll?.user_voted_option_id || null);

    const menuRef = useRef(null);
    const touchStartX = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Lightbox keyboard navigation
    const handleLightboxKey = useCallback((e) => {
        if (lightboxIndex === null) return;
        if (e.key === 'Escape') setLightboxIndex(null);
        if (e.key === 'ArrowRight') setLightboxIndex(prev => Math.min(prev + 1, (post.media || []).length - 1));
        if (e.key === 'ArrowLeft') setLightboxIndex(prev => Math.max(prev - 1, 0));
    }, [lightboxIndex, post.media]);

    useEffect(() => {
        if (lightboxIndex !== null) {
            document.addEventListener('keydown', handleLightboxKey);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('keydown', handleLightboxKey);
            document.body.style.overflow = '';
        };
    }, [lightboxIndex, handleLightboxKey]);

    const handleLike = async () => {
        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = reactionsCount;

        setIsLiked(!isLiked);
        setReactionsCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            const response = await axios.post(`/posts/${post.id}/like`);
            // Sync with server state — backend returns "reacted" and "reaction_counts"
            setIsLiked(response.data.reacted);
            setReactionsCount(response.data.reaction_counts?.total ?? previousCount);
        } catch (error) {
            // Revert on error
            setIsLiked(previousLiked);
            setReactionsCount(previousCount);
            console.error("Error liking post:", error);
        }
    };

    const handlePollVote = async (optionId) => {
        if (!pollData) return;
        setPollError('');
        if (pollData.expires_at && new Date(pollData.expires_at).getTime() <= Date.now()) {
            setPollError('This poll has closed.');
            return;
        }
        // Optimistic update
        const prevData = pollData;
        const prevVoted = votedOptionId;
        setVotedOptionId(optionId);
        try {
            const response = await axios.post(`/polls/${pollData.id}/vote`, { option_id: optionId });
            setVotedOptionId(response.data.voted_option_id);
            setPollData(prev => ({
                ...prev,
                user_voted: true,
                user_voted_option_id: response.data.voted_option_id,
                total_votes: response.data.total_votes,
                options: response.data.options,
            }));
        } catch (error) {
            // Revert on error
            setVotedOptionId(prevVoted);
            setPollData(prevData);
            console.error('Vote error:', error);
            setPollError(error.response?.data?.message || 'Your vote could not be saved. Please try again.');
        }
    };

    const handleUpdate = () => {
        router.put(`/posts/${post.id}`, {
            content: editContent,
            visibility: editVisibility,
            location_tag: post.location_tag || '',
            flow_velocity: post.flow_velocity || 'steady',
        }, {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleDelete = () => {
        router.delete(`/posts/${post.id}`, {
            onSuccess: () => setShowDeleteConfirm(false),
        });
    };

    const toggleRepost = async () => {
        if (repostBusy) return;
        setRepostBusy(true);
        setRepostNotice('');
        try {
            const originalId = post.repost_of_id || post.id;
            const { data } = await axios.post(`/posts/${originalId}/repost`);
            setIsReposted(Boolean(data.reposted));
            setRepostsCount(data.reposts_count || 0);
            setRepostNotice(data.reposted ? 'Reposted to your profile.' : 'Repost removed.');
            router.reload({ only: ['posts'], preserveState: true, preserveScroll: true });
        } catch (error) {
            setRepostNotice(error.response?.status === 403
                ? 'Only public posts can be reposted.'
                : 'Unable to repost. Please try again.');
        } finally {
            setRepostBusy(false);
        }
    };

    const toggleBookmark = async () => {
        setShowMenu(false);
        try {
            const response = await axios.post(`/posts/${post.id}/bookmark`);
            setIsBookmarked(Boolean(response.data.bookmarked));
        } catch (error) {
            console.error('Could not update bookmark:', error);
            window.alert('Unable to save this post. Please try again.');
        }
    };

    const submitReport = async (event) => {
        event.preventDefault();
        setReportBusy(true);
        setReportError('');
        try {
            await axios.post(`/posts/${post.id}/report`, {
                reason: reportReason,
                details: reportDetails,
            });
            setReportSubmitted(true);
        } catch (error) {
            setReportError(error.response?.data?.message || 'Unable to submit your report. Please try again.');
        } finally {
            setReportBusy(false);
        }
    };

    // Build display data
    const author = post.user || {};
    const initials = author.name
        ? author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';
    const timeAgo = getTimeAgo(post.created_at);
    const mediaItems = post.media || [];
    const originalPost = post.repost_of || post.repostOf || null;
    const flowVelocity = post.flow_velocity || 'steady';
    const pollClosed = Boolean(pollData?.expires_at && new Date(pollData.expires_at).getTime() <= Date.now());

    const visibilityIcon = {
        public: <Globe2 className="w-3.5 h-3.5 inline text-ocean-text-dim" />,
        followers: <Users className="w-3.5 h-3.5 inline text-ocean-text-dim" />,
        private: <Lock className="w-3.5 h-3.5 inline text-ocean-text-dim" />,
    };

    return (
        <div data-post-id={post.id} className="daloy-post-card bg-ocean-card/70 backdrop-blur-sm rounded-[18px] border border-ocean-divider hover:border-ocean-hover transition-all duration-300 group shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.03)] hover:-translate-y-[1px]">
            {/* Header */}
            <div className="flex min-w-0 items-start justify-between gap-3 px-4 pt-4 pb-0">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href={`/users/${author.id}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-ocean-surface flex items-center justify-center text-ocean-text-dim/50 ring-2 ring-ocean-divider overflow-hidden hover:ring-biolum/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                            {author.profile_picture ? (
                                <img src={author.profile_picture} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-6 h-6 mt-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </div>
                    </Link>
                    <div className="min-w-0">
                        <Link href={`/users/${author.id}`} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 group">
                            <h3 className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors tracking-[-0.01em]">{author.name || 'Unknown'}</h3>
                            {author.username && (
                                <span className="max-w-[180px] truncate text-xs text-ocean-text-dim/70 group-hover:text-ocean-text-muted transition-colors font-normal">@{author.username}</span>
                            )}
                        </Link>
                        {post.school && (
                            <Link href={`/schools/${post.school.id}`} className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 bg-biolum/8 border border-biolum/15 rounded-full hover:bg-biolum/15 transition-all group/school">
                                {post.school.profile_image ? (
                                    <img src={post.school.profile_image} alt="" className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-biolum/20" />
                                ) : (
                                    <svg className="w-3 h-3 text-biolum" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                                )}
                                <span className="text-[10px] font-bold text-biolum group-hover/school:text-biolum-bright transition-colors">{post.school.name}</span>
                            </Link>
                        )}
                        <p className="text-[11px] text-ocean-text-dim/60 mt-0.5 leading-tight font-normal">
                            {timeAgo}
                            {post.location_tag && ` · ${post.location_tag}`}
                            {' · '}{visibilityIcon[post.visibility] || <Globe2 className="w-3.5 h-3.5 inline text-ocean-text-dim" />}
                            <span className="ml-2 rounded-md border border-ocean-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ocean-text-dim" aria-label={`Flow state: ${flowVelocity}`}>{flowVelocity} flow</span>
                        </p>
                    </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        type="button"
                        aria-label="Post options"
                        aria-expanded={showMenu}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ocean-text-dim hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-ocean-deep border border-ocean-border rounded-xl overflow-hidden z-20">
                            {isOwner && (
                                <>
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                        Edit Post
                                    </button>
                                    <button
                                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-hover transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                        Delete Post
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={toggleBookmark}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors"
                            >
                                <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5A2.25 2.25 0 0 1 7.5 2.25h9A2.25 2.25 0 0 1 18.75 4.5V21l-6.75-4.5L5.25 21V4.5Z" />
                                </svg>
                                {isBookmarked ? 'Remove bookmark' : 'Save post'}
                            </button>
                            {!isOwner && (
                                <button type="button" onClick={() => { setShowMenu(false); setReportError(''); setShowReportModal(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                    </svg>
                                    Report Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3 pb-2">
                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-ocean-surface/60 border border-ocean-border rounded-xl text-sm text-ocean-text p-3 focus:outline-none focus:ring-2 focus:ring-biolum/40 resize-none"
                            rows={3}
                            maxLength={2000}
                        />
                        <div className="flex items-center gap-2">
                            <select
                                value={editVisibility}
                                onChange={(e) => setEditVisibility(e.target.value)}
                                className="bg-ocean-surface/60 border border-ocean-border rounded-lg px-3 py-1.5 text-xs text-ocean-text-muted focus:outline-none"
                            >
                                <option value="public">Public</option>
                                <option value="followers">Followers</option>
                                <option value="private">Private</option>
                            </select>
                            <div className="flex-1" />
                            <button
                                onClick={() => { setIsEditing(false); setEditContent(post.content || ''); }}
                                className="px-3 py-1.5 text-xs font-medium text-ocean-text-muted hover:text-ocean-text bg-ocean-surface border border-ocean-border rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-1.5 text-xs font-bold text-biolum-foreground bg-biolum rounded-lg transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ocean-text leading-[1.65] whitespace-pre-wrap">{post.content}</p>
                )}
            </div>

            {/* Poll */}
            {pollData && (
                <div className="mx-4 mb-3">
                    <div className="p-3 bg-ocean-surface/40 border border-ocean-divider rounded-xl">
                        <h4 className="text-sm font-bold text-ocean-text mb-3">{pollData.question}</h4>
                        <div className="space-y-2">
                            {(pollData.options || []).map((option) => {
                                const isVoted = votedOptionId === option.id;
                                const hasVoted = !!votedOptionId || pollClosed;
                                const pct = option.percentage || 0;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        aria-pressed={isVoted}
                                        disabled={pollClosed}
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePollVote(option.id); }}
                                        className={`relative w-full min-h-[48px] text-left rounded-xl overflow-hidden transition-all border ${
                                            isVoted
                                                ? 'border-biolum/40 bg-biolum/10'
                                                : 'border-ocean-border hover:border-biolum/30 hover:bg-biolum/5 cursor-pointer'
                                        }`}
                                    >
                                        {/* Background progress bar — shown after voting */}
                                        {hasVoted && (
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ${isVoted ? 'bg-biolum/15' : 'bg-ocean-surface/40'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        )}
                                        <div className="relative flex items-center justify-between px-4 py-2.5">
                                            <span className={`text-sm font-medium ${isVoted ? 'text-biolum' : 'text-ocean-text'}`}>
                                                {option.label}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {hasVoted && (
                                                    <span className="text-xs font-bold text-ocean-text-dim">
                                                        {pct}%
                                                    </span>
                                                )}
                                                {isVoted && (
                                                    <svg className="w-3.5 h-3.5 text-biolum" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-[11px] text-ocean-text-dim">
                                {pollData.total_votes || 0} vote{(pollData.total_votes || 0) !== 1 ? 's' : ''}
                                {pollData.expires_at && ` · Ends ${new Date(pollData.expires_at).toLocaleDateString()}`}
                            </p>
                            {pollClosed
                                ? <span className="text-[11px] text-ocean-text-muted">Poll closed</span>
                                : votedOptionId ? <span className="text-[11px] text-ocean-text-muted">Tap another option to change vote</span> : null}
                        </div>
                        {pollError && <p role="alert" className="mt-3 text-xs text-ocean-text-muted">{pollError}</p>}
                    </div>
                </div>
            )}

            {post.repost_of_id && (
                <section className="mx-4 mb-4 rounded-2xl border border-ocean-border bg-ocean-surface/50 p-4" aria-label="Original reposted post">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[.13em] text-ocean-text-dim">{author.name} reposted</p>
                    {originalPost ? (
                        <Link href={`/posts/${originalPost.id}`} className="block rounded-xl p-2 hover:bg-ocean-hover focus-visible:outline-2">
                            <p className="text-xs font-semibold text-ocean-text mb-2">{originalPost.user?.name || 'Original author'}</p>
                            {originalPost.content && <p className="whitespace-pre-wrap break-words text-sm text-ocean-text leading-relaxed line-clamp-5">{originalPost.content}</p>}
                            {originalPost.media?.[0]?.type !== 'video' && originalPost.media?.[0]?.url && (
                                <SafeMediaImage src={originalPost.media[0].url} alt="Reposted photo" className="mt-3 max-h-64 w-full rounded-xl object-contain bg-ocean-deep" />
                            )}
                            {originalPost.media?.[0]?.type === 'video' && <p className="mt-2 text-xs text-ocean-text-muted">View the original video post</p>}
                            <p className="mt-3 text-[11px] text-ocean-text-muted">View original post</p>
                        </Link>
                    ) : <p className="text-sm text-ocean-text-muted">The original post is no longer available.</p>}
                </section>
            )}

            {/* Media Gallery */}
            {mediaItems.length > 0 && (
                <div className="px-4 pb-3">
                    <div className={`grid gap-[2px] rounded-[16px] overflow-hidden border border-ocean-divider bg-ocean-surface/40 w-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] ${mediaItems.length === 1 ? 'grid-cols-1 grid-rows-1 aspect-[4/3] sm:aspect-[16/9] max-h-[600px]' :
                            mediaItems.length === 2 ? 'grid-cols-2 grid-rows-1 aspect-[4/3] sm:aspect-[16/9]' :
                                mediaItems.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[4/3] sm:aspect-[16/9]' :
                                    'grid-cols-2 grid-rows-2 aspect-[4/3]' // 4 items
                        }`}>
                        {mediaItems.slice(0, 4).map((media, index) => (
                            <div
                                key={media.id || index}
                                className={`relative w-full h-full min-h-0 overflow-hidden bg-ocean-deep/50 ${mediaItems.length === 3 && index === 0 ? 'row-span-2' : ''}`}
                            >
                                {media.type === 'video' ? (
                                    <video
                                        src={media.url}
                                        className={`w-full h-full object-contain ${mediaItems.length === 1 ? 'max-h-[600px] block' : 'absolute inset-0'}`}
                                        style={{ background: 'linear-gradient(135deg, var(--color-ocean-surface) 0%, var(--color-ocean-deep) 100%)' }}
                                        controls
                                        muted
                                    />
                                ) : (
                                    <button type="button" aria-label={`View photo ${index + 1}`}
                                        onClick={() => setLightboxIndex(index)}
                                        className="absolute inset-0 z-[1] block h-full w-full cursor-zoom-in overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px]">
                                        <SafeMediaImage src={media.url} alt="Post photo"
                                            className="h-full w-full object-contain bg-ocean-deep" />
                                    </button>
                                )}
                                {/* Gradient overlay for depth */}
                                {media.type !== 'video' && (
                                    <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Image Lightbox (Portal) ────────────────────────────── */}
            {lightboxIndex !== null && mediaItems[lightboxIndex] && createPortal(
                <div
                    role="dialog" aria-modal="true" aria-label="Post photo viewer" data-testid="photo-lightbox"
                    className="daloy-photo-lightbox fixed inset-0 z-[9999] flex items-center justify-center bg-black px-3 py-12 sm:px-16"
                    style={{ backgroundColor: '#000000', backdropFilter: 'blur(12px)' }}
                    onClick={() => setLightboxIndex(null)}
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                        if (touchStartX.current === null) return;
                        const diff = e.changedTouches[0].clientX - touchStartX.current;
                        if (diff > 60) setLightboxIndex(prev => Math.max(prev - 1, 0));
                        if (diff < -60) setLightboxIndex(prev => Math.min(prev + 1, mediaItems.length - 1));
                        touchStartX.current = null;
                    }}
                >
                    {/* Close */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                        type="button" aria-label="Close photo viewer"
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>

                    {/* Counter */}
                    {mediaItems.length > 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 sm:top-6 z-10 px-3 py-1 rounded-full bg-white/10 border border-white/8 text-white text-xs font-bold">
                            {lightboxIndex + 1} / {mediaItems.length}
                        </div>
                    )}

                    {/* Previous */}
                    {lightboxIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
                            type="button" aria-label="Previous photo"
                            className="absolute left-2 sm:left-6 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Next */}
                    {lightboxIndex < mediaItems.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
                            type="button" aria-label="Next photo"
                            className="absolute right-2 sm:right-6 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Photos remain in original color against a true-black lightbox. */}
                    <div className="flex max-h-[85dvh] w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {mediaItems[lightboxIndex].type === 'video' ? (
                            <video src={mediaItems[lightboxIndex].url} controls autoPlay playsInline className="max-h-[85dvh] max-w-full rounded-lg bg-black" />
                        ) : (
                            <SafeMediaImage
                                key={mediaItems[lightboxIndex].url}
                                src={mediaItems[lightboxIndex].url}
                                alt={`Photo ${lightboxIndex + 1}`}
                                loading="eager"
                                className="max-w-[92vw] max-h-[85dvh] sm:max-w-[80vw] object-contain rounded-xl select-none bg-black"
                                draggable={false}
                            />
                        )}
                    </div>

                    <style>{`
                        @keyframes lbFadeIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
                    `}</style>
                </div>
            , document.body)}

            {/* Fallback: single image from old format */}
            {mediaItems.length === 0 && post.media_urls && post.media_urls.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="rounded-[16px] overflow-hidden border border-ocean-divider relative shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <SafeMediaImage
                            src={post.media_urls[0]}
                            alt="Post media"
                            className="w-full h-40 sm:h-56 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Delete Confirmation — teleported via portal to avoid overflow-hidden clipping */}
            {showDeleteConfirm && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
                    {/* Backdrop with B&W filter */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ backdropFilter: 'blur(8px) grayscale(1)' }} />

                    {/* Modal Card */}
                    <div
                        className="relative z-10 w-[380px] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'fadeInScale 0.25s ease-out' }}
                    >
                        {/* Post Preview — Desaturated */}
                        <div className="relative p-4 pb-3" style={{ filter: 'grayscale(1) brightness(0.7)' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-600 overflow-hidden">
                                    {author.profile_picture ? (
                                        <img src={author.profile_picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-zinc-400 text-sm font-bold">{initials}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-zinc-300 text-sm font-bold">{author.name}</p>
                                    <p className="text-zinc-500 text-xs">{timeAgo}</p>
                                </div>
                            </div>
                            {post.content && (
                                <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{post.content}</p>
                            )}
                            {mediaItems.length > 0 && (
                                <div className="w-full h-24 rounded-lg overflow-hidden bg-zinc-800">
                                    <img src={mediaItems[0]?.url} alt="" className="w-full h-full object-cover opacity-50" />
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

                        {/* Confirmation Area */}
                        <div className="bg-zinc-900/95 backdrop-blur-xl p-5 text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold text-base mb-1">Delete this post?</h3>
                            <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
                                This action is permanent and cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-zinc-600 border border-zinc-500 rounded-xl hover:bg-zinc-500 transition-all cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes fadeInScale {
                            from { opacity: 0; transform: scale(0.92); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            , document.body)}

            {/* A real report form, linked to the moderation system. */}
            {showReportModal && createPortal(
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 px-4 py-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}>
                    <div role="dialog" aria-modal="true" aria-label="Report post" className="w-full max-w-md rounded-2xl border border-ocean-border bg-ocean-card p-5 sm:p-6 shadow-2xl text-ocean-text" onKeyDown={(e) => { if (e.key === 'Escape') setShowReportModal(false); }}>
                        <h3 className="text-lg font-bold mb-2">Report post</h3>
                        {reportSubmitted ? (
                            <div>
                                <p role="status" className="text-sm text-ocean-text-muted mb-5">Report submitted. A moderator will review it.</p>
                                <button type="button" onClick={() => setShowReportModal(false)} className="w-full rounded-xl bg-ocean-text text-ocean-deep px-4 py-3 font-semibold">Done</button>
                            </div>
                        ) : (
                            <form onSubmit={submitReport} className="space-y-4">
                                <p className="text-sm text-ocean-text-muted">Tell us why this post needs review.</p>
                                <label className="block text-sm font-semibold" htmlFor={`report-reason-${post.id}`}>Reason</label>
                                <select id={`report-reason-${post.id}`} value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl bg-ocean-surface border border-ocean-border p-3 text-ocean-text">
                                    <option value="spam">Spam</option>
                                    <option value="harassment">Harassment</option>
                                    <option value="inappropriate">Inappropriate content</option>
                                    <option value="hate_speech">Hate speech</option>
                                    <option value="threats">Threats</option>
                                    <option value="other">Other</option>
                                </select>
                                <label htmlFor={`report-details-${post.id}`} className="block text-sm font-semibold">Additional details (optional)</label>
                                <textarea id={`report-details-${post.id}`} value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} maxLength={1000} rows={3} className="w-full rounded-xl bg-ocean-surface border border-ocean-border p-3 text-ocean-text" placeholder="Describe the problem..." />
                                {reportError && <p role="alert" className="text-sm text-ocean-text">{reportError}</p>}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 rounded-xl border border-ocean-border px-4 py-3 font-semibold">Cancel</button>
                                    <button type="submit" disabled={reportBusy} className="flex-1 rounded-xl bg-ocean-text text-ocean-deep px-4 py-3 font-semibold disabled:opacity-50">{reportBusy ? 'Submitting...' : 'Submit report'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Footer */}
            <div className="px-3 sm:px-4 py-3 border-t border-ocean-divider-subtle shadow-[0_-1px_2px_rgba(0,0,0,0.015)]">
                <div className="w-full">
                    <PostActions
                        reactionsCount={reactionsCount}
                        commentsCount={commentsCount}
                        isLiked={isLiked}
                        onLike={handleLike}
                        isReposted={isReposted}
                        onRepost={toggleRepost}
                        repostsCount={repostsCount}
                        onCommentClick={() => setShowComments(!showComments)}
                        onShareClick={() => setShowShareModal(true)}
                    />

                </div>

                {repostNotice && <p role="status" className="mt-2 px-2 text-xs text-ocean-text-muted">{repostNotice}</p>}
                {/* Comments Section */}
                {showComments && (
                    <CommentsSection postId={post.id} />
                )}
            </div>

            {/* Share Modal — rendered via portal at body level */}
            {showShareModal && createPortal(
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    postUrl={`${window.location.origin}/posts/${post.id}`}
                    postId={post.id}
                />,
                document.body
            )}
        </div>
    );
}

// Helper: relative time
function getTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

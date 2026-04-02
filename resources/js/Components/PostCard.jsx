import React, { useState, useRef, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import axios from 'axios';
import PostActions from '@/Components/PostActions';
import CommentsSection from '@/Components/Comments/CommentsSection';
import ShareModal from '@/Components/ShareModal';

export default function PostCard({ post }) {
    const currentUser = usePage().props?.auth?.user;
    const isOwner = currentUser?.id === post.user?.id;
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [editVisibility, setEditVisibility] = useState(post.visibility || 'public');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Interaction States
    const [userReaction, setUserReaction] = useState(post.user_reaction || null);
    const [reactionCounts, setReactionCounts] = useState(post.reaction_counts || {});
    const [reactionsCount, setReactionsCount] = useState(post.reactions_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);

    // Content Warning state
    const [cwRevealed, setCwRevealed] = useState(false);

    // Poll state
    const [pollData, setPollData] = useState(post.poll || null);
    const [votedOptionId, setVotedOptionId] = useState(post.poll?.user_voted_option_id || null);

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleReact = async (type) => {
        const prevReaction = userReaction;
        const prevCounts = { ...reactionCounts };

        // Optimistic update
        if (userReaction === type) {
            setUserReaction(null);
            setReactionCounts(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
        } else {
            if (prevReaction) {
                setReactionCounts(prev => ({ ...prev, [prevReaction]: Math.max(0, (prev[prevReaction] || 0) - 1) }));
            }
            setUserReaction(type);
            setReactionCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        }

        try {
            const response = await axios.post(`/posts/${post.id}/react`, { type });
            setUserReaction(response.data.user_reaction);
            setReactionCounts(response.data.reaction_counts);
            if (response.data.reaction_counts?.total !== undefined) {
                setReactionsCount(response.data.reaction_counts.total);
            }
        } catch (error) {
            setUserReaction(prevReaction);
            setReactionCounts(prevCounts);
        }
    };

    const handleBookmark = async () => {
        const prev = isBookmarked;
        setIsBookmarked(!isBookmarked);
        try {
            const response = await axios.post(`/posts/${post.id}/bookmark`);
            setIsBookmarked(response.data.bookmarked);
        } catch {
            setIsBookmarked(prev);
        }
    };

    const handlePollVote = async (optionId) => {
        if (votedOptionId || !pollData) return;
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
            console.error('Vote error:', error);
        }
    };

    const handleUpdate = () => {
        router.put(`/posts/${post.id}`, {
            content: editContent,
            visibility: editVisibility,
            location_tag: post.location_tag || '',
            flow_velocity: post.flow_velocity || 'steady',
        }, { onSuccess: () => setIsEditing(false) });
    };

    const handleDelete = () => {
        router.delete(`/posts/${post.id}`, { onSuccess: () => setShowDeleteConfirm(false) });
    };

    const handlePin = async () => {
        try {
            await axios.post(`/posts/${post.id}/pin`);
            router.reload();
        } catch (error) {
            console.error('Pin error:', error);
        }
        setShowMenu(false);
    };

    // Build display data
    const author = post.user || {};
    const initials = author.name
        ? author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';
    const timeAgo = getTimeAgo(post.created_at);
    const mediaItems = post.media || [];
    const flowVelocity = post.flow_velocity || 'steady';
    const hasContentWarning = post.has_content_warning && !cwRevealed;
    const isRepost = !!post.repost_of;

    const visibilityIcon = {
        public: '🌍',
        followers: '👥',
        private: '🔒',
        close_friends: '💚',
    };

    // Render post content with @mentions and #hashtags highlighted
    const renderContent = (text) => {
        if (!text) return null;
        const parts = text.split(/(@\w+|#\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                const username = part.substring(1);
                return (
                    <Link key={i} href={`/users/${username}`} className="text-biolum hover:text-biolum-bright font-medium transition-colors">
                        {part}
                    </Link>
                );
            }
            if (part.startsWith('#')) {
                const tag = part.substring(1);
                return (
                    <Link key={i} href={`/hashtag/${tag}`} className="text-biolum/80 hover:text-biolum font-medium transition-colors">
                        {part}
                    </Link>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="bg-ocean-card/70 backdrop-blur-sm rounded-[18px] border border-ocean-divider overflow-hidden hover:border-ocean-hover transition-all duration-300 group shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.03)] hover:-translate-y-[1px]">

            {/* Pinned Badge */}
            {post.is_pinned && (
                <div className="px-4 pt-2 flex items-center gap-1.5 text-[11px] text-amber-400/80 font-bold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    Pinned Post
                </div>
            )}

            {/* Repost Header */}
            {isRepost && (
                <div className="px-4 pt-2.5 pb-0 flex items-center gap-1.5 text-[11px] text-ocean-text-dim font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                    </svg>
                    <span>{author.name} reposted</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
                <div className="flex items-center gap-3">
                    <Link href={`/users/${author.id}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-white font-bold text-sm ring-2 ring-ocean-divider overflow-hidden hover:ring-biolum/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                            {author.profile_picture ? (
                                <img src={author.profile_picture} alt={author.name} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>
                    </Link>
                    <div>
                        <Link href={`/users/${author.id}`} className="flex items-center gap-2 group">
                            <h3 className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors tracking-[-0.01em]">{author.name || 'Unknown'}</h3>
                            {author.username && (
                                <span className="text-xs text-ocean-text-dim/70 group-hover:text-ocean-text-muted transition-colors font-normal">@{author.username}</span>
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
                            {' · '}{visibilityIcon[post.visibility] || '🌍'}
                        </p>
                    </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 rounded-lg text-ocean-text-dim hover:text-ocean-text-muted hover:bg-ocean-surface transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-ocean-deep border border-ocean-border rounded-xl overflow-hidden z-20 shadow-xl">
                            {isOwner && (
                                <>
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        Edit Post
                                    </button>
                                    <button onClick={handlePin} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                        <svg className="w-4 h-4" fill={post.is_pinned ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                                        {post.is_pinned ? 'Unpin Post' : 'Pin Post'}
                                    </button>
                                    <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                        Delete Post
                                    </button>
                                </>
                            )}
                            {!isOwner && (
                                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                                    Report Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Warning Overlay */}
            {post.has_content_warning && !cwRevealed && (
                <div className="mx-4 mt-3 mb-1 p-4 bg-ocean-surface/60 border border-amber-500/20 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-bold mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        Content Warning
                    </div>
                    <p className="text-xs text-ocean-text-dim mb-3">{post.content_warning_label || 'This post may contain sensitive content'}</p>
                    <button
                        onClick={() => setCwRevealed(true)}
                        className="px-4 py-1.5 text-xs font-bold text-ocean-text bg-ocean-surface border border-ocean-divider rounded-lg hover:bg-ocean-hover transition-colors"
                    >
                        Show Content
                    </button>
                </div>
            )}

            {/* Content */}
            {(!post.has_content_warning || cwRevealed) && (
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
                                    <option value="public">🌍 Public</option>
                                    <option value="followers">👥 Followers</option>
                                    <option value="private">🔒 Private</option>
                                    <option value="close_friends">💚 Close Friends</option>
                                </select>
                                <div className="flex-1" />
                                <button onClick={() => { setIsEditing(false); setEditContent(post.content || ''); }} className="px-3 py-1.5 text-xs font-medium text-ocean-text-muted hover:text-ocean-text bg-ocean-surface border border-ocean-border rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleUpdate} className="px-4 py-1.5 text-xs font-bold text-ocean-text bg-biolum rounded-lg transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-ocean-text leading-[1.65] whitespace-pre-wrap">{renderContent(post.content)}</p>
                    )}
                </div>
            )}

            {/* Repost Preview */}
            {isRepost && post.repost_of && (!post.has_content_warning || cwRevealed) && (
                <div className="mx-4 mb-3 p-3 bg-ocean-surface/40 border border-ocean-divider rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-biolum/20 overflow-hidden">
                            {post.repost_of.user?.profile_picture ? (
                                <img src={post.repost_of.user.profile_picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center w-full h-full text-[10px] font-bold text-biolum">{post.repost_of.user?.name?.[0]}</span>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-ocean-text">{post.repost_of.user?.name}</span>
                        <span className="text-[10px] text-ocean-text-dim">@{post.repost_of.user?.username}</span>
                    </div>
                    {post.repost_of.content && (
                        <p className="text-xs text-ocean-text-dim leading-relaxed line-clamp-3">{post.repost_of.content}</p>
                    )}
                    {post.repost_of.media?.length > 0 && (
                        <div className="mt-2 rounded-lg overflow-hidden h-28">
                            <img src={post.repost_of.media[0].url} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            )}

            {/* Poll */}
            {pollData && (!post.has_content_warning || cwRevealed) && (
                <div className="mx-4 mb-3">
                    <div className="p-3 bg-ocean-surface/40 border border-ocean-divider rounded-xl">
                        <h4 className="text-sm font-bold text-ocean-text mb-3">{pollData.question}</h4>
                        <div className="space-y-2">
                            {(pollData.options || []).map((option) => {
                                const isVoted = votedOptionId === option.id;
                                const hasVoted = !!votedOptionId;
                                const pct = option.percentage || 0;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => !hasVoted && handlePollVote(option.id)}
                                        disabled={hasVoted}
                                        className={`relative w-full text-left rounded-xl overflow-hidden transition-all ${hasVoted ? '' : 'hover:bg-biolum/10 cursor-pointer'
                                            } ${isVoted ? 'ring-1 ring-biolum/40' : ''}`}
                                    >
                                        {/* Background bar */}
                                        {hasVoted && (
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ${isVoted ? 'bg-biolum/20' : 'bg-ocean-surface/60'
                                                    }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        )}
                                        <div className="relative flex items-center justify-between px-4 py-2.5">
                                            <span className={`text-sm font-medium ${isVoted ? 'text-biolum' : 'text-ocean-text'}`}>
                                                {option.label}
                                            </span>
                                            {hasVoted && (
                                                <span className="text-xs font-bold text-ocean-text-dim ml-2">
                                                    {pct}%
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-ocean-text-dim mt-2">
                            {pollData.total_votes || 0} vote{(pollData.total_votes || 0) !== 1 ? 's' : ''}
                            {pollData.expires_at && ` · Ends ${new Date(pollData.expires_at).toLocaleDateString()}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Media Gallery */}
            {mediaItems.length > 0 && (!post.has_content_warning || cwRevealed) && (
                <div className="px-4 pb-3">
                    <div className={`grid gap-[2px] rounded-[16px] overflow-hidden border border-ocean-divider bg-ocean-surface/40 w-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] ${mediaItems.length === 1 ? 'grid-cols-1 grid-rows-1' :
                            mediaItems.length === 2 ? 'grid-cols-2 grid-rows-1 aspect-[4/3] sm:aspect-[16/9]' :
                                mediaItems.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[4/3] sm:aspect-[16/9]' :
                                    'grid-cols-2 grid-rows-2 aspect-[4/3]'
                        }`}>
                        {mediaItems.slice(0, 4).map((media, index) => (
                            <div
                                key={media.id || index}
                                className={`relative w-full h-full bg-ocean-deep/50 ${mediaItems.length === 3 && index === 0 ? 'row-span-2' : ''
                                    } ${mediaItems.length === 1 ? 'max-h-[600px]' : 'min-h-[120px]'}`}
                            >
                                {media.type === 'video' ? (
                                    <video src={media.url} className={`w-full h-full object-contain ${mediaItems.length === 1 ? 'max-h-[600px] block' : 'absolute inset-0'}`} style={{ background: 'linear-gradient(135deg, var(--color-ocean-surface) 0%, var(--color-ocean-deep) 100%)' }} controls muted />
                                ) : (
                                    <img src={media.url} alt="Post media" className={`w-full h-full object-cover ${mediaItems.length === 1 ? 'max-h-[600px] block' : 'absolute inset-0'}`} />
                                )}
                                {media.type !== 'video' && <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fallback: single image from old format */}
            {mediaItems.length === 0 && post.media_urls && post.media_urls.length > 0 && (!post.has_content_warning || cwRevealed) && (
                <div className="px-4 pb-3">
                    <div className="rounded-[16px] overflow-hidden border border-ocean-divider relative shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <img src={post.media_urls[0]} alt="Post media" className="w-full h-40 sm:h-56 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="px-4 pb-3">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-sm text-rose-300 font-medium mb-2">Delete this post permanently?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-xs font-medium text-ocean-text-muted bg-ocean-surface border border-ocean-border rounded-lg hover:text-ocean-text transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="px-3 py-1.5 text-xs font-bold text-ocean-text bg-rose-600 border border-rose-500 rounded-lg hover:bg-rose-700 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-ocean-divider-subtle shadow-[0_-1px_2px_rgba(0,0,0,0.015)]">
                <div className="flex items-center justify-between">
                    <PostActions
                        reactionsCount={reactionsCount}
                        commentsCount={commentsCount}
                        isLiked={!!userReaction}
                        userReaction={userReaction}
                        reactionCounts={reactionCounts}
                        onReact={handleReact}
                        onCommentClick={() => setShowComments(!showComments)}
                        onShareClick={() => setShowShareModal(true)}
                        onBookmark={handleBookmark}
                        isBookmarked={isBookmarked}
                    />

                    {/* Flow Velocity Badge */}
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shrink-0 ml-2 ${flowVelocity === 'high'
                        ? 'text-biolum bg-biolum/10 border border-biolum/20'
                        : 'text-ocean-text-dim/70 bg-ocean-surface/60 border border-ocean-divider-subtle'
                        }`}>
                        {flowVelocity}
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && <CommentsSection postId={post.id} />}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                postUrl={`${window.location.origin}/posts/${post.id}`}
            />
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

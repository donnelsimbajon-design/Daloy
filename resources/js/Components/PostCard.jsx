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
    const [isLiked, setIsLiked] = useState(post.liked_by_user);
    const [reactionsCount, setReactionsCount] = useState(post.reactions_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const menuRef = useRef(null);

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

    const handleLike = async () => {
        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = reactionsCount;

        setIsLiked(!isLiked);
        setReactionsCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            const response = await axios.post(`/posts/${post.id}/like`);
            // Sync with server state
            setIsLiked(response.data.liked);
            setReactionsCount(response.data.count);
        } catch (error) {
            // Revert on error
            setIsLiked(previousLiked);
            setReactionsCount(previousCount);
            console.error("Error liking post:", error);
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

    // Build display data
    const author = post.user || {};
    const initials = author.name
        ? author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';
    const timeAgo = getTimeAgo(post.created_at);
    const mediaItems = post.media || [];
    const flowVelocity = post.flow_velocity || 'steady';

    const visibilityIcon = {
        public: '🌍',
        followers: '👥',
        private: '🔒',
    };

    return (
        <div className="bg-ocean-card/70 backdrop-blur-sm rounded-[18px] border border-ocean-divider overflow-hidden hover:border-ocean-hover transition-all duration-300 group shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.03)] hover:-translate-y-[1px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <div className="flex items-center gap-3">
                    <Link href={`/users/${author.id}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-biolum flex items-center justify-center text-white font-bold text-sm ring-2 ring-ocean-divider overflow-hidden hover:ring-biolum/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                            {author.profile_picture ? (
                                <img src={author.profile_picture} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                    </Link>
                    <div>
                        <Link href={`/users/${author.id}`} className="flex items-center gap-2 group">
                            <h3 className="text-sm font-bold text-ocean-text group-hover:text-biolum transition-colors tracking-[-0.01em]">{author.name || 'Unknown'}</h3>
                            {author.username && (
                                <span className="text-xs text-ocean-text-dim/70 group-hover:text-ocean-text-muted transition-colors font-normal">@{author.username}</span>
                            )}
                        </Link>
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
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                        Delete Post
                                    </button>
                                </>
                            )}
                            {!isOwner && (
                                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ocean-text-muted hover:text-ocean-text hover:bg-ocean-surface transition-colors">
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
                                <option value="public">🌍 Public</option>
                                <option value="followers">👥 Followers</option>
                                <option value="private">🔒 Private</option>
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
                                className="px-4 py-1.5 text-xs font-bold text-ocean-text bg-biolum rounded-lg transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ocean-text leading-[1.65] whitespace-pre-wrap">{post.content}</p>
                )}
            </div>

            {/* Media Gallery */}
            {mediaItems.length > 0 && (
                <div className="px-4 pb-3">
                    <div className={`grid gap-[2px] rounded-[16px] overflow-hidden border border-ocean-divider bg-ocean-surface/40 w-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] ${mediaItems.length === 1 ? 'grid-cols-1 grid-rows-1' :
                            mediaItems.length === 2 ? 'grid-cols-2 grid-rows-1 aspect-[4/3] sm:aspect-[16/9]' :
                                mediaItems.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-[4/3] sm:aspect-[16/9]' :
                                    'grid-cols-2 grid-rows-2 aspect-[4/3]' // 4 items
                        }`}>
                        {mediaItems.slice(0, 4).map((media, index) => (
                            <div
                                key={media.id || index}
                                className={`relative w-full h-full bg-ocean-deep/50 ${mediaItems.length === 3 && index === 0 ? 'row-span-2' : ''
                                    } ${mediaItems.length === 1 ? 'max-h-[600px]' : 'min-h-[120px]'}`}
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
                                    <img
                                        src={media.url}
                                        alt="Post media"
                                        className={`w-full h-full object-cover ${mediaItems.length === 1 ? 'max-h-[600px] block' : 'absolute inset-0'}`}
                                    />
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

            {/* Fallback: single image from old format */}
            {mediaItems.length === 0 && post.media_urls && post.media_urls.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="rounded-[16px] overflow-hidden border border-ocean-divider relative shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <img
                            src={post.media_urls[0]}
                            alt="Post media"
                            className="w-full h-40 sm:h-56 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
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
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-xs font-medium text-ocean-text-muted bg-ocean-surface border border-ocean-border rounded-lg hover:text-ocean-text transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-3 py-1.5 text-xs font-bold text-ocean-text bg-rose-600 border border-rose-500 rounded-lg hover:bg-rose-700 transition-colors"
                            >
                                Delete
                            </button>
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
                        isLiked={isLiked}
                        onLike={handleLike}
                        onCommentClick={() => setShowComments(!showComments)}
                        onShareClick={() => setShowShareModal(true)}
                    />

                    {/* Flow Velocity Badge */}
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${flowVelocity === 'high'
                        ? 'text-biolum bg-biolum/10 border border-biolum/20'
                        : 'text-ocean-text-dim/70 bg-ocean-surface/60 border border-ocean-divider-subtle'
                        }`}>
                        {flowVelocity}
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <CommentsSection postId={post.id} />
                )}
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

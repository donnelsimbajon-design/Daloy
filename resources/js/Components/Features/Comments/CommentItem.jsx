import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function CommentItem({ comment, onDelete, onReply, depth = 0 }) {
    const { auth } = usePage().props;
    const isOwner = auth.user?.id === comment.user_id; // Check if current user is the author
    const isAdmin = auth.user?.role === 'admin'; // Assuming 'role' field exists or similar check
    const canDelete = isOwner || isAdmin;

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    const handleSubmitReply = (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        onReply(comment.post_id, comment.id, replyContent);
        setReplyContent('');
        setShowReplyInput(false);
    };

    // Cap nesting depth
    const maxDepth = 3;
    const isTooDeep = depth >= maxDepth;

    return (
        <div className={`flex gap-3 ${depth > 0 ? 'mt-3 pl-4 border-l-2 border-ocean-border/30' : 'mt-4'}`}>
            {/* Avatar */}
            <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-ocean-surface overflow-hidden flex items-center justify-center border border-ocean-border/50 text-ocean-text-dim/50 shadow-sm">
                    {comment.user?.profile_picture ? (
                        <img src={comment.user.profile_picture} alt={comment.user.name} className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-5 h-5 mt-1.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="bg-ocean-card/40 rounded-xl p-3 border border-ocean-border/50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-ocean-text truncate pr-2">
                            {comment.user?.name || 'Unknown User'}
                        </span>
                        <span className="text-[10px] text-ocean-text-muted shrink-0">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <p className="text-sm text-ocean-text break-words whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1 pl-1">
                    {!isTooDeep && (
                        <button
                            onClick={() => setShowReplyInput(!showReplyInput)}
                            className="text-xs font-medium text-ocean-text-dim hover:text-biolum transition-colors"
                        >
                            Reply
                        </button>
                    )}

                    {canDelete && (
                        <button
                            onClick={() => onDelete(comment.id)}
                            className="text-xs font-medium text-ocean-text-dim hover:text-rose-400 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>

                {/* Reply Input */}
                {showReplyInput && (
                    <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Reply to ${comment.user?.name}...`}
                            className="flex-1 bg-ocean-surface/50 border border-ocean-border rounded-lg px-3 py-1.5 text-xs text-ocean-text focus:outline-none focus:border-biolum/50 placeholder:text-ocean-text-muted"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!replyContent.trim()}
                            className="px-3 py-1.5 bg-biolum/10 text-biolum text-xs font-medium rounded-lg hover:bg-biolum/20 disabled:opacity-50 transition-colors"
                        >
                            Send
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-3">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onDelete={onDelete}
                                onReply={onReply}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

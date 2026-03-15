import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentItem from './CommentItem';

export default function CommentsSection({ postId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Initial fetch
    useEffect(() => {
        fetchComments(1, true);
    }, [postId]);

    const fetchComments = async (pageToFetch, reset = false) => {
        try {
            setLoading(true);
            const response = await axios.get(`/posts/${postId}/comments?page=${pageToFetch}`);
            const data = response.data;

            if (reset) {
                setComments(data.data);
            } else {
                setComments(prev => [...prev, ...data.data]);
            }

            setHasMore(data.next_page_url !== null);
            setPage(data.current_page);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchComments(page + 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await axios.post(`/posts/${postId}/comments`, {
                content: newComment
            });
            // Add new comment to top
            setComments(prev => [response.data, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (postId, parentId, content) => {
        try {
            const response = await axios.post(`/posts/${postId}/comments`, {
                content,
                parent_id: parentId
            });

            // Optimistically update UI to show reply
            // We need to find the parent comment and append the reply
            setComments(prev => maxDepthUpdate(prev, parentId, response.data));

        } catch (error) {
            console.error("Error replying:", error);
        }
    };

    // Recursive helper to update nested comments
    const maxDepthUpdate = (list, parentId, newReply) => {
        return list.map(comment => {
            if (comment.id === parentId) {
                return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                };
            } else if (comment.replies && comment.replies.length > 0) {
                return {
                    ...comment,
                    replies: maxDepthUpdate(comment.replies, parentId, newReply)
                };
            }
            return comment;
        });
    };

    const handleDelete = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await axios.delete(`/comments/${commentId}`);
            // Remove from UI
            setComments(prev => removeItemRecursively(prev, commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const removeItemRecursively = (list, id) => {
        return list
            .filter(c => c.id !== id)
            .map(c => ({
                ...c,
                replies: c.replies ? removeItemRecursively(c.replies, id) : []
            }));
    };

    return (
        <div className="mt-4 px-4 pb-4 border-t border-ocean-border/30 pt-4 animate-in fade-in slide-in-from-top-2">
            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-ocean-surface/60 border border-ocean-border rounded-xl px-4 py-2.5 text-sm text-ocean-text placeholder:text-ocean-text-muted focus:outline-none focus:ring-2 focus:ring-biolum/20 focus:border-biolum/50 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-biolum text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Post
                </button>
            </form>

            {/* Comments List */}
            <div className="space-y-1">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onDelete={handleDelete}
                        onReply={handleReply}
                    />
                ))}
            </div>

            {/* Loading / Empty States */}
            {loading && (
                <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-biolum/30 border-t-biolum rounded-full animate-spin"></div>
                </div>
            )}

            {!loading && comments.length === 0 && (
                <div className="text-center py-6 text-ocean-text-muted text-sm italic">
                    No comments yet. Be the first to start the flow.
                </div>
            )}

            {hasMore && !loading && (
                <button
                    onClick={handleLoadMore}
                    className="w-full mt-4 py-2 text-xs font-medium text-ocean-text-dim hover:text-biolum hover:bg-ocean-surface/50 rounded-lg transition-colors border border-transparent hover:border-ocean-border"
                >
                    Load previous comments
                </button>
            )}
        </div>
    );
}

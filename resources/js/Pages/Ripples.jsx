import { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Heart, MessageSquare, AtSign, UserPlus, Waves, Building2, Mail, Users, Bell } from 'lucide-react';

export default function Ripples({ ripples = { data: [] }, unreadCount = 0 }) {
    const { auth } = usePage().props;
    const [filter, setFilter] = useState('all');
    const [localRipples, setLocalRipples] = useState(ripples.data || []);
    const [localUnread, setLocalUnread] = useState(unreadCount);
    const [selectedRipple, setSelectedRipple] = useState(null);

    const typeConfig = {
        like:          { icon: <Heart size={16} />, color: 'var(--color-coral)', label: 'liked your post' },
        comment:       { icon: <MessageSquare size={16} />, color: 'var(--color-glow)', label: 'commented on your post' },
        mention:       { icon: <AtSign size={16} />, color: 'var(--color-ripple)', label: 'mentioned you' },
        follow:        { icon: <UserPlus size={16} />, color: 'var(--color-tide)', label: 'started following you' },
        reaction:      { icon: <Waves size={16} />, color: 'var(--color-glow)', label: 'reacted to your post' },
        group_deleted: { icon: <Building2 size={16} />, color: '#ef4444', label: 'School removed' },
        message:       { icon: <Mail size={16} />, color: 'var(--color-ripple)', label: 'sent you a message' },
        friend:        { icon: <Users size={16} />, color: 'var(--color-glow)', label: 'sent you a friend request' },
    };

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'like', label: 'Likes' },
        { key: 'comment', label: 'Comments' },
        { key: 'group_deleted', label: 'System' },
    ];

    const filteredRipples = filter === 'all'
        ? localRipples
        : localRipples.filter(r => r.type === filter);

    const markAllRead = async () => {
        try {
            await axios.post('/api/ripples/mark-all-read');
            setLocalRipples(prev => prev.map(r => ({ ...r, read_at: new Date().toISOString() })));
            setLocalUnread(0);
        } catch { /* ignore */ }
    };

    const markOneRead = async (ripple) => {
        if (ripple.read_at) return;
        try {
            // Extract numeric ID from the ripple id
            const numericId = typeof ripple.id === 'string' && ripple.id.startsWith('rpl_')
                ? ripple.id.replace('rpl_', '')
                : ripple.id;
            await axios.post(`/api/ripples/${numericId}/mark-read`);
            setLocalRipples(prev => prev.map(r =>
                r.id === ripple.id ? { ...r, read_at: new Date().toISOString() } : r
            ));
            setLocalUnread(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const openGroupDeletedModal = (ripple) => {
        setSelectedRipple(ripple);
        markOneRead(ripple);
    };

    const getTypeDisplay = (type) => typeConfig[type] || { icon: <Bell size={16} />, color: 'var(--color-mist)', label: type };

    return (
        <div className="ripples-page">
            {/* Header */}
            <div className="ripples-header">
                <div className="ripples-header-left">
                    <h1 className="ripples-title">
                        <span className="ripples-title-icon flex items-center justify-center"><Bell size={24} /></span>
                        Ripples
                    </h1>
                    {localUnread > 0 && (
                        <span className="ripples-unread-badge">{localUnread} unread</span>
                    )}
                </div>
                {localUnread > 0 && (
                    <button className="ripples-mark-all-btn" onClick={markAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="ripples-filters">
                {filters.map(f => (
                    <button
                        key={f.key}
                        className={`ripples-filter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="ripples-list">
                {filteredRipples.length === 0 ? (
                    <div className="ripples-empty">
                        <div className="ripples-empty-icon flex items-center justify-center text-ocean-text-dim/50"><Waves size={40} /></div>
                        <p className="ripples-empty-text">The current is calm — no ripples here</p>
                        <p className="ripples-empty-sub">When voyagers interact with your content, ripples will appear here.</p>
                    </div>
                ) : (
                    filteredRipples.map(ripple => {
                        const display = getTypeDisplay(ripple.type);
                        const isUnread = !ripple.read_at;
                        const isGroupDeleted = ripple.type === 'group_deleted';

                        return (
                            <div
                                key={ripple.id}
                                className={`ripple-item ${isUnread ? 'unread' : ''}`}
                                onClick={() => isGroupDeleted ? openGroupDeletedModal(ripple) : markOneRead(ripple)}
                                style={{ cursor: 'pointer' }}
                            >
                                {isUnread && <div className="ripple-unread-dot" />}

                                <div className="ripple-icon" style={{ background: `${display.color}20`, color: display.color }}>
                                    {ripple.sender?.profile_picture ? (
                                        <img src={ripple.sender.profile_picture} alt="" className="ripple-avatar" />
                                    ) : (
                                        <span className="ripple-icon-emoji">{display.icon}</span>
                                    )}
                                </div>

                                <div className="ripple-content">
                                    <p className="ripple-text">
                                        {ripple.sender ? (
                                            <Link href={`/users/${ripple.sender.id}`} className="ripple-sender" onClick={e => e.stopPropagation()}>
                                                {ripple.sender.name}
                                            </Link>
                                        ) : (
                                            <span className="ripple-sender">System</span>
                                        )}
                                        {' '}
                                        {isGroupDeleted && ripple.data?.group_name
                                            ? <span>School "<strong>{ripple.data.group_name}</strong>" was removed</span>
                                            : display.label
                                        }
                                    </p>
                                    <span className="ripple-time">{ripple.time_ago}</span>
                                </div>

                                {isGroupDeleted && (
                                    <span className="ripple-detail-hint">View details →</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {ripples.links && ripples.links.length > 3 && (
                <div className="ripples-pagination">
                    {ripples.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`ripples-page-btn ${link.active ? 'active' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            preserveState
                        />
                    ))}
                </div>
            )}

            {/* Group Deleted Detail Modal */}
            {selectedRipple && selectedRipple.type === 'group_deleted' && (
                <>
                    <div className="ripple-modal-overlay" onClick={() => setSelectedRipple(null)} />
                    <div className="ripple-modal">
                        <div className="ripple-modal-header">
                            <h3 className="ripple-modal-title">
                                <span className="flex items-center justify-center"><Building2 size={24} className="mr-2" /></span> School Removed
                            </h3>
                            <button className="ripple-modal-close" onClick={() => setSelectedRipple(null)}>✕</button>
                        </div>
                        <div className="ripple-modal-body">
                            <div className="ripple-modal-field">
                                <label>School Name</label>
                                <p>{selectedRipple.data?.group_name || 'Unknown'}</p>
                            </div>
                            <div className="ripple-modal-field">
                                <label>Reason</label>
                                <p>{selectedRipple.data?.reason || 'No reason provided'}</p>
                            </div>
                            <div className="ripple-modal-field">
                                <label>Removed By</label>
                                <p>{selectedRipple.data?.admin_name || 'Admin'}</p>
                            </div>
                            <div className="ripple-modal-field">
                                <label>Date</label>
                                <p>{selectedRipple.data?.deleted_at
                                    ? new Date(selectedRipple.data.deleted_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })
                                    : selectedRipple.time_ago
                                }</p>
                            </div>
                        </div>
                        <div className="ripple-modal-footer">
                            <Link href="/schools" className="ripple-modal-action">
                                Browse Schools →
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

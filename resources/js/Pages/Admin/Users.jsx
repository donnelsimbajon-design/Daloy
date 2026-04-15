import { useState, useEffect } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function Users({ users = { data: [] }, totalUsers = 0, activeConnections = 0, filters = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [durationDays, setDurationDays] = useState('');
    const [resetMethod, setResetMethod] = useState('email');
    const [activeTab, setActiveTab] = useState('overview');

    // On-demand content for the selected user
    const [userContent, setUserContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);

    // Expanded comments tracking
    const [expandedPost, setExpandedPost] = useState(null);

    // Create user form
    const [newUser, setNewUser] = useState({ name: '', email: '', username: '', password: '', role: 'user' });
    const [createErrors, setCreateErrors] = useState({});

    // Role change
    const [roleChangeUser, setRoleChangeUser] = useState(null);
    const [newRole, setNewRole] = useState('user');

    // Load user content on demand when modal opens or tab switches to posts/stories
    useEffect(() => {
        if (selectedUser && modalType === 'view' && (activeTab === 'posts' || activeTab === 'stories') && !userContent) {
            loadUserContent(selectedUser.id);
        }
    }, [selectedUser, modalType, activeTab]);

    const loadUserContent = async (userId) => {
        setContentLoading(true);
        try {
            const res = await axios.get(`/admin/users/${userId}/content`);
            setUserContent(res.data);
        } catch (err) {
            console.error('Failed to load user content:', err);
        } finally {
            setContentLoading(false);
        }
    };

    const handleSearch = (val) => {
        setSearch(val);
        router.get('/admin/users', { search: val, status: filters.status }, { preserveState: true, replace: true });
    };

    const handleFilter = (status) => {
        router.get('/admin/users', { search, status: status === 'all' ? '' : status }, { preserveState: true, replace: true });
    };

    const handleAction = (user, action) => {
        router.post(`/admin/users/${user.id}/action`, {
            action: action,
            reason: actionReason,
            duration_days: durationDays || null,
            reset_method: resetMethod,
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedUser(null); setActionReason(''); setDurationDays(''); setResetMethod('email'); },
        });
    };

    const handleCreateUser = () => {
        setCreateErrors({});
        router.post('/admin/users/store', newUser, {
            preserveState: true,
            onSuccess: () => {
                setModalType(null);
                setNewUser({ name: '', email: '', username: '', password: '', role: 'user' });
            },
            onError: (errors) => setCreateErrors(errors),
        });
    };

    const handleRoleChange = () => {
        if (!roleChangeUser) return;
        router.patch(`/admin/users/${roleChangeUser.id}/role`, { role: newRole }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setRoleChangeUser(null); },
        });
    };

    const openModal = (user, type, tab = 'overview') => {
        setSelectedUser(user);
        setModalType(type);
        setActiveTab(tab);
        setActionMenuId(null);
        setActionReason('');
        setDurationDays('');
        setResetMethod('email');
        setUserContent(null); // Reset content for fresh load
        setExpandedPost(null);
    };

    const openRoleModal = (user) => {
        setRoleChangeUser(user);
        setNewRole(user.role || 'user');
        setModalType('changeRole');
        setActionMenuId(null);
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalType(null);
        setActionReason('');
        setDurationDays('');
        setRoleChangeUser(null);
        setCreateErrors({});
        setUserContent(null);
        setExpandedPost(null);
    };

    const userList = users.data || [];

    const roleColors = {
        admin: { bg: '#fef3c7', color: '#92400e', label: 'ADMIN' },
        moderator: { bg: '#dbeafe', color: '#1e40af', label: 'MOD' },
        user: { bg: '#f3f4f6', color: '#6b7280', label: 'USER' },
    };

    // ── Tab Button Component ──
    const TabBtn = ({ id, label, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '8px 4px', fontSize: '13px', fontWeight: 600,
                color: activeTab === id ? '#111' : '#888',
                borderBottom: activeTab === id ? '2px solid #111' : '2px solid transparent',
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
            }}
        >
            {label}
            {count !== undefined && (
                <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#555' }}>
                    {count}
                </span>
            )}
        </button>
    );

    // ── Loading Skeleton ──
    const LoadingSkeleton = () => (
        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e5e5e5', borderTopColor: '#111', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '13px' }}>Loading content...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            {flash?.message && (
                <div style={{ padding: '12px 16px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{flash.message}</span>
                </div>
            )}
            
            {/* Stat Cards */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="adm-stat-card">
                    <div className="adm-stat-card-label">TOTAL ACCOUNTS</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <div className="adm-stat-card-value">{totalUsers.toLocaleString()}</div>
                    </div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-card-label">ACTIVE CONNECTIONS</div>
                    <div className="adm-stat-card-value">{activeConnections.toLocaleString()}</div>
                </div>
                <div className="adm-stat-card" style={{ background: '#111', color: '#fff' }}>
                    <div className="adm-stat-card-label" style={{ color: '#aaa' }}>SERVER STATUS</div>
                    <div className="adm-stat-card-value" style={{ color: '#fff' }}>STABLE 99.9%</div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="adm-card">
                {/* Toolbar */}
                <div className="adm-toolbar">
                    <div className="adm-toolbar-left">
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#888' }}>FILTER BY STATUS</span>
                            <select className="adm-filter-select" value={filters.status || 'all'} onChange={e => handleFilter(e.target.value)} style={{ display: 'block', marginTop: '4px' }}>
                                <option value="all">All Users</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                            </select>
                        </div>
                    </div>
                    <div className="adm-toolbar-right" style={{ gap: '8px' }}>
                        <input
                            type="text"
                            className="adm-filter-input"
                            placeholder="Search parameters..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            style={{ minWidth: '200px' }}
                        />
                        <button
                            className="adm-btn adm-btn-primary"
                            onClick={() => setModalType('createUser')}
                            style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                        >
                            + ADD USER
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>USER IDENTITY</th>
                                <th>CONTACT EMAIL</th>
                                <th>ROLE</th>
                                <th>SYSTEM STATUS</th>
                                <th>CONTENT</th>
                                <th>REGISTERED</th>
                                <th>ADMINISTRATIVE ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userList.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>No users found</td></tr>
                            ) : (
                                userList.map(user => {
                                    const rc = roleColors[user.role] || roleColors.user;
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="adm-table-cell-user">
                                                    <div className="adm-table-cell-user-avatar">
                                                        {user.profile_picture ? (
                                                            <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                        ) : (
                                                            user.name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#888' }}>ID: DAL-{String(user.id).padStart(5, '0')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                                                        padding: '3px 8px', borderRadius: '4px',
                                                        background: rc.bg, color: rc.color, cursor: 'pointer',
                                                    }}
                                                    onClick={() => openRoleModal(user)}
                                                    title="Click to change role"
                                                >
                                                    {rc.label}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={user.status} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                                    <span style={{ background: '#f0f4ff', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                                        {user.posts_count} posts
                                                    </span>
                                                    <span style={{ background: '#fdf4ff', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                                        {user.stories_count || 0} stories
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{user.joined}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        className="adm-btn adm-btn-sm adm-btn-outline"
                                                        onClick={() => openModal(user, 'view', 'overview')}
                                                        style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}
                                                    >
                                                        VIEW PROFILE
                                                    </button>
                                                    <div className="adm-actions-menu">
                                                        <button
                                                            className="adm-actions-trigger"
                                                            onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === user.id ? null : user.id); }}
                                                            style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: '#888' }}
                                                        >
                                                            ACTIONS
                                                        </button>
                                                        {actionMenuId === user.id && (
                                                            <div className="adm-actions-dropdown open">
                                                                <button onClick={() => openModal(user, 'view', 'overview')}>→ View Profile Details</button>
                                                                <button onClick={() => openModal(user, 'view', 'posts')}>→ View User Posts</button>
                                                                <button onClick={() => openModal(user, 'view', 'stories')}>→ View User Stories</button>
                                                                <button onClick={() => openRoleModal(user)}>→ Change Role</button>
                                                                {user.status === 'active' && (
                                                                    <button className="danger" onClick={() => openModal(user, 'suspend')}>⊘ Suspend Access</button>
                                                                )}
                                                                {user.status !== 'active' && (
                                                                    <button onClick={() => openModal(user, 'activate')}>✓ Unban / Activate</button>
                                                                )}
                                                                <button onClick={() => openModal(user, 'reset_password')}>↻ Reset Password</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="adm-pagination">
                        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            SHOWING {users.from || 0} TO {users.to || 0} OF {users.total || 0} RECORDS
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {users.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`adm-pagination-btn ${link.active ? 'active' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════
                 VIEW PROFILE MODAL — Tabbed (Overview / Posts / Stories)
                 ════════════════════════════════════════════════════════════ */}
            <Modal isOpen={modalType === 'view'} onClose={closeModal} title="User Content Review" size="lg">
                {selectedUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '75vh' }}>
                        {/* User Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
                            <div className="adm-admin-avatar" style={{ width: '50px', height: '50px', fontSize: '18px' }}>
                                {selectedUser.profile_picture ? (
                                    <img src={selectedUser.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                ) : (
                                    selectedUser.name?.charAt(0)
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{selectedUser.name}</h4>
                                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>@{selectedUser.username} · {selectedUser.email}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <StatusBadge status={selectedUser.status} />
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                                    padding: '2px 6px', borderRadius: '4px',
                                    background: (roleColors[selectedUser.role] || roleColors.user).bg,
                                    color: (roleColors[selectedUser.role] || roleColors.user).color,
                                }}>
                                    {(roleColors[selectedUser.role] || roleColors.user).label}
                                </span>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e5e5e5', marginBottom: '16px', flexShrink: 0 }}>
                            <TabBtn id="overview" label="Overview" />
                            <TabBtn id="posts" label="Posts" count={selectedUser.posts_count} />
                            <TabBtn id="stories" label="Stories" count={selectedUser.stories_count || 0} />
                        </div>

                        {/* Tab Content */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

                            {/* ── OVERVIEW TAB ── */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User ID</strong><p>DAL-{String(selectedUser.id).padStart(5, '0')}</p></div>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</strong><p>{selectedUser.joined}</p></div>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</strong><p>{selectedUser.posts_count}</p></div>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments</strong><p>{selectedUser.comments_count}</p></div>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified</strong><p>{selectedUser.verified ? '✓ Yes' : '✗ No'}</p></div>
                                    <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong><p>@{selectedUser.username || 'N/A'}</p></div>
                                </div>
                            )}

                            {/* ── POSTS TAB ── */}
                            {activeTab === 'posts' && (
                                <div>
                                    {contentLoading ? <LoadingSkeleton /> : !userContent?.posts || userContent.posts.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                                            This user has no posts.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {userContent.posts.map(post => (
                                                <div key={post.id} style={{ border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden', background: '#fafafa' }}>
                                                    {/* Post Header */}
                                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '10px', color: '#888' }}>POST #{post.id}</span>
                                                                <span style={{ fontSize: '10px', color: '#aaa' }}>·</span>
                                                                <span style={{ fontSize: '10px', color: '#888' }}>{post.created_at}</span>
                                                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#6b7280' }}>{post.visibility}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => { setActionReason(`Inappropriate Post #${post.id}`); setSelectedUser(selectedUser); setModalType('suspend'); }}
                                                                style={{ padding: '3px 10px', fontSize: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                                                            >
                                                                FLAG
                                                            </button>
                                                        </div>
                                                        {post.has_content_warning && (
                                                            <div style={{ marginBottom: '6px', padding: '4px 8px', background: '#fef3c7', borderRadius: '4px', fontSize: '10px', color: '#92400e', fontWeight: 600 }}>
                                                                ⚠ Content Warning: {post.content_warning_label || 'Sensitive'}
                                                            </div>
                                                        )}
                                                        <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: '#222' }}>{post.content || '(No text content)'}</p>
                                                    </div>

                                                    {/* Post Media */}
                                                    {post.media && post.media.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '4px', padding: '8px', overflowX: 'auto', background: '#f5f5f5' }}>
                                                            {post.media.map((m, i) => (
                                                                <div key={i} style={{ width: '100px', height: '100px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                                                                    {m.type === 'video' ? (
                                                                        <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                                    ) : (
                                                                        <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Post Stats */}
                                                    <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
                                                        <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontWeight: 600, color: '#555' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {post.likes_count} likes</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {post.comments_count} comments</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> {post.reactions_count} reactions</span>
                                                        </div>
                                                        {post.comments_count > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                                                style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                                            >
                                                                {expandedPost === post.id ? 'Hide Comments ▲' : 'View Comments ▼'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Expanded Comments */}
                                                    {expandedPost === post.id && post.comments && post.comments.length > 0 && (
                                                        <div style={{ borderTop: '1px solid #e5e5e5', background: '#f9fafb', maxHeight: '240px', overflowY: 'auto' }}>
                                                            {post.comments.map(comment => (
                                                                <div key={comment.id} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                                                                    <div style={{
                                                                        width: '28px', height: '28px', borderRadius: '50%', background: '#e5e7eb',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                                                                        flexShrink: 0, overflow: 'hidden'
                                                                    }}>
                                                                        {comment.user?.profile_picture ? (
                                                                            <img src={comment.user.profile_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                                        ) : (
                                                                            comment.user?.name?.charAt(0) || '?'
                                                                        )}
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                                                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{comment.user?.name || 'Unknown'}</span>
                                                                            <span style={{ fontSize: '10px', color: '#aaa' }}>@{comment.user?.username || '?'}</span>
                                                                            <span style={{ fontSize: '10px', color: '#bbb' }}>{comment.created_at}</span>
                                                                        </div>
                                                                        <p style={{ fontSize: '12px', margin: '3px 0 0', lineHeight: '1.4', color: '#333' }}>{comment.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── STORIES TAB ── */}
                            {activeTab === 'stories' && (
                                <div>
                                    {contentLoading ? <LoadingSkeleton /> : !userContent?.stories || userContent.stories.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                                            This user has no stories.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                                            {userContent.stories.map(story => (
                                                <div key={story.id} style={{ border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden', background: '#fafafa' }}>
                                                    <div style={{ height: '220px', backgroundColor: '#000', position: 'relative' }}>
                                                        {story.media_type === 'video' ? (
                                                            <video src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture />
                                                        ) : story.media_type === 'image' ? (
                                                            <img src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Story" />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                                                                {story.content}
                                                            </div>
                                                        )}
                                                        {!story.is_active && (
                                                            <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>EXPIRED</div>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: '8px 10px' }}>
                                                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>{story.created_at}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {story.likes_count}</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {story.views_count}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => { setActionReason(`Inappropriate Story #${story.id}`); setModalType('suspend'); }}
                                                            style={{ width: '100%', padding: '4px', fontSize: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                                                        >
                                                            FLAG
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Action Modals (Suspend/Ban/Activate/etc) ── */}
            <Modal
                isOpen={['suspend', 'ban', 'activate', 'reset_password', 'verify', 'revoke_verify'].includes(modalType)}
                onClose={closeModal}
                title={
                    modalType === 'suspend' ? 'Suspend Access' :
                    modalType === 'ban' ? 'Ban User' :
                    modalType === 'activate' ? 'Activate User' :
                    modalType === 'reset_password' ? 'Reset Password' :
                    modalType === 'verify' ? 'Verify User' : 'Revoke Verification'
                }
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={closeModal}>Cancel</button>
                        <button
                            className={`adm-btn ${modalType === 'ban' ? 'adm-btn-danger' : 'adm-btn-primary'}`}
                            onClick={() => handleAction(selectedUser, modalType)}
                        >
                            Confirm
                        </button>
                    </>
                }
            >
                {selectedUser && (
                    <div>
                        <p style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
                            {modalType === 'suspend' && `Are you sure you want to suspend ${selectedUser.name}? They will be unable to access their account.`}
                            {modalType === 'ban' && `This will ban ${selectedUser.name}. This action should be reserved for serious violations.`}
                            {modalType === 'activate' && `Unban and reactivate ${selectedUser.name}'s account? They will regain full access via Daloy Support.`}
                            {modalType === 'reset_password' && `Choose a method to reset ${selectedUser.name}'s password:`}
                            {modalType === 'verify' && `Mark ${selectedUser.name} as verified?`}
                            {modalType === 'revoke_verify' && `Revoke verification from ${selectedUser.name}?`}
                        </p>
                        {modalType === 'reset_password' && (
                            <div className="adm-form-group">
                                <label className="adm-form-label">Password Reset Method</label>
                                <select className="adm-filter-select" value={resetMethod} onChange={e => setResetMethod(e.target.value)} style={{ width: '100%', padding: '8px 12px' }}>
                                    <option value="email">Send Reset Email to {selectedUser.email}</option>
                                    <option value="manual">Generate Password Directly Here</option>
                                </select>
                            </div>
                        )}
                        {(modalType === 'suspend' || modalType === 'ban') && (
                            <div className="adm-form-group">
                                <label className="adm-form-label">Reason (required)</label>
                                <textarea className="adm-form-textarea" value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="Enter reason for this action..." />
                            </div>
                        )}
                        {(modalType === 'ban' || modalType === 'suspend') && (
                            <div className="adm-form-group">
                                <label className="adm-form-label">{modalType === 'ban' ? 'Ban Duration' : 'Suspension Duration'}</label>
                                <select className="adm-filter-select" value={durationDays} onChange={e => setDurationDays(e.target.value)} style={{ width: '100%', padding: '8px 12px' }}>
                                    <option value="">Permanent (Forever)</option>
                                    <option value="1">1 Day</option>
                                    <option value="3">3 Days</option>
                                    <option value="7">1 Week</option>
                                    <option value="14">2 Weeks</option>
                                    <option value="30">1 Month</option>
                                    <option value="90">3 Months</option>
                                    <option value="180">6 Months</option>
                                    <option value="365">1 Year</option>
                                </select>
                            </div>
                        )}
                        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f7f7f8', borderRadius: '6px', fontSize: '11px', color: '#888' }}>
                            Changes made here are logged in the system audit and cannot be reversed without supervisor approval.
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Create User Modal ── */}
            <Modal
                isOpen={modalType === 'createUser'}
                onClose={closeModal}
                title="Add New Voyager"
                size="md"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={closeModal}>Cancel</button>
                        <button className="adm-btn adm-btn-primary" onClick={handleCreateUser}>Create User</button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Full Name *</label>
                        <input type="text" className="adm-form-input" value={newUser.name} onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter full name" />
                        {createErrors.name && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{createErrors.name}</p>}
                    </div>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Username *</label>
                        <input type="text" className="adm-form-input" value={newUser.username} onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))} placeholder="Enter username (no spaces)" />
                        {createErrors.username && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{createErrors.username}</p>}
                    </div>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Email Address *</label>
                        <input type="email" className="adm-form-input" value={newUser.email} onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))} placeholder="user@example.com" />
                        {createErrors.email && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{createErrors.email}</p>}
                    </div>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Password *</label>
                        <input type="password" className="adm-form-input" value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} placeholder="Min 8 characters" />
                        {createErrors.password && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{createErrors.password}</p>}
                    </div>
                    <div className="adm-form-group">
                        <label className="adm-form-label">Role Assignment</label>
                        <select className="adm-filter-select" value={newUser.role} onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))} style={{ width: '100%', padding: '8px 12px' }}>
                            <option value="user">User (Standard Voyager)</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', fontSize: '11px', color: '#166534' }}>
                        ✓ Admin-created accounts are automatically verified. The user can login immediately.
                    </div>
                </div>
            </Modal>

            {/* ── Change Role Modal ── */}
            <Modal
                isOpen={modalType === 'changeRole'}
                onClose={closeModal}
                title="Change User Role"
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={closeModal}>Cancel</button>
                        <button className="adm-btn adm-btn-primary" onClick={handleRoleChange}>Update Role</button>
                    </>
                }
            >
                {roleChangeUser && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                            <div className="adm-admin-avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                {roleChangeUser.name?.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px' }}>{roleChangeUser.name}</div>
                                <div style={{ fontSize: '11px', color: '#888' }}>@{roleChangeUser.username}</div>
                            </div>
                        </div>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Current Role</label>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                                    padding: '3px 8px', borderRadius: '4px',
                                    background: (roleColors[roleChangeUser.role] || roleColors.user).bg,
                                    color: (roleColors[roleChangeUser.role] || roleColors.user).color,
                                }}>
                                    {(roleColors[roleChangeUser.role] || roleColors.user).label}
                                </span>
                            </div>
                        </div>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Assign New Role</label>
                            <select className="adm-filter-select" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '8px 12px' }}>
                                <option value="user">User (Standard Voyager)</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f7f7f8', borderRadius: '6px', fontSize: '11px', color: '#888' }}>
                            Role changes are logged in the audit trail. Administrators gain full panel access.
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Users.layout = (page) => <AdminLayout currentPage="Admin/Users">{page}</AdminLayout>;

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/Admin/StatusBadge';
import Modal from '../../Components/Admin/Modal';
import { router, Link } from '@inertiajs/react';

export default function Users({ users = { data: [] }, totalUsers = 0, activeConnections = 0, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [actionReason, setActionReason] = useState('');

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
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedUser(null); setActionReason(''); },
        });
    };

    const openModal = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        setActionMenuId(null);
        setActionReason('');
    };

    const closeModal = () => { setSelectedUser(null); setModalType(null); setActionReason(''); };

    const userList = users.data || [];

    return (
        <>
            {/* Stat Cards - matching reference Image 1 */}
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
                    </div>
                </div>

                {/* Table Header */}
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>USER IDENTITY</th>
                                <th>CONTACT EMAIL</th>
                                <th>SYSTEM STATUS</th>
                                <th>REGISTERED</th>
                                <th>ADMINISTRATIVE ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userList.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>No users found</td></tr>
                            ) : (
                                userList.map(user => (
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
                                                    <div style={{ fontWeight: 700
                                                    }}>{user.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#888' }}>ID: DAL-{String(user.id).padStart(5, '0')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td>{user.joined}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    className="adm-btn adm-btn-sm adm-btn-outline"
                                                    onClick={() => openModal(user, 'view')}
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
                                                            <button onClick={() => openModal(user, 'view')}>→ View Profile Details</button>
                                                            {user.status === 'active' && (
                                                                <button className="danger" onClick={() => openModal(user, 'suspend')}>⊘ Suspend Access</button>
                                                            )}
                                                            {user.status !== 'active' && (
                                                                <button onClick={() => openModal(user, 'activate')}>✓ Activate</button>
                                                            )}
                                                            <button onClick={() => openModal(user, 'reset_password')}>↻ Reset Password</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

            {/* View Profile Modal */}
            <Modal isOpen={modalType === 'view'} onClose={closeModal} title="User Profile" size="lg">
                {selectedUser && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <div className="adm-admin-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                                {selectedUser.name?.charAt(0)}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{selectedUser.name}</h4>
                                <p style={{ fontSize: '13px', color: '#888' }}>{selectedUser.email}</p>
                                <div style={{ marginTop: '4px' }}><StatusBadge status={selectedUser.status} /></div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User ID</strong><p>DAL-{String(selectedUser.id).padStart(5, '0')}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</strong><p>{selectedUser.joined}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</strong><p>{selectedUser.posts_count}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments</strong><p>{selectedUser.comments_count}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified</strong><p>{selectedUser.verified ? '✓ Yes' : '✗ No'}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong><p>@{selectedUser.username || 'N/A'}</p></div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modals */}
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
                            {modalType === 'ban' && `This will permanently ban ${selectedUser.name}. This action should be reserved for serious violations.`}
                            {modalType === 'activate' && `Reactivate ${selectedUser.name}'s account? They will regain full access.`}
                            {modalType === 'reset_password' && `Send a password reset link to ${selectedUser.email}?`}
                            {modalType === 'verify' && `Mark ${selectedUser.name} as verified?`}
                            {modalType === 'revoke_verify' && `Revoke verification from ${selectedUser.name}?`}
                        </p>
                        {(modalType === 'suspend' || modalType === 'ban') && (
                            <div className="adm-form-group">
                                <label className="adm-form-label">Reason (required)</label>
                                <textarea className="adm-form-textarea" value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="Enter reason for this action..." />
                            </div>
                        )}
                        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f7f7f8', borderRadius: '6px', fontSize: '11px', color: '#888' }}>
                            Changes made here are logged in the system audit and cannot be reversed without supervisor approval.
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Users.layout = (page) => <AdminLayout currentPage="Admin/Users">{page}</AdminLayout>;

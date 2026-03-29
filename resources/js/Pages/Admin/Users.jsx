import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';
import StatusBadge from '../../Components/Admin/StatusBadge';
import Modal from '../../Components/Admin/Modal';

const mockUsers = [
    { id: 1, name: 'Alice Rivera', email: 'alice@example.com', status: 'active', verified: true, joined: '2025-10-15', posts: 342 },
    { id: 2, name: 'Bob Chen', email: 'bob@example.com', status: 'active', verified: true, joined: '2025-09-22', posts: 189 },
    { id: 3, name: 'Carla Diaz', email: 'carla@example.com', status: 'suspended', verified: false, joined: '2025-11-03', posts: 78 },
    { id: 4, name: 'David Kim', email: 'david@example.com', status: 'active', verified: true, joined: '2025-08-10', posts: 567 },
    { id: 5, name: 'Eva Santos', email: 'eva@example.com', status: 'banned', verified: false, joined: '2025-12-01', posts: 12 },
    { id: 6, name: 'Frank Moore', email: 'frank@example.com', status: 'active', verified: false, joined: '2026-01-14', posts: 94 },
    { id: 7, name: 'Grace Lee', email: 'grace@example.com', status: 'active', verified: true, joined: '2025-07-19', posts: 421 },
    { id: 8, name: 'Henry Tran', email: 'henry@example.com', status: 'suspended', verified: false, joined: '2026-02-05', posts: 33 },
    { id: 9, name: 'Iris Johnson', email: 'iris@example.com', status: 'active', verified: true, joined: '2025-06-28', posts: 715 },
    { id: 10, name: 'Jake Wilson', email: 'jake@example.com', status: 'active', verified: false, joined: '2026-03-01', posts: 56 },
    { id: 11, name: 'Karen Park', email: 'karen@example.com', status: 'active', verified: true, joined: '2025-05-12', posts: 298 },
    { id: 12, name: 'Leo Nguyen', email: 'leo@example.com', status: 'banned', verified: false, joined: '2026-01-20', posts: 5 },
];

const activityHistory = [
    { action: 'Posted in Tech Group', time: '2 hours ago' },
    { action: 'Commented on @alice post', time: '4 hours ago' },
    { action: 'Changed profile picture', time: '1 day ago' },
    { action: 'Joined "Photography Club" group', time: '2 days ago' },
    { action: 'Reported post #4521', time: '3 days ago' },
];

export default function Users() {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);

    const filtered = mockUsers.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || u.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openModal = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        setActionMenuId(null);
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalType(null);
    };

    const columns = [
        {
            key: 'name', label: 'User',
            render: (val, row) => (
                <div className="adm-table-cell-user">
                    <div className="adm-table-cell-user-avatar">{val.charAt(0)}</div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{val}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'status', label: 'Status',
            render: (val) => <StatusBadge status={val} />
        },
        {
            key: 'verified', label: 'Verified',
            render: (val) => val
                ? <span style={{ color: '#111', fontWeight: 600 }}>✓ Verified</span>
                : <span style={{ color: '#aaa' }}>—</span>
        },
        { key: 'joined', label: 'Joined' },
        { key: 'posts', label: 'Posts', render: (val) => val.toLocaleString() },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === val ? null : val); }}>
                        ⋯
                    </button>
                    {actionMenuId === val && (
                        <div className="adm-actions-dropdown open">
                            <button onClick={() => openModal(row, 'view')}>👁 View Profile</button>
                            {row.status === 'active' && <button onClick={() => openModal(row, 'suspend')}>⏸ Suspend</button>}
                            {row.status === 'active' && <button className="danger" onClick={() => openModal(row, 'ban')}>🚫 Ban User</button>}
                            {(row.status === 'suspended' || row.status === 'banned') && <button onClick={() => openModal(row, 'activate')}>✅ Activate</button>}
                            <button onClick={() => openModal(row, 'reset')}>🔑 Reset Password</button>
                            {!row.verified && <button onClick={() => openModal(row, 'verify')}>✓ Verify</button>}
                            {row.verified && <button onClick={() => openModal(row, 'revoke')}>✗ Revoke Verification</button>}
                        </div>
                    )}
                </div>
            )
        },
    ];

    return (
        <>
            <div className="adm-card">
                {/* Toolbar */}
                <div className="adm-toolbar">
                    <div className="adm-toolbar-left">
                        <input
                            type="text"
                            className="adm-filter-input"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select className="adm-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>
                    <div className="adm-toolbar-right">
                        <span style={{ fontSize: '13px', color: '#888' }}>{filtered.length} users</span>
                    </div>
                </div>

                {/* Table */}
                <DataTable columns={columns} data={filtered} />
            </div>

            {/* View Profile Modal */}
            <Modal isOpen={modalType === 'view'} onClose={closeModal} title="User Profile" size="lg">
                {selectedUser && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <div className="adm-admin-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{selectedUser.name}</h4>
                                <p style={{ fontSize: '13px', color: '#888' }}>{selectedUser.email}</p>
                                <div style={{ marginTop: '4px' }}><StatusBadge status={selectedUser.status} /></div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</strong><p>{selectedUser.joined}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</strong><p>{selectedUser.posts}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified</strong><p>{selectedUser.verified ? 'Yes' : 'No'}</p></div>
                            <div><strong style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong><p>{selectedUser.status}</p></div>
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Activity History</h4>
                        {activityHistory.map((a, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                                <span>{a.action}</span>
                                <span style={{ color: '#888', fontSize: '12px' }}>{a.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Action Modals */}
            <Modal
                isOpen={['suspend', 'ban', 'activate', 'reset', 'verify', 'revoke'].includes(modalType)}
                onClose={closeModal}
                title={modalType === 'suspend' ? 'Suspend User' : modalType === 'ban' ? 'Ban User' : modalType === 'activate' ? 'Activate User' : modalType === 'reset' ? 'Reset Password' : modalType === 'verify' ? 'Verify User' : 'Revoke Verification'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={closeModal}>Cancel</button>
                        <button className={`adm-btn ${modalType === 'ban' ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={closeModal}>
                            {modalType === 'suspend' && 'Confirm Suspend'}
                            {modalType === 'ban' && 'Confirm Ban'}
                            {modalType === 'activate' && 'Activate'}
                            {modalType === 'reset' && 'Send Reset Link'}
                            {modalType === 'verify' && 'Verify User'}
                            {modalType === 'revoke' && 'Revoke'}
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
                            {modalType === 'reset' && `Send a password reset link to ${selectedUser.email}?`}
                            {modalType === 'verify' && `Mark ${selectedUser.name} as a verified user?`}
                            {modalType === 'revoke' && `Remove verification badge from ${selectedUser.name}?`}
                        </p>
                        {(modalType === 'suspend' || modalType === 'ban') && (
                            <div className="adm-form-group">
                                <label className="adm-form-label">Reason (required)</label>
                                <textarea className="adm-form-textarea" placeholder="Enter reason for this action..." />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}

Users.layout = (page) => <AdminLayout currentPage="Admin/Users">{page}</AdminLayout>;

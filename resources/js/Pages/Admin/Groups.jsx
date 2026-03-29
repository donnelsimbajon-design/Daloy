import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';
import StatusBadge from '../../Components/Admin/StatusBadge';
import Modal from '../../Components/Admin/Modal';

const mockGroups = [
    { id: 1, name: 'Photography Club', members: 1245, status: 'active', created: '2025-06-15', posts: 3420 },
    { id: 2, name: 'Tech Forum', members: 892, status: 'active', created: '2025-07-22', posts: 2810 },
    { id: 3, name: 'Spam Network #41', members: 34, status: 'suspended', created: '2026-02-10', posts: 890 },
    { id: 4, name: 'Fitness & Health', members: 2340, status: 'active', created: '2025-05-01', posts: 5600 },
    { id: 5, name: 'Music Lovers', members: 1567, status: 'active', created: '2025-08-14', posts: 4200 },
    { id: 6, name: 'Crypto Scam Group', members: 12, status: 'banned', created: '2026-03-01', posts: 156 },
    { id: 7, name: 'Art & Design', members: 789, status: 'active', created: '2025-09-30', posts: 1890 },
    { id: 8, name: 'Book Club', members: 456, status: 'active', created: '2025-11-20', posts: 920 },
];

const mockEvents = [
    { id: 1, name: 'Photography Meetup 2026', group: 'Photography Club', date: '2026-04-15', rsvps: 89, status: 'active' },
    { id: 2, name: 'Tech Conference', group: 'Tech Forum', date: '2026-05-01', rsvps: 234, status: 'active' },
    { id: 3, name: 'Fitness Challenge', group: 'Fitness & Health', date: '2026-04-20', rsvps: 156, status: 'active' },
    { id: 4, name: 'Jazz Night', group: 'Music Lovers', date: '2026-04-10', rsvps: 67, status: 'active' },
    { id: 5, name: 'Art Exhibition', group: 'Art & Design', date: '2026-06-01', rsvps: 45, status: 'active' },
    { id: 6, name: 'Cancelled Meetup', group: 'Book Club', date: '2026-03-15', rsvps: 23, status: 'inactive' },
];

export default function Groups() {
    const [activeTab, setActiveTab] = useState('groups');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);

    const groupColumns = [
        {
            key: 'name', label: 'Group Name',
            render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
        },
        { key: 'members', label: 'Members', render: (val) => val.toLocaleString() },
        { key: 'posts', label: 'Posts', render: (val) => val.toLocaleString() },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        { key: 'created', label: 'Created' },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(`g${val}` === actionMenuId ? null : `g${val}`); }}>⋯</button>
                    {actionMenuId === `g${val}` && (
                        <div className="adm-actions-dropdown open">
                            <button onClick={() => { setSelectedItem(row); setModalType('viewGroup'); setActionMenuId(null); }}>👁 View Details</button>
                            {row.status === 'active' && <button onClick={() => { setSelectedItem(row); setModalType('suspendGroup'); setActionMenuId(null); }}>⏸ Suspend</button>}
                            {row.status !== 'active' && <button onClick={() => { setSelectedItem(row); setModalType('activateGroup'); setActionMenuId(null); }}>✅ Activate</button>}
                            <button className="danger" onClick={() => { setSelectedItem(row); setModalType('deleteGroup'); setActionMenuId(null); }}>🗑 Delete Group</button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const eventColumns = [
        { key: 'name', label: 'Event Name', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
        { key: 'group', label: 'Group' },
        { key: 'date', label: 'Date' },
        { key: 'rsvps', label: 'RSVPs', render: (val) => val.toLocaleString() },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(`e${val}` === actionMenuId ? null : `e${val}`); }}>⋯</button>
                    {actionMenuId === `e${val}` && (
                        <div className="adm-actions-dropdown open">
                            {row.status === 'active' && <button onClick={() => { setSelectedItem(row); setModalType('cancelEvent'); setActionMenuId(null); }}>✗ Cancel Event</button>}
                            {row.status === 'inactive' && <button onClick={() => { setSelectedItem(row); setModalType('enableEvent'); setActionMenuId(null); }}>✓ Re-enable</button>}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <div className="adm-card">
                <div className="adm-tabs">
                    <button className={`adm-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
                        Groups<span className="adm-tab-badge">{mockGroups.length}</span>
                    </button>
                    <button className={`adm-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                        Events<span className="adm-tab-badge">{mockEvents.length}</span>
                    </button>
                </div>
                <DataTable columns={activeTab === 'groups' ? groupColumns : eventColumns} data={activeTab === 'groups' ? mockGroups : mockEvents} />
            </div>

            {/* Group Detail Modal */}
            <Modal isOpen={modalType === 'viewGroup'} onClose={() => setModalType(null)} title="Group Details" size="lg">
                {selectedItem && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div><strong className="adm-form-label">Group Name</strong><p style={{ fontWeight: 600 }}>{selectedItem.name}</p></div>
                            <div><strong className="adm-form-label">Status</strong><p><StatusBadge status={selectedItem.status} /></p></div>
                            <div><strong className="adm-form-label">Members</strong><p>{selectedItem.members?.toLocaleString()}</p></div>
                            <div><strong className="adm-form-label">Total Posts</strong><p>{selectedItem.posts?.toLocaleString()}</p></div>
                            <div><strong className="adm-form-label">Created</strong><p>{selectedItem.created}</p></div>
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Members (Sample)</h4>
                        {['Alice Rivera', 'Bob Chen', 'Grace Lee', 'David Kim'].map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <div className="adm-table-cell-user">
                                    <div className="adm-table-cell-user-avatar">{m.charAt(0)}</div>
                                    <span style={{ fontSize: '13px' }}>{m}</span>
                                </div>
                                <button className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626', borderColor: '#dc2626' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Action Modals */}
            <Modal
                isOpen={['suspendGroup', 'deleteGroup', 'activateGroup', 'cancelEvent', 'enableEvent'].includes(modalType)}
                onClose={() => setModalType(null)}
                title={
                    modalType === 'suspendGroup' ? 'Suspend Group' :
                    modalType === 'deleteGroup' ? 'Delete Group' :
                    modalType === 'activateGroup' ? 'Activate Group' :
                    modalType === 'cancelEvent' ? 'Cancel Event' : 'Re-enable Event'
                }
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${modalType === 'deleteGroup' ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => setModalType(null)}>Confirm</button>
                    </>
                }
            >
                {selectedItem && (
                    <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
                        {modalType === 'suspendGroup' && `Suspend "${selectedItem.name}"? Members will lose access.`}
                        {modalType === 'deleteGroup' && `Permanently delete "${selectedItem.name}" and all its content? This cannot be undone.`}
                        {modalType === 'activateGroup' && `Reactivate "${selectedItem.name}"?`}
                        {modalType === 'cancelEvent' && `Cancel "${selectedItem.name}"? All RSVPs will be notified.`}
                        {modalType === 'enableEvent' && `Re-enable "${selectedItem.name}"?`}
                    </p>
                )}
            </Modal>
        </>
    );
}

Groups.layout = (page) => <AdminLayout currentPage="Admin/Groups">{page}</AdminLayout>;

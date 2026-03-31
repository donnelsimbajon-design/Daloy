import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/Features/DataTable';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link } from '@inertiajs/react';

export default function Groups({ groups = { data: [] } }) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);

    const groupList = groups.data || [];

    const handleAction = (group, action) => {
        router.post(`/admin/groups/${group.id}/action`, { action }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedItem(null); },
        });
    };

    const columns = [
        {
            key: 'name', label: 'Group Name',
            render: (val, row) => (
                <div className="adm-table-cell-user">
                    <div className="adm-table-cell-user-avatar" style={{ borderRadius: '6px' }}>
                        {row.profile_image ? <img src={row.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : val?.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
            )
        },
        { key: 'members_count', label: 'Members', render: (val) => (val || 0).toLocaleString() },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        { key: 'created', label: 'Created' },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === val ? null : val); }}>⋯</button>
                    {actionMenuId === val && (
                        <div className="adm-actions-dropdown open">
                            <button onClick={() => { setSelectedItem(row); setModalType('viewGroup'); setActionMenuId(null); }}>👁 View Details</button>
                            <button className="danger" onClick={() => { setSelectedItem(row); setModalType('deleteGroup'); setActionMenuId(null); }}>🗑 Delete</button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <div className="adm-card">
                <div className="adm-card-header">
                    <h3>Groups & Communities</h3>
                    <span style={{ fontSize: '12px', color: '#888' }}>{groups.total || groupList.length} total</span>
                </div>
                <DataTable columns={columns} data={groupList} />

                {groups.links && groups.links.length > 3 && (
                    <div className="adm-pagination">
                        <span style={{ fontSize: '11px', color: '#888' }}>
                            Showing {groups.from || 0} to {groups.to || 0} of {groups.total || 0}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {groups.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'} className={`adm-pagination-btn ${link.active ? 'active' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} preserveState />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Group Details Modal */}
            <Modal isOpen={modalType === 'viewGroup'} onClose={() => setModalType(null)} title="Group Details" size="lg">
                {selectedItem && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><strong className="adm-form-label">Group Name</strong><p style={{ fontWeight: 600 }}>{selectedItem.name}</p></div>
                            <div><strong className="adm-form-label">Status</strong><p><StatusBadge status={selectedItem.status} /></p></div>
                            <div><strong className="adm-form-label">Members</strong><p>{(selectedItem.members_count || 0).toLocaleString()}</p></div>
                            <div><strong className="adm-form-label">Created</strong><p>{selectedItem.created}</p></div>
                        </div>
                        {selectedItem.description && (
                            <div style={{ marginTop: '16px', padding: '12px', background: '#f7f7f8', borderRadius: '6px', fontSize: '13px' }}>
                                {selectedItem.description}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={modalType === 'deleteGroup'}
                onClose={() => setModalType(null)}
                title="Delete Group"
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className="adm-btn adm-btn-danger" onClick={() => handleAction(selectedItem, 'delete')}>Delete</button>
                    </>
                }
            >
                {selectedItem && <p style={{ fontSize: '13px' }}>Permanently delete "{selectedItem.name}"? This cannot be undone.</p>}
            </Modal>
        </>
    );
}

Groups.layout = (page) => <AdminLayout currentPage="Admin/Groups">{page}</AdminLayout>;

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/Features/DataTable';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link } from '@inertiajs/react';
import { AlertTriangle, Eye, Trash2, MoreHorizontal } from 'lucide-react';

export default function Groups({ groups = { data: [] } }) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const groupList = groups.data || [];

    const handleAction = (group, action) => {
        router.post(`/admin/groups/${group.id}/action`, {
            action,
            reason: deleteReason,
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedItem(null); setDeleteReason(''); },
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
            key: 'id', label: 'Actions', width: '100px',
            render: (val, row) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => { setSelectedItem(row); setModalType('viewGroup'); }} style={{ padding: '6px 10px' }} title="View Details">
                        <Eye size={16} />
                    </button>
                    <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => { setSelectedItem(row); setModalType('deleteGroup'); }} style={{ padding: '6px 10px' }} title="Delete Group">
                        <Trash2 size={16} />
                    </button>
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

            {/* Delete Modal — now with reason field */}
            <Modal
                isOpen={modalType === 'deleteGroup'}
                onClose={() => { setModalType(null); setDeleteReason(''); }}
                title="Delete Group"
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => { setModalType(null); setDeleteReason(''); }}>Cancel</button>
                        <button className="adm-btn adm-btn-danger" onClick={() => handleAction(selectedItem, 'delete')}>Delete & Notify Members</button>
                    </>
                }
            >
                {selectedItem && (
                    <div>
                        <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                            Permanently delete "{selectedItem.name}"? All <strong>{selectedItem.members_count || 0} members</strong> will be notified via a Ripple notification.
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Deletion Reason (visible to members)</label>
                            <textarea
                                className="adm-form-textarea"
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                placeholder="e.g. Violated community guidelines, Inactive group cleanup..."
                                rows={3}
                            />
                        </div>
                        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fff3cd', borderRadius: '6px', fontSize: '11px', color: '#856404', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <AlertTriangle size={14} /> This action cannot be undone. All group posts, events, and membership data will be permanently removed.
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Groups.layout = (page) => <AdminLayout currentPage="Admin/Groups">{page}</AdminLayout>;

import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';
import StatusBadge from '../../Components/Admin/StatusBadge';
import Modal from '../../Components/Admin/Modal';

const mockReports = [
    { id: 1, type: 'User', reporter: 'Alice Rivera', target: '@toxic_user_99', reason: 'Harassment & bullying', status: 'pending', date: '2026-03-29', notes: '' },
    { id: 2, type: 'Post', reporter: 'Bob Chen', target: 'Post #8412', reason: 'Hate speech', status: 'pending', date: '2026-03-29', notes: '' },
    { id: 3, type: 'Comment', reporter: 'Grace Lee', target: 'Comment on #7291', reason: 'Spam / scam links', status: 'resolved', date: '2026-03-28', notes: 'Content removed, user warned.' },
    { id: 4, type: 'User', reporter: 'David Kim', target: '@fake_account', reason: 'Impersonation', status: 'resolved', date: '2026-03-28', notes: 'Account banned.' },
    { id: 5, type: 'Post', reporter: 'Iris Johnson', target: 'Post #9102', reason: 'Nudity / sexual content', status: 'dismissed', date: '2026-03-27', notes: 'Content within guidelines.' },
    { id: 6, type: 'Comment', reporter: 'Jake Wilson', target: 'Comment on #6503', reason: 'Threats of violence', status: 'pending', date: '2026-03-27', notes: '' },
    { id: 7, type: 'User', reporter: 'Karen Park', target: '@spammer_bot', reason: 'Spam account', status: 'resolved', date: '2026-03-26', notes: 'Account suspended.' },
    { id: 8, type: 'Post', reporter: 'Frank Moore', target: 'Post #7834', reason: 'Misinformation', status: 'pending', date: '2026-03-26', notes: '' },
    { id: 9, type: 'Comment', reporter: 'Leo Nguyen', target: 'Comment on #8901', reason: 'Racism', status: 'pending', date: '2026-03-25', notes: '' },
    { id: 10, type: 'User', reporter: 'Henry Tran', target: '@underage_user', reason: 'Underage account', status: 'pending', date: '2026-03-25', notes: '' },
];

export default function Reports() {
    const [activeTab, setActiveTab] = useState('all');
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);

    const tabs = [
        { key: 'all', label: 'All', count: mockReports.length },
        { key: 'pending', label: 'Pending', count: mockReports.filter(r => r.status === 'pending').length },
        { key: 'resolved', label: 'Resolved', count: mockReports.filter(r => r.status === 'resolved').length },
        { key: 'dismissed', label: 'Dismissed', count: mockReports.filter(r => r.status === 'dismissed').length },
    ];

    const filtered = activeTab === 'all' ? mockReports : mockReports.filter(r => r.status === activeTab);

    const columns = [
        {
            key: 'type', label: 'Type',
            render: (val) => <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{val}</span>
        },
        {
            key: 'reporter', label: 'Reporter',
            render: (val) => (
                <div className="adm-table-cell-user">
                    <div className="adm-table-cell-user-avatar">{val.charAt(0)}</div>
                    {val}
                </div>
            )
        },
        { key: 'target', label: 'Target', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        { key: 'date', label: 'Date' },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === val ? null : val); }}>⋯</button>
                    {actionMenuId === val && (
                        <div className="adm-actions-dropdown open">
                            <button onClick={() => { setSelectedReport(row); setModalType('review'); setActionMenuId(null); }}>📋 Review</button>
                            {row.status === 'pending' && <>
                                <button onClick={() => { setSelectedReport(row); setModalType('dismiss'); setActionMenuId(null); }}>✗ Dismiss</button>
                                <button onClick={() => { setSelectedReport(row); setModalType('warn'); setActionMenuId(null); }}>⚠ Warn User</button>
                                <button onClick={() => { setSelectedReport(row); setModalType('remove'); setActionMenuId(null); }}>🗑 Remove Content</button>
                                <button className="danger" onClick={() => { setSelectedReport(row); setModalType('suspend'); setActionMenuId(null); }}>🚫 Suspend User</button>
                            </>}
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
                    {tabs.map(tab => (
                        <button key={tab.key} className={`adm-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                            {tab.label}
                            <span className="adm-tab-badge">{tab.count}</span>
                        </button>
                    ))}
                </div>
                <DataTable columns={columns} data={filtered} />
            </div>

            {/* Review Modal */}
            <Modal isOpen={modalType === 'review'} onClose={() => setModalType(null)} title="Report Details" size="lg">
                {selectedReport && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div><strong className="adm-form-label">Report Type</strong><p>{selectedReport.type}</p></div>
                            <div><strong className="adm-form-label">Status</strong><p><StatusBadge status={selectedReport.status} /></p></div>
                            <div><strong className="adm-form-label">Reporter</strong><p>{selectedReport.reporter}</p></div>
                            <div><strong className="adm-form-label">Target</strong><p style={{ fontWeight: 600 }}>{selectedReport.target}</p></div>
                            <div><strong className="adm-form-label">Reason</strong><p>{selectedReport.reason}</p></div>
                            <div><strong className="adm-form-label">Date</strong><p>{selectedReport.date}</p></div>
                        </div>
                        {selectedReport.notes && (
                            <div style={{ padding: '12px 16px', background: '#f7f7f8', borderRadius: '6px', marginBottom: '16px' }}>
                                <strong className="adm-form-label">Admin Notes</strong>
                                <p style={{ fontSize: '13px' }}>{selectedReport.notes}</p>
                            </div>
                        )}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Add Note</label>
                            <textarea className="adm-form-textarea" placeholder="Write an admin note..." />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modals */}
            <Modal
                isOpen={['dismiss', 'warn', 'remove', 'suspend'].includes(modalType)}
                onClose={() => setModalType(null)}
                title={modalType === 'dismiss' ? 'Dismiss Report' : modalType === 'warn' ? 'Warn User' : modalType === 'remove' ? 'Remove Content' : 'Suspend User'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${modalType === 'suspend' ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => setModalType(null)}>
                            Confirm
                        </button>
                    </>
                }
            >
                {selectedReport && (
                    <div>
                        <p style={{ marginBottom: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                            {modalType === 'dismiss' && `Dismiss this report against ${selectedReport.target}? It will be marked as reviewed.`}
                            {modalType === 'warn' && `Send an official warning to the reported user regarding "${selectedReport.reason}"?`}
                            {modalType === 'remove' && `Remove the reported content (${selectedReport.target})? This cannot be undone.`}
                            {modalType === 'suspend' && `Suspend the reported user's account? They will lose access immediately.`}
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Admin Note</label>
                            <textarea className="adm-form-textarea" placeholder="Document this action..." />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Reports.layout = (page) => <AdminLayout currentPage="Admin/Reports">{page}</AdminLayout>;

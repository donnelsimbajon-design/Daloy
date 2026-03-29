import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';
import StatusBadge from '../../Components/Admin/StatusBadge';
import Modal from '../../Components/Admin/Modal';

const mockContent = {
    posts: [
        { id: 1, type: 'Post', author: 'Bob Chen', content: 'Check out this amazing view from the top of...', status: 'published', flagged: false, date: '2026-03-29' },
        { id: 2, type: 'Post', author: 'Carla Diaz', content: '[AI FLAGGED] Potentially harmful content detected...', status: 'pending', flagged: true, date: '2026-03-29' },
        { id: 3, type: 'Post', author: 'Eva Santos', content: 'Buy cheap followers at www.spamsite.com...', status: 'hidden', flagged: true, date: '2026-03-28' },
        { id: 4, type: 'Post', author: 'Frank Moore', content: 'Great meetup yesterday! Thanks everyone who...', status: 'published', flagged: false, date: '2026-03-28' },
        { id: 5, type: 'Post', author: 'Henry Tran', content: '[AI FLAGGED] Graphic violence imagery detected...', status: 'pending', flagged: true, date: '2026-03-27' },
    ],
    comments: [
        { id: 101, type: 'Comment', author: 'Jake Wilson', content: 'This is offensive and inappropriate...', status: 'pending', flagged: true, date: '2026-03-29' },
        { id: 102, type: 'Comment', author: 'Karen Park', content: 'Great article! Very informative', status: 'published', flagged: false, date: '2026-03-29' },
        { id: 103, type: 'Comment', author: 'Leo Nguyen', content: '[AI FLAGGED] Harassment / targeted abuse...', status: 'pending', flagged: true, date: '2026-03-28' },
    ],
    media: [
        { id: 201, type: 'Media', author: 'Alice Rivera', content: 'image_sunset_2026.jpg (2.4MB)', status: 'published', flagged: false, date: '2026-03-29' },
        { id: 202, type: 'Media', author: 'David Kim', content: '[AI FLAGGED] Potentially explicit image', status: 'pending', flagged: true, date: '2026-03-28' },
    ],
    groups: [
        { id: 301, type: 'Group Content', author: 'Photography Club', content: 'Post in group about selling equipment...', status: 'published', flagged: false, date: '2026-03-29' },
        { id: 302, type: 'Group Content', author: 'Tech Forum', content: '[AI FLAGGED] Misinformation about...', status: 'pending', flagged: true, date: '2026-03-27' },
    ],
};

const modLogs = [
    { admin: 'Admin_Sarah', action: 'Deleted post #4521', target: 'Bob Chen', time: '15 mins ago' },
    { admin: 'Admin_Mark', action: 'Hidden comment #102', target: 'Karen Park', time: '1 hour ago' },
    { admin: 'System_AI', action: 'Auto-flagged post #2', target: 'Carla Diaz', time: '2 hours ago' },
    { admin: 'Admin_Sarah', action: 'Approved media #201', target: 'Alice Rivera', time: '3 hours ago' },
];

export default function Moderation() {
    const [activeTab, setActiveTab] = useState('posts');
    const [modalType, setModalType] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);

    const tabs = [
        { key: 'posts', label: 'Posts', count: mockContent.posts.length },
        { key: 'comments', label: 'Comments', count: mockContent.comments.length },
        { key: 'media', label: 'Media', count: mockContent.media.length },
        { key: 'groups', label: 'Groups', count: mockContent.groups.length },
        { key: 'ai', label: 'AI Queue', count: Object.values(mockContent).flat().filter(i => i.flagged).length },
    ];

    let contentData = activeTab === 'ai'
        ? Object.values(mockContent).flat().filter(i => i.flagged)
        : mockContent[activeTab] || [];

    const columns = [
        {
            key: 'author', label: 'Author',
            render: (val) => (
                <div className="adm-table-cell-user">
                    <div className="adm-table-cell-user-avatar">{val.charAt(0)}</div>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
            )
        },
        {
            key: 'content', label: 'Content Preview',
            render: (val, row) => (
                <div>
                    {row.flagged && <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', marginRight: '6px', textTransform: 'uppercase' }}>⚑ Flagged</span>}
                    <span style={{ color: row.flagged ? '#dc2626' : 'inherit' }}>{val.length > 60 ? val.substring(0, 60) + '...' : val}</span>
                </div>
            )
        },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val === 'published' ? 'active' : val} /> },
        { key: 'date', label: 'Date' },
        {
            key: 'id', label: 'Actions', width: '80px',
            render: (val, row) => (
                <div className="adm-actions-menu">
                    <button className="adm-actions-trigger" onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === val ? null : val); }}>⋯</button>
                    {actionMenuId === val && (
                        <div className="adm-actions-dropdown open">
                            <button onClick={() => { setSelectedItem(row); setModalType('view'); setActionMenuId(null); }}>👁 Preview</button>
                            <button onClick={() => { setSelectedItem(row); setModalType('hide'); setActionMenuId(null); }}>🙈 Hide Content</button>
                            <button onClick={() => { setSelectedItem(row); setModalType('flag'); setActionMenuId(null); }}>⚑ Flag</button>
                            <button className="danger" onClick={() => { setSelectedItem(row); setModalType('delete'); setActionMenuId(null); }}>🗑 Delete</button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <div className="adm-card" style={{ marginBottom: '24px' }}>
                <div className="adm-tabs">
                    {tabs.map(tab => (
                        <button key={tab.key} className={`adm-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                            {tab.label}
                            <span className="adm-tab-badge">{tab.count}</span>
                        </button>
                    ))}
                </div>
                <DataTable columns={columns} data={contentData} />
            </div>

            {/* Moderation Logs */}
            <div className="adm-card">
                <div className="adm-card-header">
                    <h3>Moderation Logs</h3>
                </div>
                <div className="adm-card-body-flush">
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Time</th></tr></thead>
                            <tbody>
                                {modLogs.map((log, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{log.admin}</td>
                                        <td>{log.action}</td>
                                        <td>{log.target}</td>
                                        <td style={{ color: '#888' }}>{log.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <Modal isOpen={modalType === 'view'} onClose={() => setModalType(null)} title="Content Preview" size="lg">
                {selectedItem && (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <strong>Author:</strong> {selectedItem.author}<br/>
                            <strong>Type:</strong> {selectedItem.type}<br/>
                            <strong>Date:</strong> {selectedItem.date}
                        </div>
                        <div style={{ padding: '16px', background: '#f7f7f8', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                            {selectedItem.content}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={['delete', 'hide', 'flag'].includes(modalType)}
                onClose={() => setModalType(null)}
                title={modalType === 'delete' ? 'Delete Content' : modalType === 'hide' ? 'Hide Content' : 'Flag Content'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${modalType === 'delete' ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => setModalType(null)}>
                            {modalType === 'delete' ? 'Delete' : modalType === 'hide' ? 'Hide' : 'Flag'}
                        </button>
                    </>
                }
            >
                {selectedItem && (
                    <div>
                        <p style={{ marginBottom: '12px', fontSize: '13px' }}>
                            {modalType === 'delete' && `Permanently delete this ${selectedItem.type.toLowerCase()} by ${selectedItem.author}?`}
                            {modalType === 'hide' && `Hide this ${selectedItem.type.toLowerCase()} from public view?`}
                            {modalType === 'flag' && `Flag this ${selectedItem.type.toLowerCase()} as inappropriate?`}
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Admin Note</label>
                            <textarea className="adm-form-textarea" placeholder="Add a note for this action..." />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Moderation.layout = (page) => <AdminLayout currentPage="Admin/Moderation">{page}</AdminLayout>;

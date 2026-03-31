import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link } from '@inertiajs/react';

export default function Reports({ reports = { data: [] }, counts = {}, currentStatus = 'all' }) {
    const [activeTab, setActiveTab] = useState(currentStatus);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    const tabs = [
        { key: 'all', label: 'ALL REPORTS' },
        { key: 'pending', label: 'PENDING', count: counts.pending || 0 },
        { key: 'resolved', label: 'RESOLVED' },
        { key: 'dismissed', label: 'DISMISSED' },
    ];

    const handleTabChange = (key) => {
        setActiveTab(key);
        router.get('/admin/reports', { status: key }, { preserveState: true, replace: true });
    };

    const handleAction = (action) => {
        if (!selectedReport) return;
        router.post(`/admin/reports/${selectedReport.id}/action`, {
            action: action,
            admin_notes: adminNotes,
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedReport(null); setAdminNotes(''); },
        });
    };

    const reportList = reports.data || [];

    const getReasonBadgeStyle = (reason) => {
        const lower = (reason || '').toLowerCase();
        if (lower.includes('harassment') || lower.includes('hate')) return { background: '#dc2626', color: '#fff' };
        if (lower.includes('spam') || lower.includes('suspected')) return { background: '#111', color: '#fff' };
        if (lower.includes('violence') || lower.includes('threat')) return { background: '#dc2626', color: '#fff' };
        return { background: '#f0f0f0', color: '#333' };
    };

    return (
        <>
            <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Reports Management</h2>
                <p style={{ fontSize: '13px', color: '#888' }}>Queue management for community-flagged violations. Prioritize high-severity harassment and spam reports.</p>
            </div>

            {/* Tabs */}
            <div className="adm-tabs" style={{ background: 'transparent', border: 'none', marginBottom: '16px', paddingBottom: '0' }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`adm-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(t.key)}
                        style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: activeTab === t.key ? 700 : 400 }}
                    >
                        {t.label}
                        {t.count !== undefined && <span className="adm-tab-badge">({t.count})</span>}
                    </button>
                ))}
            </div>

            {/* Report Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {reportList.length === 0 ? (
                    <div className="adm-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#aaa' }}>
                        No reports in this category
                    </div>
                ) : (
                    reportList.map(report => (
                        <div key={report.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '220px 1fr 200px',
                            background: '#fff',
                            border: '1px solid #e5e5e5',
                            borderBottom: 'none',
                            padding: '20px 24px',
                        }}>
                            {/* Left: Reporter Info */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div className="adm-table-cell-user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                                        {report.reporter?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>{report.reporter_username || report.reporter}</div>
                                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REPORTER</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>REASON</div>
                                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', ...getReasonBadgeStyle(report.reason) }}>
                                        {report.reason}
                                    </span>
                                </div>

                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>TIMESTAMP</div>
                                    <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>{report.date}</div>
                                </div>
                            </div>

                            {/* Center: Flagged Content */}
                            <div style={{ paddingLeft: '20px', borderLeft: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    FLAGGED {report.type?.toUpperCase()}
                                </div>
                                <div style={{ background: '#f7f7f8', borderRadius: '6px', padding: '16px', border: '1px solid #e5e5e5' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{report.target}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#333' }}>
                                        {report.reason}
                                    </p>
                                    {report.admin_notes && (
                                        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px', fontStyle: 'italic' }}>
                                            Admin notes: {report.admin_notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch', paddingLeft: '16px' }}>
                                {report.status === 'pending' ? (
                                    <>
                                        <button className="adm-btn adm-btn-primary" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}
                                                onClick={() => { setSelectedReport(report); setModalType('remove_content'); }}>REMOVE CONTENT</button>
                                        <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}
                                                onClick={() => { setSelectedReport(report); setModalType('warn'); }}>WARN USER</button>
                                        <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: '#dc2626', borderColor: '#dc2626' }}
                                                onClick={() => { setSelectedReport(report); setModalType('suspend'); }}>SUSPEND USER</button>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px', textAlign: 'center' }}
                                                onClick={() => { setSelectedReport(report); setModalType('dismiss'); }}>DISMISS</button>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '12px' }}>
                                        <StatusBadge status={report.status} />
                                        {report.resolver && <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>By: {report.resolver}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {reportList.length > 0 && <div style={{ borderBottom: '1px solid #e5e5e5' }}></div>}
            </div>

            {/* Pagination */}
            {reports.links && reports.links.length > 3 && (
                <div className="adm-pagination" style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        SHOWING {reports.from || 0} OF {reports.total || 0} REPORTS
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {reports.links.map((link, i) => (
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

            {/* Action Modals */}
            <Modal
                isOpen={['dismiss', 'warn', 'remove_content', 'suspend', 'ban'].includes(modalType)}
                onClose={() => { setModalType(null); setAdminNotes(''); }}
                title={
                    modalType === 'dismiss' ? 'Dismiss Report' :
                    modalType === 'warn' ? 'Warn User' :
                    modalType === 'remove_content' ? 'Remove Content' :
                    modalType === 'suspend' ? 'Suspend User' : 'Ban User'
                }
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${['suspend', 'ban'].includes(modalType) ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => handleAction(modalType)}>
                            Confirm
                        </button>
                    </>
                }
            >
                {selectedReport && (
                    <div>
                        <p style={{ marginBottom: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                            {modalType === 'dismiss' && `Dismiss this report (${selectedReport.target})? It will be marked as reviewed.`}
                            {modalType === 'warn' && `Send an official warning regarding "${selectedReport.reason}"?`}
                            {modalType === 'remove_content' && `Remove the reported content (${selectedReport.target})? This cannot be undone.`}
                            {modalType === 'suspend' && `Suspend the reported user's account? They will lose access immediately.`}
                            {modalType === 'ban' && `Permanently ban the reported user? This is a severe action.`}
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Admin Notes</label>
                            <textarea className="adm-form-textarea" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Document this action..." />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Reports.layout = (page) => <AdminLayout currentPage="Admin/Reports">{page}</AdminLayout>;

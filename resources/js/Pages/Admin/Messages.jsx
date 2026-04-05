import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link } from '@inertiajs/react';
import { MessageSquare, Flag, ShieldAlert, Ban, Trash2, CheckCircle, XCircle, Users, Clock, ChevronDown, ChevronUp, AlertTriangle, MessageCircleWarning } from 'lucide-react';

export default function Messages({ reportedConversations = { data: [] }, counts = {}, currentStatus = 'all' }) {
    const convList = reportedConversations.data || [];
    const [activeTab, setActiveTab] = useState(currentStatus);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    const handleAction = (action) => {
        if (!selectedReport) return;
        router.post(`/admin/messages/${selectedReport.id}/action`, {
            action,
            admin_notes: adminNotes,
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedReport(null); setAdminNotes(''); setExpandedId(null); },
        });
    };

    const ReasonIcon = ({ reason }) => {
        const key = reason?.split(':')[0]?.trim()?.toLowerCase();
        switch (key) {
            case 'harassment': return <ShieldAlert size={14} />;
            case 'spam': return <Ban size={14} />;
            case 'inappropriate': return <AlertTriangle size={14} />;
            case 'hate_speech': return <XCircle size={14} />;
            case 'threats': return <ShieldAlert size={14} />;
            default: return <Flag size={14} />;
        }
    };

    const reasonLabel = (reason) => {
        const map = {
            'harassment': 'Harassment',
            'spam': 'Spam / Scam',
            'inappropriate': 'Inappropriate',
            'hate_speech': 'Hate Speech',
            'threats': 'Threats',
            'other': 'Other',
        };
        const key = reason?.split(':')[0]?.trim();
        return map[key] || reason;
    };

    const getReasonBadgeStyle = (reason) => {
        const lower = (reason || '').toLowerCase();
        if (lower.includes('harassment') || lower.includes('hate')) return { background: '#dc2626', color: '#fff' };
        if (lower.includes('spam')) return { background: '#111', color: '#fff' };
        if (lower.includes('threats') || lower.includes('violence')) return { background: '#dc2626', color: '#fff' };
        if (lower.includes('inappropriate')) return { background: '#f59e0b', color: '#fff' };
        return { background: '#f0f0f0', color: '#333' };
    };

    return (
        <>
            <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Message Reports</h2>
                <p style={{ fontSize: '13px', color: '#888' }}>Review flagged conversations reported by users. Privacy is maintained — only reported content is visible.</p>
            </div>

            {/* Stat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="adm-stat-card">
                    <div className="adm-stat-label">
                        <MessageSquare size={14} style={{ marginRight: '6px', opacity: 0.6 }} />
                        Total Reports
                    </div>
                    <div className="adm-stat-value-row">
                        <span className="adm-stat-value">{counts.total || 0}</span>
                    </div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-label">
                        <Clock size={14} style={{ marginRight: '6px', opacity: 0.6 }} />
                        Pending Review
                    </div>
                    <div className="adm-stat-value-row">
                        <span className="adm-stat-value" style={{ color: '#f59e0b' }}>{counts.pending || 0}</span>
                    </div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-label">
                        <CheckCircle size={14} style={{ marginRight: '6px', opacity: 0.6 }} />
                        Resolved
                    </div>
                    <div className="adm-stat-value-row">
                        <span className="adm-stat-value" style={{ color: '#10b981' }}>{counts.resolved || 0}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="adm-tabs" style={{ background: 'transparent', border: 'none', marginBottom: '16px', paddingBottom: '0' }}>
                {[
                    { key: 'all', label: 'ALL REPORTS' },
                    { key: 'pending', label: 'PENDING', count: counts.pending || 0 },
                    { key: 'resolved', label: 'RESOLVED' },
                    { key: 'dismissed', label: 'DISMISSED' },
                ].map(t => (
                    <button
                        key={t.key}
                        className={`adm-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => { setActiveTab(t.key); router.get('/admin/messages', { status: t.key }, { preserveState: true, replace: true }); }}
                        style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: activeTab === t.key ? 700 : 400 }}
                    >
                        {t.label}
                        {t.count !== undefined && <span className="adm-tab-badge">({t.count})</span>}
                    </button>
                ))}
            </div>

            {/* Report List */}
            <div className="adm-card">
                <div className="adm-card-header">
                    <h3>Reported Conversations</h3>
                </div>
                <div className="adm-card-body-flush">
                    {convList.length === 0 ? (
                        <div className="adm-empty" style={{ padding: '60px 20px' }}>
                            <MessageCircleWarning size={48} strokeWidth={1.2} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h4>No Reported Conversations</h4>
                            <p>There are currently no flagged or reported conversations to review.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {convList.map(conv => (
                                <div key={conv.id} style={{ borderBottom: '1px solid var(--adm-border, #e5e5e5)' }}>
                                    {/* Report Row */}
                                    <div
                                        onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '220px 1fr 200px',
                                            padding: '20px 24px',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        className="adm-hover-row"
                                    >
                                        {/* Left: Reporter Info */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                                <div className="adm-table-cell-user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px', overflow: 'hidden' }}>
                                                    {conv.reporter_avatar ? (
                                                        <img src={conv.reporter_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        conv.reporter?.charAt(0)?.toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>{conv.reporter_username || conv.reporter}</div>
                                                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REPORTER</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>REASON</div>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', ...getReasonBadgeStyle(conv.reason) }}>
                                                    <ReasonIcon reason={conv.reason} />
                                                    {reasonLabel(conv.reason)}
                                                </span>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>TIMESTAMP</div>
                                                <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>{conv.date}</div>
                                            </div>
                                        </div>

                                        {/* Center: Conversation Preview */}
                                        <div style={{ paddingLeft: '20px', borderLeft: '1px solid #f0f0f0' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MessageSquare size={12} />
                                                FLAGGED {conv.reportable_type?.toUpperCase() || 'CONVERSATION'}
                                            </div>

                                            {/* Participants */}
                                            {conv.participants?.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <Users size={12} style={{ color: '#888' }} />
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        {conv.participants.map(p => p.name).join(' & ')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Message Preview */}
                                            <div style={{ background: '#f7f7f8', borderRadius: '6px', padding: '12px', border: '1px solid #e5e5e5' }}>
                                                {conv.message_previews?.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {conv.message_previews.slice(0, 3).map(msg => (
                                                            <div key={msg.id} style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
                                                                <span style={{ fontWeight: 700, color: '#333', flexShrink: 0 }}>{msg.sender}:</span>
                                                                <span style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content}</span>
                                                                <span style={{ color: '#bbb', flexShrink: 0, fontSize: '10px' }}>{msg.time}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>No messages to preview</p>
                                                )}
                                            </div>

                                            {conv.reason?.includes(':') && (
                                                <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', fontStyle: 'italic' }}>
                                                    "{conv.reason.split(':').slice(1).join(':').trim()}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: Status & Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch', paddingLeft: '16px' }}>
                                            {conv.status === 'pending' ? (
                                                <>
                                                    <button className="adm-btn adm-btn-primary" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(conv); setModalType('resolve'); }}>
                                                        <CheckCircle size={13} /> RESOLVE
                                                    </button>
                                                    <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: '#dc2626' }}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(conv); setModalType('delete_conversation'); }}>
                                                        <Trash2 size={13} /> DELETE CHAT
                                                    </button>
                                                    <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c', borderColor: '#ea580c' }}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(conv); setModalType('restrict_calling'); }}>
                                                        <Ban size={13} /> RESTRICT CALLING
                                                    </button>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(conv); setModalType('dismiss'); }}>
                                                        <XCircle size={13} /> DISMISS
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '12px' }}>
                                                    <StatusBadge status={conv.status} />
                                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        <Clock size={11} /> {conv.time_ago}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === conv.id && (
                                        <div style={{ padding: '0 24px 20px', background: 'rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                {/* Participants Detail */}
                                                <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px' }}>
                                                    <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Users size={12} /> Participants
                                                    </h4>
                                                    {conv.participants?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {conv.participants.map(p => (
                                                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                                                                        {p.profile_picture ? (
                                                                            <img src={p.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        ) : p.name?.charAt(0)?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontWeight: 700, fontSize: '13px' }}>{p.name}</p>
                                                                        <p style={{ fontSize: '11px', color: '#888' }}>@{p.username}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ fontSize: '12px', color: '#888' }}>No participant data</p>
                                                    )}
                                                </div>

                                                {/* All Messages */}
                                                <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px' }}>
                                                    <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <MessageSquare size={12} /> Recent Messages
                                                    </h4>
                                                    {conv.message_previews?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {conv.message_previews.map(msg => (
                                                                <div key={msg.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', padding: '6px 8px', background: '#f9f9f9', borderRadius: '6px' }}>
                                                                    <span style={{ fontWeight: 700, color: '#0ea5e9', flexShrink: 0 }}>{msg.sender}</span>
                                                                    <span style={{ color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content}</span>
                                                                    <span style={{ color: '#bbb', flexShrink: 0, fontSize: '10px' }}>{msg.time}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ fontSize: '12px', color: '#888' }}>No messages</p>
                                                    )}
                                                </div>
                                                
                                                {/* Evidence Media if available */}
                                                {conv.evidence_url && (
                                                    <div style={{ gridColumn: '1 / -1', background: '#111', border: '1px solid #000', borderRadius: '8px', padding: '16px', color: '#fff' }}>
                                                        <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <ShieldAlert size={12} style={{ color: '#dc2626' }} /> Reported Call Evidence (30s buffer)
                                                        </h4>
                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                            {conv.evidence_url.match(/\.(mp4|webm|mov)$/i) ? (
                                                                <video controls src={conv.evidence_url} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}></video>
                                                            ) : (
                                                                <audio controls src={conv.evidence_url} style={{ width: '100%', maxWidth: '400px' }}></audio>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Full Reason */}
                                            <div style={{ marginTop: '12px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '12px 16px' }}>
                                                <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Flag size={12} /> Full Report Details
                                                </h4>
                                                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{conv.reason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {reportedConversations.links && reportedConversations.links.length > 3 && (
                <div className="adm-pagination" style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        SHOWING {reportedConversations.from || 0} OF {reportedConversations.total || 0} REPORTS
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {reportedConversations.links.map((link, i) => (
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
                isOpen={['dismiss', 'resolve', 'delete_conversation', 'restrict_calling'].includes(modalType)}
                onClose={() => { setModalType(null); setAdminNotes(''); }}
                title={
                    modalType === 'dismiss' ? 'Dismiss Report' :
                    modalType === 'resolve' ? 'Resolve Report' :
                    modalType === 'restrict_calling' ? 'Restrict Calling' :
                    'Delete Conversation'
                }
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${['delete_conversation', 'restrict_calling'].includes(modalType) ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => handleAction(modalType)}>
                            Confirm
                        </button>
                    </>
                }
            >
                {selectedReport && (
                    <div>
                        <p style={{ marginBottom: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                            {modalType === 'dismiss' && `Dismiss this report from ${selectedReport.reporter}? It will be marked as reviewed with no action taken.`}
                            {modalType === 'resolve' && `Mark this report as resolved? The conversation will remain but the report will be closed.`}
                            {modalType === 'delete_conversation' && `Permanently delete this conversation? All messages will be removed. This cannot be undone.`}
                            {modalType === 'restrict_calling' && `Restrict the author of this message from initiating any future audio/video calls across the platform?`}
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Admin Notes</label>
                            <textarea className="adm-form-textarea" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Document your decision..." />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Messages.layout = (page) => <AdminLayout currentPage="Admin/Messages">{page}</AdminLayout>;

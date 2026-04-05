import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/Admin/UI/StatusBadge';
import Modal from '../../Components/Admin/UI/Modal';
import { router } from '@inertiajs/react';
import { AlertTriangle, Music, EyeOff } from 'lucide-react';

export default function Moderation({ posts = { data: [] }, comments = { data: [] }, lives = { data: [] }, modLogs = [], todayStats = {}, tab = 'posts' }) {
    const [activeTab, setActiveTab] = useState(tab);
    const [modalType, setModalType] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionReason, setActionReason] = useState('');

    const allPosts = posts.data || [];
    const allComments = comments.data || [];
    const allLives = lives.data || [];
    const flaggedItems = [...allPosts.filter(p => p.flagged), ...allComments.filter(c => c.flagged), ...allLives.filter(l => l.flagged)];

    const contentData = activeTab === 'flagged' ? flaggedItems :
                        activeTab === 'comments' ? allComments : 
                        activeTab === 'lives' ? allLives : allPosts;

    const tabs = [
        { key: 'posts', label: 'ALL ITEMS', count: allPosts.length + allComments.length + allLives.length },
        { key: 'flagged', label: 'FLAGGED', count: flaggedItems.length },
        { key: 'comments', label: 'COMMENTS', count: allComments.length },
        { key: 'lives', label: 'ACTIVE LIVES', count: allLives.length },
    ];

    const handleModAction = (action) => {
        if (!selectedItem) return;
        router.post('/admin/moderation/action', {
            content_type: selectedItem.type.toLowerCase(),
            content_id: selectedItem.id,
            action: action,
            reason: actionReason,
        }, {
            preserveState: true,
            onSuccess: () => { setModalType(null); setSelectedItem(null); setActionReason(''); },
        });
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
                {/* Main Content */}
                <div>
                    {/* Tabs */}
                    <div className="adm-tabs" style={{ background: 'white', borderRadius: '8px 8px 0 0', border: '1px solid #e5e5e5', borderBottom: 'none' }}>
                        {tabs.map(t => (
                            <button key={t.key} className={`adm-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                                {t.label}
                                <span className="adm-tab-badge">({t.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}>
                        {contentData.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#aaa', background: '#fff' }}>
                                No content to moderate
                            </div>
                        ) : (
                            contentData.map(item => (
                                <div key={`${item.type}-${item.id}`} style={{
                                    padding: '20px 24px', background: '#fff', borderBottom: '1px solid #e5e5e5',
                                }}>
                                    {/* Author Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="adm-table-cell-user-avatar" style={{ width: '40px', height: '40px', fontSize: '16px', overflow: 'hidden' }}>
                                                {item.profile_picture ? (
                                                    <img src={item.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    item.author?.charAt(0)?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.username || item.author}</div>
                                                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {item.type} ID: #{item.type === 'Post' ? 'P' : 'C'}{String(item.id).padStart(4, '0')}-{String.fromCharCode(65 + (item.id % 26))}
                                                </div>
                                            </div>
                                        </div>
                                        {item.flagged && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <AlertTriangle size={12} strokeWidth={2.5} /> AI FLAG: {item.reports_count || 0} REPORTS
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '12px 0', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                                        {item.content}
                                        {item.type === 'Live' && (
                                            <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Music size={12} /> CURRENTLY PLAYING
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>{item.music_played || 'No track playing'}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>SESSION STARTED</div>
                                                        <div style={{ fontSize: '12px', color: '#334155' }}>{item.uptime}</div>
                                                    </div>
                                                    {item.track_started && (
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>TRACK STARTED</div>
                                                        <div style={{ fontSize: '12px', color: '#334155' }}>{item.track_started}</div>
                                                    </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Media Preview */}
                                    {item.media_urls && item.media_urls.length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            {item.media_urls.slice(0, 3).map((url, i) => (
                                                <div key={i} style={{ width: '120px', height: '80px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                            {item.media_urls.length > 3 && (
                                                <div style={{ width: '120px', height: '80px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>
                                                    +{item.media_urls.length - 3} More
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            {item.date} {item.location && `· ${item.location}`}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {item.type === 'Live' ? (
                                                <>
                                                    <a href={`/schools/${item.school_id}?ghost=true`} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm adm-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <EyeOff size={14} /> GHOST
                                                    </a>
                                                    <button className="adm-btn adm-btn-sm adm-btn-primary" style={{ background: '#111' }} onClick={() => { setSelectedItem(item); setModalType('terminate'); }}>TERMINATE</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => { setSelectedItem(item); setModalType('hide'); }}>HIDE</button>
                                                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => { setSelectedItem(item); setModalType('flag'); }}>FLAG</button>
                                                    <button className="adm-btn adm-btn-sm adm-btn-primary" style={{ background: '#111' }} onClick={() => { setSelectedItem(item); setModalType('delete'); }}>DELETE</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Moderation Logs */}
                    <div className="adm-card">
                        <div className="adm-card-header" style={{ padding: '12px 16px' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>MODERATION LOGS</h3>
                        </div>
                        <div style={{ padding: '0' }}>
                            {modLogs.length === 0 ? (
                                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>No logs yet</div>
                            ) : (
                                modLogs.map((log, i) => (
                                    <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <div style={{ width: '6px', height: '6px', background: '#111', borderRadius: '1px', marginTop: '6px', flexShrink: 0 }}></div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{log.action}</div>
                                                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4', marginTop: '2px' }}>{log.target}</div>
                                                {log.reason && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Reason: {log.reason}</div>}
                                                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>{log.time}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Today's Stats */}
                    <div className="adm-card">
                        <div className="adm-card-header" style={{ padding: '12px 16px' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TODAY'S STATS</h3>
                        </div>
                        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700 }}>{todayStats.scanned?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SCANNED</div>
                            </div>
                            <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700 }}>{todayStats.removed || 0}</div>
                                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REMOVED</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <Modal
                isOpen={['delete', 'hide', 'flag', 'terminate'].includes(modalType)}
                onClose={() => setModalType(null)}
                title={modalType === 'delete' ? 'Delete Content' : modalType === 'hide' ? 'Hide Content' : modalType === 'flag' ? 'Flag Content' : 'Terminate Live'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                        <button className={`adm-btn ${['delete', 'terminate'].includes(modalType) ? 'adm-btn-danger' : 'adm-btn-primary'}`} onClick={() => handleModAction(modalType)}>
                            {modalType ? modalType.toUpperCase() : ''}
                        </button>
                    </>
                }
            >
                {selectedItem && (
                    <div>
                        <p style={{ marginBottom: '12px', fontSize: '13px' }}>
                            {modalType === 'delete' && `Permanently delete this ${selectedItem.type?.toLowerCase()} by ${selectedItem.author}?`}
                            {modalType === 'hide' && `Hide this ${selectedItem.type?.toLowerCase()} from public view?`}
                            {modalType === 'flag' && `Flag this ${selectedItem.type?.toLowerCase()} for review?`}
                            {modalType === 'terminate' && `Instantly terminate this live session? Evaluated as harassment or inappropriate.`}
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Admin Note</label>
                            <textarea className="adm-form-textarea" value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="Document reason..." />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Moderation.layout = (page) => <AdminLayout currentPage="Admin/Moderation">{page}</AdminLayout>;

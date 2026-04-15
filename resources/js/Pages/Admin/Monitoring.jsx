import { useState, useCallback } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/UI/Modal';
import { router } from '@inertiajs/react';
import {
    Eye, Trash2, Radio, ImageIcon, FileText, Phone, Video,
    Users, MessageSquare, Clock, AlertTriangle, CheckCircle, Search, X
} from 'lucide-react';

/* ── Helpers ────────────────────────────────────────────────────────── */
function Avatar({ user, size = 32 }) {
    const s = { width: size, height: size, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 };
    return (
        <div style={s}>
            {user?.profile_picture
                ? <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.name?.charAt(0)?.toUpperCase() || '?')}
        </div>
    );
}

/* ── Stories Tab ──────────────────────────────────────────────────── */
function StoriesTab({ stories }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [reason, setReason] = useState('');
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? stories : stories.filter(s => s.type === filter);

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.post(`/admin/monitoring/stories/${deleteTarget.id}/delete`, { reason }, {
            preserveState: true,
            onSuccess: () => { setDeleteTarget(null); setReason(''); },
        });
    };

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', gap: '8px' }}>
                {['all', 'image', 'video', 'text'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {f === 'all' ? 'All Types' : f}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--adm-text-dim)', alignSelf: 'center' }}>
                    {filtered.length} active {filter === 'all' ? '' : filter} stories
                </span>
            </div>

            {filtered.length === 0 ? (
                <div className="adm-empty-state" style={{ padding: '60px 20px' }}>
                    <ImageIcon size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>No active stories</p>
                </div>
            ) : (
                <div className="adm-story-grid">
                    {filtered.map(story => (
                        <div key={story.id} className="adm-story-card">
                            {/* Thumbnail */}
                            {story.type === 'text' ? (
                                <div className="adm-story-thumb-text">
                                    {story.text_content?.substring(0, 80) || 'Text Story'}
                                </div>
                            ) : (
                                <img
                                    src={story.media_url}
                                    alt=""
                                    className="adm-story-thumb"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            )}

                            <div className="adm-story-meta">
                                <div className="adm-story-user">
                                    <Avatar user={story.user} size={28} />
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700 }}>{story.user?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--adm-text-dim)' }}>@{story.user?.username}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--adm-text-dim)', marginBottom: '8px' }}>
                                    {story.created_at} · Expires {story.expires_at}
                                </div>
                                <button className="adm-story-delete-btn" onClick={() => setDeleteTarget(story)}>
                                    <Trash2 size={11} style={{ marginRight: 4 }} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Story" size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-danger" onClick={handleDelete}>Delete Story</button>
                </>}
            >
                {deleteTarget && (
                    <div>
                        <p style={{ fontSize: '13px', marginBottom: 12 }}>
                            Remove this story by <strong>@{deleteTarget.user?.username}</strong>? This cannot be undone.
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Reason (Optional)</label>
                            <textarea className="adm-form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Document reason for removal..." />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ── Currents Tab ─────────────────────────────────────────────────── */
function CurrentsTab({ currents }) {
    const [termTarget, setTermTarget] = useState(null);
    const [reason, setReason] = useState('');

    const handleTerminate = () => {
        if (!termTarget) return;
        router.post('/admin/moderation/action', {
            content_type: 'live',
            content_id: termTarget.id,
            action: 'terminate',
            reason,
        }, {
            preserveState: true,
            onSuccess: () => { setTermTarget(null); setReason(''); },
        });
    };

    if (currents.length === 0) {
        return (
            <div className="adm-empty-state" style={{ padding: '60px 20px' }}>
                <Radio size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>No active live sessions</p>
            </div>
        );
    }

    return (
        <div>
            {currents.map(c => (
                <div key={c.id} className="adm-current-row">
                    {/* School avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0ea5e9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>
                        {c.school_image ? <img src={c.school_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.school_name?.charAt(0)}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.session_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--adm-text-dim)' }}>{c.school_name} · Host: {c.host}</div>
                        {c.track_playing && (
                            <div style={{ fontSize: 11, color: '#0ea5e9', marginTop: 2 }}>🎵 {c.track_playing}</div>
                        )}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{c.listener_count} listeners</div>
                        <div style={{ fontSize: 10, color: 'var(--adm-text-dim)' }}>{c.uptime}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <a href={`/schools/${c.school_id}?ghost=true`} target="_blank" rel="noreferrer"
                            className="adm-btn adm-btn-sm adm-btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={13} /> Ghost
                        </a>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => setTermTarget(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={13} /> Terminate
                        </button>
                    </div>
                </div>
            ))}

            <Modal isOpen={!!termTarget} onClose={() => setTermTarget(null)} title="Terminate Live Session" size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setTermTarget(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-danger" onClick={handleTerminate}>Terminate</button>
                </>}
            >
                {termTarget && (
                    <div>
                        <p style={{ fontSize: 13, marginBottom: 12 }}>
                            Immediately end <strong>{termTarget.session_name}</strong> hosted by {termTarget.host}?
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Reason</label>
                            <textarea className="adm-form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for termination..." />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ── Conversations Tab ────────────────────────────────────────────── */
function ConversationsTab() {
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const [convos, setConvos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inspectTarget, setInspectTarget] = useState(null);
    const [inspectReason, setInspectReason] = useState('');
    const [thread, setThread] = useState(null);
    const [threadLoading, setThreadLoading] = useState(false);

    const fetchConvos = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ search, type });
        const res = await fetch(`/admin/monitoring/conversations?${params}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await res.json();
        setConvos(data);
        setLoading(false);
    }, [search, type]);

    const handleInspect = async () => {
        if (!inspectTarget || inspectReason.trim().length < 5) return;
        setThreadLoading(true);
        const res = await fetch(`/admin/monitoring/conversations/${inspectTarget.id}/inspect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
            body: JSON.stringify({ reason: inspectReason }),
        });
        const data = await res.json();
        setThread(data);
        setThreadLoading(false);
    };

    return (
        <div>
            {/* Search & Filter Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-dim)' }} />
                    <input
                        className="adm-filter-input"
                        style={{ paddingLeft: 32 }}
                        placeholder="Search by username or name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchConvos()}
                    />
                </div>
                <select className="adm-filter-select" value={type} onChange={e => { setType(e.target.value); }}>
                    <option value="all">All Types</option>
                    <option value="dm">Direct Messages</option>
                    <option value="group">Group Chats</option>
                </select>
                <button className="adm-btn adm-btn-primary" onClick={fetchConvos} disabled={loading}>
                    {loading ? 'Loading...' : 'Search'}
                </button>
            </div>

            {/* Results */}
            {convos === null ? (
                <div className="adm-empty-state" style={{ padding: '60px 20px' }}>
                    <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>Search to browse all conversations</p>
                    <p style={{ fontSize: 12, color: 'var(--adm-text-dim)', marginTop: 4 }}>Every inspect is logged with your reason.</p>
                </div>
            ) : convos.data?.length === 0 ? (
                <div className="adm-empty-state" style={{ padding: '40px 20px' }}>No conversations found.</div>
            ) : (
                <div>
                    {(convos.data || []).map(conv => (
                        <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                            <div style={{ background: conv.type === 'group' ? '#7c3aed' : '#0ea5e9', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                {conv.type === 'group' ? 'GROUP' : 'DM'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                    {conv.name || conv.participants?.map(p => p.name).join(', ')}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--adm-text-dim)' }}>
                                    {conv.messages_count} messages · {conv.created_at}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {conv.participants?.slice(0, 3).map(p => <Avatar key={p.id} user={p} size={28} />)}
                            </div>
                            <button
                                className="adm-btn adm-btn-sm adm-btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => { setInspectTarget(conv); setThread(null); setInspectReason(''); }}
                            >
                                <Eye size={13} /> Inspect
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Inspect Modal */}
            <Modal
                isOpen={!!inspectTarget}
                onClose={() => { setInspectTarget(null); setThread(null); setInspectReason(''); }}
                title={thread ? `Thread: ${inspectTarget?.name || 'Conversation'}` : 'Inspect Conversation'}
                size="lg"
            >
                {inspectTarget && !thread && (
                    <div>
                        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 12, lineHeight: 1.6 }}>
                                    <strong>Caution:</strong> You are about to inspect a private conversation. This action will be permanently logged with your name, reason, timestamp, and IP address.
                                </p>
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Participants</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {inspectTarget.participants?.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--adm-bg-alt)', padding: '6px 10px', borderRadius: 6 }}>
                                        <Avatar user={p} size={22} />
                                        <span style={{ fontSize: 12 }}>@{p.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Reason for Inspection <span style={{ color: '#dc2626' }}>*</span></label>
                            <textarea
                                className="adm-form-textarea"
                                value={inspectReason}
                                onChange={e => setInspectReason(e.target.value)}
                                placeholder="Document why you need to view this conversation (min. 5 characters)..."
                                rows={3}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button className="adm-btn adm-btn-outline" onClick={() => setInspectTarget(null)}>Cancel</button>
                            <button
                                className="adm-btn adm-btn-primary"
                                onClick={handleInspect}
                                disabled={inspectReason.trim().length < 5 || threadLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Eye size={14} />
                                {threadLoading ? 'Loading...' : 'Inspect Thread'}
                            </button>
                        </div>
                    </div>
                )}

                {thread && (
                    <div>
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={14} color="#10b981" />
                            <span style={{ fontSize: 11 }}>This inspection has been logged.</span>
                        </div>
                        <div className="adm-inspect-thread">
                            {(thread.messages || []).map(msg => (
                                <div key={msg.id} className="adm-msg-bubble">
                                    <Avatar user={msg.sender} size={28} />
                                    <div className="adm-msg-bubble-content">
                                        <div className="adm-msg-sender">@{msg.sender?.username}</div>
                                        <div className="adm-msg-text">{msg.content || <em style={{ color: 'var(--adm-text-dim)' }}>[Media / Attachment]</em>}</div>
                                        <div className="adm-msg-time">{msg.created_at}</div>
                                    </div>
                                </div>
                            ))}
                            {thread.messages?.length === 0 && (
                                <div className="adm-empty-state">No messages in this conversation.</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ── Call Logs Tab ────────────────────────────────────────────────── */
function CallLogsTab() {
    const [logs, setLogs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [restrictTarget, setRestrictTarget] = useState(null);
    const [reason, setReason] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        const res = await fetch('/admin/monitoring/call-logs', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const data = await res.json();
        setLogs(data);
        setLoading(false);
    };

    const handleRestrict = async () => {
        if (!restrictTarget) return;
        await fetch(`/admin/monitoring/calls/${restrictTarget.id}/restrict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
            body: JSON.stringify({ reason }),
        });
        setRestrictTarget(null);
        setReason('');
        fetchLogs();
    };

    return (
        <div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="adm-btn adm-btn-primary" onClick={fetchLogs} disabled={loading}>
                    {loading ? 'Loading...' : 'Load Call Logs'}
                </button>
                <span style={{ fontSize: 12, color: 'var(--adm-text-dim)' }}>Metadata only — no audio/video content is captured.</span>
            </div>

            {logs === null ? (
                <div className="adm-empty-state" style={{ padding: '60px 20px' }}>
                    <Phone size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>Click "Load Call Logs" to view call metadata</p>
                </div>
            ) : (
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>INITIATED BY</th>
                                <th>TYPE</th>
                                <th>DURATION</th>
                                <th>PARTICIPANTS</th>
                                <th>STARTED</th>
                                <th>END REASON</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(logs.data || []).length === 0 ? (
                                <tr><td colSpan={7} className="adm-empty-state">No call logs yet.</td></tr>
                            ) : (logs.data || []).map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="adm-table-cell-user">
                                            <Avatar user={log.initiated_by} size={30} />
                                            <div>
                                                <div className="adm-table-cell-bold">{log.initiated_by?.name}</div>
                                                <div className="adm-table-cell-sub">@{log.initiated_by?.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>
                                            {log.call_type === 'video' ? <Video size={13} /> : <Phone size={13} />}
                                            {log.call_type?.toUpperCase()}
                                            {log.is_group_call && <span style={{ fontSize: 9, background: '#7c3aed', color: '#fff', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>GROUP</span>}
                                        </span>
                                    </td>
                                    <td className="adm-table-cell-bold">{log.duration || '0s'}</td>
                                    <td className="adm-table-cell-sub">{log.participant_count} people</td>
                                    <td className="adm-table-cell-sub" style={{ whiteSpace: 'nowrap' }}>{log.started_at}</td>
                                    <td>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                            background: log.end_reason === 'admin_terminated' ? '#fef2f2' : '#f0fdf4',
                                            color: log.end_reason === 'admin_terminated' ? '#dc2626' : '#15803d',
                                            textTransform: 'uppercase',
                                        }}>
                                            {log.end_reason?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="adm-btn adm-btn-sm adm-btn-outline"
                                            style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 10 }}
                                            onClick={() => setRestrictTarget(log)}>
                                            Restrict
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={!!restrictTarget} onClose={() => setRestrictTarget(null)} title="Restrict Caller" size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setRestrictTarget(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-danger" onClick={handleRestrict}>Restrict Calling</button>
                </>}
            >
                {restrictTarget && (
                    <div>
                        <p style={{ fontSize: 13, marginBottom: 12 }}>
                            Prevent <strong>@{restrictTarget.initiated_by?.username}</strong> from initiating any future calls?
                        </p>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Reason</label>
                            <textarea className="adm-form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Document reason..." />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function Monitoring({ stats, stories = [], currents = [] }) {
    const [activeTab, setActiveTab] = useState('stories');

    const tabs = [
        { key: 'stories',    label: 'Active Stories',   icon: <ImageIcon size={14} />,    count: stats?.activeStories },
        { key: 'currents',   label: 'Live Sessions',    icon: <Radio size={14} />,        count: stats?.activeLives },
        { key: 'convos',     label: 'Conversations',    icon: <MessageSquare size={14} />, count: null },
        { key: 'calls',      label: 'Call Logs',        icon: <Phone size={14} />,        count: null },
    ];

    return (
        <>
            {/* Stat Cards */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
                <div className="adm-stat-card">
                    <div className="adm-stat-label"><ImageIcon size={13} style={{ marginRight: 6, opacity: 0.6 }} />Active Stories</div>
                    <div className="adm-stat-value-row"><div className="adm-stat-value">{stats?.activeStories ?? 0}</div></div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-label"><Clock size={13} style={{ marginRight: 6, opacity: 0.6 }} />Expired (7d)</div>
                    <div className="adm-stat-value-row"><div className="adm-stat-value">{stats?.expiredLast7d ?? 0}</div></div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-label"><Radio size={13} style={{ marginRight: 6, opacity: 0.6 }} />Live Sessions</div>
                    <div className="adm-stat-value-row">
                        <div className="adm-stat-value" style={{ color: stats?.activeLives > 0 ? '#10b981' : undefined }}>
                            {stats?.activeLives ?? 0}
                        </div>
                    </div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-label"><Eye size={13} style={{ marginRight: 6, opacity: 0.6 }} />Inspections Today</div>
                    <div className="adm-stat-value-row"><div className="adm-stat-value">{stats?.inspectionsToday ?? 0}</div></div>
                </div>
            </div>

            {/* Tab Card */}
            <div className="adm-card">
                <div className="adm-card-header" style={{ paddingBottom: 0 }}>
                    <h3>Content Monitoring</h3>
                    <p style={{ fontSize: 12, color: 'var(--adm-text-dim)', marginTop: 4 }}>
                        Monitor active stories, live sessions, conversations, and call logs. All inspections are permanently audited.
                    </p>
                </div>

                {/* Tabs */}
                <div className="adm-tabs" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--adm-border)' }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`adm-tab ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            {t.icon} {t.label}
                            {t.count !== null && t.count !== undefined && (
                                <span className="adm-tab-badge">({t.count})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'stories'  && <StoriesTab stories={stories} />}
                {activeTab === 'currents' && <CurrentsTab currents={currents} />}
                {activeTab === 'convos'   && <ConversationsTab />}
                {activeTab === 'calls'    && <CallLogsTab />}
            </div>
        </>
    );
}

Monitoring.layout = (page) => <AdminLayout currentPage="Admin/Monitoring">{page}</AdminLayout>;

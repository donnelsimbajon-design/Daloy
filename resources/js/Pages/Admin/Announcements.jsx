import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/UI/Modal';
import { Pencil, Radio, BarChart3, Archive, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';

/* ── Type & Status configuration ── */
const TYPE_CONFIG = {
    info:        { bg: '#eff6ff', color: '#1d4ed8', label: 'Info' },
    warning:     { bg: '#fefce8', color: '#a16207', label: 'Warning' },
    critical:    { bg: '#fef2f2', color: '#dc2626', label: 'Critical' },
    maintenance: { bg: '#fff7ed', color: '#c2410c', label: 'Maintenance' },
    feature:     { bg: '#f0fdfa', color: '#0f766e', label: 'Feature' },
};

const STATUS_CONFIG = {
    active:      { bg: '#f0fdf4', color: '#15803d' },
    scheduled:   { bg: '#eff6ff', color: '#1d4ed8' },
    draft:       { bg: '#f9fafb', color: '#374151' },
    expired:     { bg: '#f0f0f0', color: '#888888' },
    deactivated: { bg: '#fef2f2', color: '#dc2626' },
};

function TypeBadge({ type }) {
    const c = TYPE_CONFIG[type] || { bg: '#f0f0f0', color: '#888', label: type };
    return <span className="adm-type-badge" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
}

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || { bg: '#f0f0f0', color: '#888' };
    return <span className="adm-category-badge" style={{ background: c.bg, color: c.color }}>{status}</span>;
}

const EMPTY_FORM = {
    title: '', message: '', type: 'info',
    target_audience: 'all', school_id: '',
    display_location: 'ripple',
    use_schedule: false, scheduled_at: '', expires_at: '',
};

export default function Announcements({ announcements, stats = {}, schools = [], filters = {} }) {
    const [typeFilter, setTypeFilter]     = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [from, setFrom]                 = useState(filters.from || '');
    const [to, setTo]                     = useState(filters.to || '');
    const [createModal, setCreateModal]   = useState(false);
    const [editModal, setEditModal]       = useState(null);
    const [statsModal, setStatsModal]     = useState(null);
    const [statsData, setStatsData]       = useState(null);
    const [form, setForm]                 = useState(EMPTY_FORM);
    const [saving, setSaving]             = useState(false);

    const applyFilters = useCallback(
        (overrides = {}) => {
            router.get('/admin/announcements', { type: typeFilter, status: statusFilter, from, to, ...overrides }, { preserveState: true, replace: true });
        },
        [typeFilter, statusFilter, from, to]
    );

    const handleSave = () => {
        setSaving(true);
        const payload = { ...form, scheduled_at: form.use_schedule ? form.scheduled_at : null };
        const isEdit = !!editModal;
        const method = isEdit ? 'put' : 'post';
        const url    = isEdit ? `/admin/announcements/${editModal.id}` : '/admin/announcements';

        router[method](url, payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => { setCreateModal(false); setEditModal(null); setForm(EMPTY_FORM); },
        });
    };

    const handleBroadcast = (id) => {
        if (!confirm('Broadcast this announcement now?')) return;
        router.post(`/admin/announcements/${id}/broadcast`, {}, { preserveScroll: true });
    };

    const handleArchive = (id) => {
        if (!confirm('Archive this announcement? It will stop showing to users.')) return;
        router.delete(`/admin/announcements/${id}`, { preserveScroll: true });
    };

    const handleDelete = (id) => {
        if (!confirm('Permanently delete this announcement? This completely removes it.')) return;
        router.delete(`/admin/announcements/${id}/force`, { preserveScroll: true });
    };

    const handleViewStats = async (announcement) => {
        setStatsModal(announcement);
        setStatsData(null);
        try {
            const res  = await fetch(`/admin/announcements/${announcement.id}/stats`);
            const data = await res.json();
            setStatsData(data);
        } catch {
            setStatsData({ sent_count: 0, read_count: 0, open_rate: 0, recent_readers: [] });
        }
    };

    const openEdit = (a) => {
        setForm({
            title: a.title, message: a.message, type: a.type,
            target_audience: a.target_audience, school_id: a.school_id || '',
            display_location: a.display_location,
            use_schedule: false, scheduled_at: '', expires_at: a.expires_at || '',
        });
        setEditModal(a);
    };

    const list = announcements?.data || [];

    return (
        <>
            {/* ── Stat Cards ── */}
            <div className="adm-stats-grid">
                {[
                    { label: 'TOTAL ANNOUNCEMENTS', value: stats.total },
                    { label: 'ACTIVE NOW',          value: stats.active },
                    { label: 'SCHEDULED',           value: stats.scheduled },
                    { label: 'AVG OPEN RATE',       value: `${stats.avgOpenRate ?? 0}%` },
                    { label: 'APPROVAL RATE',       value: `${stats.approval_rate ?? 0}%` },
                ].map((s) => (
                    <div key={s.label} className="adm-stat-card">
                        <div className="adm-stat-label">{s.label}</div>
                        <div className="adm-stat-value">{s.value ?? 0}</div>
                    </div>
                ))}
            </div>

            {/* ── Main Table Card ── */}
            <div className="adm-card">
                <div className="adm-toolbar">
                    <div className="adm-toolbar-left">
                        <select className="adm-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); applyFilters({ type: e.target.value }); }}>
                            <option value="">All Types</option>
                            {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select className="adm-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); applyFilters({ status: e.target.value }); }}>
                            <option value="">All Status</option>
                            {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="date" className="adm-filter-input" style={{ width: 140 }} value={from} onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }} />
                        <input type="date" className="adm-filter-input" style={{ width: 140 }} value={to} onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }} />
                    </div>
                    <div className="adm-toolbar-right">
                        <button className="adm-btn adm-btn-primary" onClick={() => { setForm(EMPTY_FORM); setCreateModal(true); }}>
                            + Create Announcement
                        </button>
                    </div>
                </div>

                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>TITLE</th>
                                <th>TYPE</th>
                                <th>TARGET</th>
                                <th>LOCATION</th>
                                <th>SENT</th>
                                <th>READ</th>
                                <th>OPEN RATE</th>
                                <th><ThumbsUp size={14} color="#15803d" /></th>
                                <th><ThumbsDown size={14} color="#dc2626" /></th>
                                <th>STATUS</th>
                                <th>SCHEDULED</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan={12} className="adm-empty-state">No announcements found</td></tr>
                            ) : list.map((a) => (
                                <tr key={a.id}>
                                    <td style={{ maxWidth: 200 }}>
                                        <div className="adm-table-cell-bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.title}</div>
                                        <div className="adm-table-cell-sub">by {a.created_by}</div>
                                    </td>
                                    <td><TypeBadge type={a.type} /></td>
                                    <td className="adm-table-cell-sub" style={{ textTransform: 'capitalize' }}>{a.target_audience?.replace('_', ' ')}</td>
                                    <td className="adm-table-cell-sub" style={{ textTransform: 'capitalize' }}>{a.display_location}</td>
                                    <td style={{ fontWeight: 700 }}>{(a.sent_count || 0).toLocaleString()}</td>
                                    <td>{(a.read_count || 0).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="adm-open-rate-bar">
                                                <div className="adm-open-rate-fill" style={{ width: `${Math.min(100, a.open_rate || 0)}%` }} />
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.open_rate || 0}%</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#15803d' }}>{a.upvote_count || 0}</td>
                                    <td style={{ fontWeight: 700, color: '#dc2626' }}>{a.downvote_count || 0}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td className="adm-table-cell-sub">{a.scheduled_at || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {a.sent_count === 0 && a.is_active && (
                                                <>
                                                    <button title="Edit" onClick={() => openEdit(a)} style={{ background: 'none', border: '1.5px solid var(--adm-border)', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-border-light)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                                                        <Pencil size={15} color="var(--adm-text-muted)" />
                                                    </button>
                                                    <button title="Broadcast" onClick={() => handleBroadcast(a.id)} style={{ background: 'var(--adm-black)', border: 'none', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                                        <Radio size={15} color="#fff" />
                                                    </button>
                                                </>
                                            )}
                                            <button title="Stats" onClick={() => handleViewStats(a)} style={{ background: 'none', border: '1.5px solid var(--adm-border)', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-border-light)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                                                <BarChart3 size={15} color="var(--adm-text-muted)" />
                                            </button>
                                            {a.is_active && (
                                                <button title="Archive" onClick={() => handleArchive(a.id)} style={{ background: 'none', border: '1.5px solid var(--adm-border)', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-border-light)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                                                    <Archive size={15} color="var(--adm-text-muted)" />
                                                </button>
                                            )}
                                            <button title="Delete" onClick={() => handleDelete(a.id)} style={{ background: 'none', border: '1.5px solid #fecaca', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                                                <Trash2 size={15} color="#dc2626" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            <Modal
                isOpen={createModal || !!editModal}
                onClose={() => { setCreateModal(false); setEditModal(null); }}
                title={editModal ? 'Edit Announcement' : 'Create Announcement'}
                size="lg"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => { setCreateModal(false); setEditModal(null); }}>Cancel</button>
                    <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : editModal ? 'Save Changes' : (form.use_schedule ? 'Schedule' : 'Create & Broadcast')}
                    </button>
                </>}
            >
                <AnnouncementForm form={form} setForm={setForm} schools={schools} />
            </Modal>

            {/* ── Stats Modal ── */}
            <Modal isOpen={!!statsModal} onClose={() => { setStatsModal(null); setStatsData(null); }} title={`Stats: ${statsModal?.title}`} size="lg">
                {!statsData ? (
                    <div className="adm-empty-state">Loading...</div>
                ) : (
                    <div>
                        {/* Delivery Stats */}
                        <div className="adm-stats-mini-grid" style={{ marginBottom: 20 }}>
                            {[
                                { label: 'Sent To', value: statsData.sent_count },
                                { label: 'Read',    value: statsData.read_count },
                                { label: 'Open Rate', value: `${statsData.open_rate}%` },
                            ].map((s) => (
                                <div key={s.label} className="adm-stat-card" style={{ textAlign: 'center', padding: 16 }}>
                                    <div className="adm-stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                                    <div className="adm-stat-sub">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ height: 8, background: 'var(--adm-border-light)', borderRadius: 4, marginBottom: 24 }}>
                            <div style={{ height: '100%', borderRadius: 4, background: 'var(--adm-black)', width: `${Math.min(100, statsData.open_rate)}%`, transition: 'width 0.4s' }} />
                        </div>

                        {/* ── Vote Breakdown ── */}
                        <div className="adm-permission-category-label">User Votes</div>
                        <div className="adm-stats-mini-grid" style={{ marginBottom: 12 }}>
                            <div className="adm-stat-card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #15803d' }}>
                                <div className="adm-stat-value" style={{ fontSize: 28, color: '#15803d' }}>{statsData.upvotes ?? 0}</div>
                                <div className="adm-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ThumbsUp size={13} /> Upvotes</div>
                            </div>
                            <div className="adm-stat-card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #dc2626' }}>
                                <div className="adm-stat-value" style={{ fontSize: 28, color: '#dc2626' }}>{statsData.downvotes ?? 0}</div>
                                <div className="adm-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ThumbsDown size={13} /> Downvotes</div>
                            </div>
                            <div className="adm-stat-card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #2563eb' }}>
                                <div className="adm-stat-value" style={{ fontSize: 28, color: '#2563eb' }}>
                                    {statsData.approval_rate !== null ? `${statsData.approval_rate}%` : '—'}
                                </div>
                                <div className="adm-stat-sub">Approval Rate</div>
                            </div>
                        </div>

                        {/* Visual vote bar */}
                        {(statsData.total_votes ?? 0) > 0 && (
                            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 12, marginBottom: 24 }}>
                                <div style={{ width: `${(statsData.upvotes / statsData.total_votes) * 100}%`, background: '#22c55e', transition: 'width 0.4s' }} />
                                <div style={{ width: `${(statsData.downvotes / statsData.total_votes) * 100}%`, background: '#ef4444', transition: 'width 0.4s' }} />
                            </div>
                        )}

                        {/* ── User Feedback ── */}
                        <div className="adm-permission-category-label" style={{ marginTop: 8 }}>User Feedback</div>
                        {(!statsData.feedback || statsData.feedback.length === 0) ? (
                            <p className="adm-table-cell-sub" style={{ padding: '8px 0' }}>No feedback submitted yet</p>
                        ) : (
                            <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 20 }}>
                                {statsData.feedback.map((f, i) => (
                                    <div key={i} className="adm-location-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--adm-border-light)' }}>
                                        {f.avatar ? (
                                            <img src={f.avatar.startsWith('http') ? f.avatar : `/storage/${f.avatar}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <div className="adm-table-cell-user-avatar" style={{ flexShrink: 0 }}>{f.name?.charAt(0)?.toUpperCase()}</div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <span className="adm-table-cell-bold" style={{ fontSize: 13 }}>{f.name}</span>
                                                <span className="adm-table-cell-sub" style={{ fontSize: 11 }}>@{f.username}</span>
                                                {f.vote === 'upvote' && <ThumbsUp size={13} color="#15803d" />}
                                                {f.vote === 'downvote' && <ThumbsDown size={13} color="#dc2626" />}
                                            </div>
                                            <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', margin: 0, lineHeight: 1.5 }}>{f.feedback}</p>
                                            <span className="adm-table-cell-sub" style={{ fontSize: 10 }}>{f.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Recent Readers ── */}
                        <div className="adm-permission-category-label">Recent Readers</div>
                        {(statsData.recent_readers || []).length === 0 ? (
                            <p className="adm-table-cell-sub">No reads yet</p>
                        ) : statsData.recent_readers.map((r, i) => (
                            <div key={i} className="adm-location-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="adm-table-cell-user-avatar">{r.name?.charAt(0)?.toUpperCase()}</div>
                                    <div>
                                        <div className="adm-table-cell-bold">{r.name}</div>
                                        <div className="adm-table-cell-sub">@{r.username} · {r.read_at}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}

/* ── Announcement Form Component ── */
function AnnouncementForm({ form, setForm, schools }) {
    const upd = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    const charCount = form.message.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="adm-form-group">
                <label className="adm-form-label">Title <span className="adm-table-cell-sub">(max 150)</span></label>
                <input className="adm-form-input" value={form.title} maxLength={150} onChange={(e) => upd('title', e.target.value)} placeholder="Announcement title..." />
            </div>

            <div className="adm-form-group">
                <label className="adm-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Message <span style={{ color: charCount > 1900 ? 'var(--adm-danger)' : undefined }}>{charCount}/2000</span>
                </label>
                <textarea className="adm-form-textarea" value={form.message} maxLength={2000} onChange={(e) => upd('message', e.target.value)} placeholder="Announcement message..." style={{ height: 100 }} />
            </div>

            <div className="adm-form-row">
                <div className="adm-form-group">
                    <label className="adm-form-label">Type</label>
                    <select className="adm-form-select" value={form.type} onChange={(e) => upd('type', e.target.value)}>
                        {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>
                <div className="adm-form-group">
                    <label className="adm-form-label">Target Audience</label>
                    <select className="adm-form-select" value={form.target_audience} onChange={(e) => upd('target_audience', e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="new_users">New Users (30d)</option>
                        <option value="active_users">Active Users (7d)</option>
                        <option value="specific_school">Specific School</option>
                    </select>
                </div>
            </div>

            {form.target_audience === 'specific_school' && (
                <div className="adm-form-group">
                    <label className="adm-form-label">Select School</label>
                    <select className="adm-form-select" value={form.school_id} onChange={(e) => upd('school_id', e.target.value)}>
                        <option value="">Choose school...</option>
                        {(schools || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

            <div className="adm-form-group">
                <label className="adm-form-label">Display Location</label>
                <select className="adm-form-select" value={form.display_location} onChange={(e) => upd('display_location', e.target.value)}>
                    <option value="ripple">Ripple Notification Only</option>
                    <option value="feed">Feed Only</option>
                    <option value="banner">Banner Only</option>
                    <option value="all">All Locations</option>
                </select>
            </div>

            <div className="adm-form-row">
                <div className="adm-form-group">
                    <label className="adm-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={form.use_schedule} onChange={(e) => upd('use_schedule', e.target.checked)} />
                        Schedule for later
                    </label>
                    {form.use_schedule && (
                        <input className="adm-form-input" type="datetime-local" value={form.scheduled_at} onChange={(e) => upd('scheduled_at', e.target.value)} style={{ marginTop: 8 }} />
                    )}
                </div>
                <div className="adm-form-group">
                    <label className="adm-form-label">Expires At (optional)</label>
                    <input className="adm-form-input" type="datetime-local" value={form.expires_at} onChange={(e) => upd('expires_at', e.target.value)} />
                </div>
            </div>

            {/* Preview */}
            <div className="adm-preview-box">
                <div className="adm-permission-category-label">Preview</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 18 }}>📣</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                            {form.title || 'Announcement Title'}{' '}
                            <TypeBadge type={form.type} />
                        </div>
                        <div className="adm-table-cell-sub" style={{ lineHeight: 1.5 }}>
                            {form.message || 'Your message will appear here…'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

Announcements.layout = (page) => <AdminLayout currentPage="Admin/Announcements">{page}</AdminLayout>;

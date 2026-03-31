import { useState, useCallback } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/UI/Modal';
import { router, Link } from '@inertiajs/react';

/* ── Category colour palette ── */
const CATEGORIES = {
    account:  { bg: '#eff6ff', color: '#1d4ed8', label: 'Account' },
    post:     { bg: '#f0fdf4', color: '#15803d', label: 'Post' },
    reaction: { bg: '#fdf2f8', color: '#9d174d', label: 'Reaction' },
    story:    { bg: '#f5f3ff', color: '#7e22ce', label: 'Story' },
    social:   { bg: '#f5f3ff', color: '#7c3aed', label: 'Social' },
    block:    { bg: '#fef2f2', color: '#dc2626', label: 'Block' },
    message:  { bg: '#f0fdfa', color: '#0f766e', label: 'Message' },
    school:   { bg: '#fefce8', color: '#a16207', label: 'School' },
    event:    { bg: '#fff7ed', color: '#c2410c', label: 'Event' },
    report:   { bg: '#fef2f2', color: '#b45309', label: 'Report' },
    search:   { bg: '#f9fafb', color: '#374151', label: 'Search' },
};

function CategoryBadge({ category }) {
    const c = CATEGORIES[category] || { bg: '#f0f0f0', color: '#888', label: category };
    return (
        <span className="adm-category-badge" style={{ background: c.bg, color: c.color }}>
            {c.label}
        </span>
    );
}

const fmtAction = (type) =>
    type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

export default function Activity({ stats, logs, actionTypes, filters }) {
    const [search, setSearch]           = useState(filters?.user || '');
    const [category, setCategory]       = useState(filters?.category || '');
    const [actionType, setActionType]   = useState(filters?.action_type || '');
    const [from, setFrom]               = useState(filters?.from || '');
    const [to, setTo]                   = useState(filters?.to || '');
    const [selectedLog, setSelectedLog] = useState(null);

    const applyFilters = useCallback(
        (overrides = {}) => {
            router.get(
                '/admin/activity',
                { user: search, category, action_type: actionType, from, to, ...overrides },
                { preserveState: true, replace: true }
            );
        },
        [search, category, actionType, from, to]
    );

    const logList = logs?.data || [];

    return (
        <>
            {/* ── Stat Cards ── */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="adm-stat-card">
                    <div className="adm-stat-label">ACTIONS TODAY</div>
                    <div className="adm-stat-value-row">
                        <div className="adm-stat-value">{(stats?.totalToday ?? 0).toLocaleString()}</div>
                    </div>
                </div>

                <div className="adm-stat-card">
                    <div className="adm-stat-label">MOST ACTIVE TODAY</div>
                    <div className="adm-stat-value" style={{ fontSize: 18 }}>
                        {stats?.topUser ? `@${stats.topUser.username}` : '—'}
                    </div>
                    {stats?.topUser && (
                        <div className="adm-stat-sub">{stats.topUser.count} actions</div>
                    )}
                </div>

                <div className="adm-stat-card">
                    <div className="adm-stat-label">TOP ACTION TODAY</div>
                    <div className="adm-stat-value" style={{ fontSize: 16 }}>
                        {stats?.topAction ? fmtAction(stats.topAction.type) : '—'}
                    </div>
                    {stats?.topAction && (
                        <div className="adm-stat-sub">{stats.topAction.count}×</div>
                    )}
                </div>

                <div className="adm-stat-card">
                    <div className="adm-stat-label">ACTIONS THIS MONTH</div>
                    <div className="adm-stat-value">{(stats?.totalMonth ?? 0).toLocaleString()}</div>
                </div>
            </div>

            {/* ── Table Card ── */}
            <div className="adm-card">
                {/* Toolbar */}
                <div className="adm-toolbar">
                    <div className="adm-toolbar-left">
                        <input
                            className="adm-filter-input"
                            placeholder="Search by username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ user: search })}
                        />
                        <select
                            className="adm-filter-select"
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
                        >
                            <option value="">All Categories</option>
                            {Object.entries(CATEGORIES).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                        <select
                            className="adm-filter-select"
                            value={actionType}
                            onChange={(e) => { setActionType(e.target.value); applyFilters({ action_type: e.target.value }); }}
                        >
                            <option value="">All Action Types</option>
                            {(actionTypes || []).map((t) => (
                                <option key={t} value={t}>{fmtAction(t)}</option>
                            ))}
                        </select>
                        <input type="date" className="adm-filter-input" style={{ width: 140 }} value={from} onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }} />
                        <span className="adm-text-dim" style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>to</span>
                        <input type="date" className="adm-filter-input" style={{ width: 140 }} value={to} onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }} />
                    </div>
                    <div className="adm-toolbar-right">
                        <a
                            href={`/admin/activity/export?${new URLSearchParams({ category, action_type: actionType, from, to })}`}
                            className="adm-btn adm-btn-outline"
                            style={{ textDecoration: 'none' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Data Table */}
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>VOYAGER</th>
                                <th>ACTION</th>
                                <th>CATEGORY</th>
                                <th>TARGET</th>
                                <th>METADATA</th>
                                <th>IP ADDRESS</th>
                                <th>TIMESTAMP</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {logList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="adm-empty-state">
                                        No activity logs found
                                    </td>
                                </tr>
                            ) : logList.map((log) => (
                                <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                                    <td>
                                        <div className="adm-table-cell-user">
                                            <div className="adm-table-cell-user-avatar">
                                                {log.profile_picture
                                                    ? <img src={log.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (log.name?.charAt(0)?.toUpperCase() || '?')}
                                            </div>
                                            <div>
                                                <div className="adm-table-cell-bold">{log.name}</div>
                                                <div className="adm-table-cell-sub">@{log.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="adm-table-cell-bold">{fmtAction(log.action_type)}</span></td>
                                    <td><CategoryBadge category={log.action_category} /></td>
                                    <td className="adm-table-cell-sub">
                                        {log.target_type ? `${log.target_type} #${log.target_id}` : '—'}
                                    </td>
                                    <td style={{ maxWidth: 180 }}>
                                        {log.metadata ? (
                                            <code className="adm-table-cell-sub" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                                {JSON.stringify(log.metadata).substring(0, 60)}…
                                            </code>
                                        ) : '—'}
                                    </td>
                                    <td><code className="adm-table-cell-sub">{log.ip_address || '—'}</code></td>
                                    <td className="adm-table-cell-sub" style={{ whiteSpace: 'nowrap' }}>
                                        <div>{log.created_at?.split(' ')[0]}</div>
                                        <div style={{ color: 'var(--adm-text-dim)' }}>{log.time_ago}</div>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/admin/activity/${log.user_id}`}
                                            className="adm-btn adm-btn-sm adm-btn-outline"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            Timeline
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs?.links?.length > 3 && (
                    <div className="adm-pagination">
                        <span className="adm-pagination-info">
                            SHOWING {logs.from || 0} TO {logs.to || 0} OF {logs.total || 0} EVENTS
                        </span>
                        <div className="adm-pagination-links">
                            {logs.links.map((link, i) => (
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
            </div>

            {/* ── Detail Modal ── */}
            <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Activity Log Detail" size="lg">
                {selectedLog && (
                    <div>
                        <div className="adm-form-row" style={{ marginBottom: 16 }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Voyager</label>
                                <p>@{selectedLog.username} — {selectedLog.name}</p>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Action</label>
                                <p>{fmtAction(selectedLog.action_type)}</p>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Category</label>
                                <p><CategoryBadge category={selectedLog.action_category} /></p>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Target</label>
                                <p>{selectedLog.target_type ? `${selectedLog.target_type} #${selectedLog.target_id}` : '—'}</p>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">IP Address</label>
                                <p><code>{selectedLog.ip_address || '—'}</code></p>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Timestamp</label>
                                <p>{selectedLog.created_at}</p>
                            </div>
                        </div>
                        <div className="adm-form-group">
                            <label className="adm-form-label">Metadata</label>
                            <pre className="adm-preview-box" style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                                {selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : 'null'}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

Activity.layout = (page) => <AdminLayout currentPage="Admin/Activity">{page}</AdminLayout>;

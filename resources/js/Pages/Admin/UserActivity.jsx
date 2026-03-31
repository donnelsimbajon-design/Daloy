import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

/* ── Category palette (shared with Activity.jsx) ── */
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
    return <span className="adm-category-badge" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
}

const fmtAction = (t) => t?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

export default function UserActivity({ user, logs, totalActions, categoryBreakdown }) {
    const logList = logs?.data || [];

    return (
        <>
            {/* ── Back Link ── */}
            <div style={{ marginBottom: 20 }}>
                <Link href="/admin/activity" className="adm-btn adm-btn-outline" style={{ textDecoration: 'none' }}>
                    ← Back to Activity Log
                </Link>
            </div>

            {/* ── User Profile Card ── */}
            <div className="adm-card" style={{ marginBottom: 20 }}>
                <div className="adm-user-profile-header">
                    <div className="adm-table-cell-user-avatar" style={{ width: 52, height: 52, fontSize: 20, fontWeight: 700 }}>
                        {user?.profile_picture
                            ? <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div>
                        <div className="adm-table-cell-sub">@{user?.username} · {user?.email}</div>
                        <div style={{ color: 'var(--adm-text-dim)', fontSize: 12, marginTop: 2 }}>Joined {user?.joined}</div>
                    </div>
                    <div className="adm-user-profile-stat">
                        <div className="adm-user-profile-stat-value">{(totalActions ?? 0).toLocaleString()}</div>
                        <div className="adm-user-profile-stat-label">Total Actions</div>
                    </div>
                </div>
            </div>

            {/* ── Category Breakdown ── */}
            <div className="adm-breakdown-grid">
                {Object.entries(categoryBreakdown || {}).map(([cat, count]) => (
                    <div key={cat} className="adm-stat-card" style={{ padding: '12px 14px' }}>
                        <CategoryBadge category={cat} />
                        <div className="adm-stat-value" style={{ fontSize: 22, marginTop: 6 }}>{count}</div>
                    </div>
                ))}
            </div>

            {/* ── Timeline Table ── */}
            <div className="adm-card">
                <div className="adm-card-header"><h3>Activity Timeline</h3></div>
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>ACTION</th>
                                <th>CATEGORY</th>
                                <th>TARGET</th>
                                <th>METADATA</th>
                                <th>IP</th>
                                <th>WHEN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logList.length === 0 ? (
                                <tr><td colSpan={6} className="adm-empty-state">No activity found</td></tr>
                            ) : logList.map((log) => (
                                <tr key={log.id}>
                                    <td><span className="adm-table-cell-bold">{fmtAction(log.action_type)}</span></td>
                                    <td><CategoryBadge category={log.action_category} /></td>
                                    <td className="adm-table-cell-sub">{log.target_type ? `${log.target_type} #${log.target_id}` : '—'}</td>
                                    <td style={{ maxWidth: 200 }}>
                                        {log.metadata ? (
                                            <code className="adm-table-cell-sub" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                                {JSON.stringify(log.metadata).substring(0, 60)}
                                            </code>
                                        ) : '—'}
                                    </td>
                                    <td><code className="adm-table-cell-sub">{log.ip_address || '—'}</code></td>
                                    <td className="adm-table-cell-sub">
                                        <div>{log.time_ago}</div>
                                        <div style={{ color: 'var(--adm-text-dim)', fontSize: 11 }}>{log.created_at?.split(' ')[0]}</div>
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
                            {logs.from || 0} – {logs.to || 0} of {logs.total || 0}
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
        </>
    );
}

UserActivity.layout = (page) => <AdminLayout currentPage="Admin/UserActivity">{page}</AdminLayout>;

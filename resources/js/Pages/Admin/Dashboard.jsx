import { useState, useMemo } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatCard from '../../Components/Admin/UI/StatCard';
import BarChart from '../../Components/Admin/Features/BarChart';
import { Link, usePage } from '@inertiajs/react';
import { Shield, Flag, MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Activity, ArrowRight } from 'lucide-react';

export default function Dashboard({ stats = {}, engagementData = [], recentActions = [], alerts = [], moderationStats = {}, myActions = [] }) {
    const { admin_context } = usePage().props;
    const [chartRange, setChartRange] = useState('30');

    const isSuperAdmin = admin_context?.is_super_admin || admin_context?.permissions?.includes('*');

    // Check permission helper
    const hasPerm = (category) => {
        if (isSuperAdmin) return true;
        if (!admin_context?.permissions) return false;
        return admin_context.permissions.some(p => p === category || p.startsWith(category + '.'));
    };

    const fmtNum = (n) => {
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    };

    const chartLabels = useMemo(() => engagementData.map(d => d.label), [engagementData]);
    const chartData = useMemo(() => [
        { label: 'Posts', values: engagementData.map(d => d.posts || 0) },
        { label: 'Comments', values: engagementData.map(d => d.comments || 0) },
    ], [engagementData]);

    return (
        <>
            {/* ── Welcome Header ── */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
                        {isSuperAdmin ? 'System Overview' : 'Moderation Dashboard'}
                    </h2>
                    <p style={{ fontSize: 13, color: '#888' }}>
                        {isSuperAdmin
                            ? 'Complete platform analytics and system health.'
                            : `Welcome back. Here's your moderation queue status.`}
                    </p>
                </div>
                {admin_context?.role && (
                    <span style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: (admin_context.role_color || '#111') + '18',
                        color: admin_context.role_color || '#111',
                        border: `1px solid ${admin_context.role_color || '#111'}33`,
                    }}>
                        {admin_context.role}
                    </span>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                 MODERATOR VIEW — Focused on reports & moderation queue
                 Shows when admin does NOT have full system/analytics access
                 ══════════════════════════════════════════════════════════ */}
            {!isSuperAdmin && (
                <>
                    {/* Moderation Stat Cards */}
                    <div className="adm-stats-grid">
                        <div className="adm-stat-card">
                            <div className="adm-stat-label">
                                <Clock size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                                Pending Reports
                            </div>
                            <div className="adm-stat-value-row">
                                <span className="adm-stat-value" style={{ color: moderationStats.pending_reports > 0 ? '#f59e0b' : '#10b981' }}>
                                    {moderationStats.pending_reports || 0}
                                </span>
                            </div>
                        </div>
                        <div className="adm-stat-card">
                            <div className="adm-stat-label">
                                <CheckCircle size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                                Resolved Today
                            </div>
                            <div className="adm-stat-value-row">
                                <span className="adm-stat-value" style={{ color: '#10b981' }}>{moderationStats.resolved_today || 0}</span>
                            </div>
                        </div>
                        <div className="adm-stat-card">
                            <div className="adm-stat-label">
                                <XCircle size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                                Dismissed Today
                            </div>
                            <div className="adm-stat-value-row">
                                <span className="adm-stat-value">{moderationStats.dismissed_today || 0}</span>
                            </div>
                        </div>
                        <div className="adm-stat-card">
                            <div className="adm-stat-label">
                                <Flag size={14} style={{ marginRight: 6, opacity: 0.6 }} />
                                Reports This Week
                            </div>
                            <div className="adm-stat-value-row">
                                <span className="adm-stat-value">{moderationStats.total_reports_week || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Moderation Queue Breakdown + My Actions */}
                    <div className="adm-dashboard-grid">
                        {/* Queue Breakdown */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <h3>Moderation Queue</h3>
                            </div>
                            <div className="adm-card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Flagged Conversations */}
                                    <Link href="/admin/messages" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', background: 'var(--adm-bg-secondary, #f7f7f8)',
                                            border: '1px solid var(--adm-border, #e5e5e5)', borderRadius: 8,
                                            cursor: 'pointer', transition: 'border-color 0.15s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <MessageSquare size={18} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>Flagged Conversations</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>Reported chats needing review</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 20, fontWeight: 800, color: moderationStats.flagged_conversations > 0 ? '#f59e0b' : '#10b981' }}>
                                                    {moderationStats.flagged_conversations || 0}
                                                </span>
                                                <ArrowRight size={16} style={{ color: '#ccc' }} />
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Flagged Posts */}
                                    <Link href="/admin/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', background: 'var(--adm-bg-secondary, #f7f7f8)',
                                            border: '1px solid var(--adm-border, #e5e5e5)', borderRadius: 8,
                                            cursor: 'pointer', transition: 'border-color 0.15s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <FileText size={18} style={{ color: '#dc2626' }} />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>Flagged Posts & Content</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>Reported posts, comments, and profiles</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 20, fontWeight: 800, color: moderationStats.flagged_posts > 0 ? '#dc2626' : '#10b981' }}>
                                                    {moderationStats.flagged_posts || 0}
                                                </span>
                                                <ArrowRight size={16} style={{ color: '#ccc' }} />
                                            </div>
                                        </div>
                                    </Link>

                                    {/* All Pending */}
                                    <Link href="/admin/reports?status=pending" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', background: 'var(--adm-bg-secondary, #f7f7f8)',
                                            border: '1px solid var(--adm-border, #e5e5e5)', borderRadius: 8,
                                            cursor: 'pointer', transition: 'border-color 0.15s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>Total Pending Queue</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>All unresolved reports across categories</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 20, fontWeight: 800, color: moderationStats.pending_reports > 0 ? '#f59e0b' : '#10b981' }}>
                                                    {moderationStats.pending_reports || 0}
                                                </span>
                                                <ArrowRight size={16} style={{ color: '#ccc' }} />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* My Recent Actions */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <h3>My Recent Actions</h3>
                            </div>
                            <div className="adm-card-body-flush">
                                {myActions.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                                        <Activity size={32} strokeWidth={1.2} style={{ marginBottom: 8, opacity: 0.4 }} />
                                        <p>No actions taken yet</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {myActions.map((action, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '12px 16px', borderBottom: '1px solid var(--adm-border, #f0f0f0)',
                                            }}>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                    background: action.action.includes('Delete') ? '#dc2626'
                                                        : action.action.includes('Resolve') ? '#10b981'
                                                        : action.action.includes('Dismiss') ? '#888'
                                                        : '#0ea5e9',
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{action.action}</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>{action.target}</div>
                                                </div>
                                                <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{action.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Alerts (for moderators too) */}
                    {alerts.length > 0 && (
                        <div className="adm-alert-panel" style={{ marginTop: 16 }}>
                            <div className="adm-alert-header">
                                <h4>Active Alerts</h4>
                                <span className="adm-alert-badge">{alerts.length} NEW</span>
                            </div>
                            {alerts.map(alert => (
                                <div key={alert.id} className="adm-alert-item">
                                    <AlertTriangle size={18} className={`adm-alert-icon ${alert.level}`} />
                                    <div className="adm-alert-content">
                                        <h5>{alert.title}</h5>
                                        <p>{alert.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════════════════
                 SUPER ADMIN VIEW — Full system overview
                 ══════════════════════════════════════════════════════════ */}
            {isSuperAdmin && (
                <>
                    {/* Stat Cards */}
                    <div className="adm-stats-grid">
                        <StatCard
                            label="Total Users"
                            value={fmtNum(stats.totalUsers || 0)}
                            change={`DAU: ${fmtNum(stats.dau || 0)}`}
                            changeType="up"
                        />
                        <StatCard
                            label="New Registrations"
                            value={fmtNum(stats.newRegistrations || 0)}
                            change={stats.regsChange > 0 ? `+${stats.regsChange}%` : `${stats.regsChange}%`}
                            changeType={stats.regsChange >= 0 ? 'up' : 'down'}
                        />
                        <StatCard
                            label="Posts Today"
                            value={fmtNum(stats.postsToday || 0)}
                            change={`${fmtNum(stats.totalPosts || 0)} total`}
                            changeType="up"
                        />
                        <StatCard
                            label="Pending Reports"
                            value={String(stats.pendingReports || 0)}
                            change={stats.pendingReports > 10 ? 'CRITICAL' : 'Normal'}
                            changeType={stats.pendingReports > 10 ? 'critical' : 'up'}
                        />
                    </div>

                    {/* Chart + System Health Row */}
                    <div className="adm-dashboard-grid">
                        {/* Engagement Metrics */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <div>
                                    <h3>Engagement Metrics</h3>
                                    <div className="adm-card-header-sub">Trailing 30-day interaction volume</div>
                                </div>
                                <div className="adm-toggle-group">
                                    <button className={`adm-toggle-btn ${chartRange === '30' ? 'active' : ''}`} onClick={() => setChartRange('30')}>30 Days</button>
                                    <button className={`adm-toggle-btn ${chartRange === '90' ? 'active' : ''}`} onClick={() => setChartRange('90')}>90 Days</button>
                                </div>
                            </div>
                            <div className="adm-card-body">
                                {chartLabels.length > 0 ? (
                                    <BarChart data={chartData} labels={chartLabels} height={240} />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>No engagement data yet</div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* System Health */}
                            <div className="adm-health-panel">
                                <div className="adm-health-header">
                                    <div className="adm-health-header-label">System Health</div>
                                    <div className="adm-health-status">
                                        <div className="adm-health-status-dot operational"></div>
                                        <span>Operational</span>
                                    </div>
                                </div>
                                <div className="adm-health-metrics">
                                    <div className="adm-health-metric">
                                        <span className="adm-health-metric-label">API Latency</span>
                                        <span className="adm-health-metric-value">24ms</span>
                                    </div>
                                    <div className="adm-health-metric">
                                        <span className="adm-health-metric-label">Server Load</span>
                                        <span className="adm-health-metric-value">14.2%</span>
                                    </div>
                                    <div className="adm-health-metric">
                                        <span className="adm-health-metric-label">Database IO</span>
                                        <span className="adm-health-metric-value">Optimal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Alerts */}
                            <div className="adm-alert-panel">
                                <div className="adm-alert-header">
                                    <h4>Active Alerts</h4>
                                    {alerts.length > 0 && <span className="adm-alert-badge">{alerts.length} NEW</span>}
                                </div>
                                {alerts.length === 0 ? (
                                    <div style={{ padding: '20px 16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                                        No active alerts
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} className="adm-alert-item">
                                            <AlertTriangle size={18} className={`adm-alert-icon ${alert.level}`} />
                                            <div className="adm-alert-content">
                                                <h5>{alert.title}</h5>
                                                <p>{alert.desc}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Administrative Actions */}
                    <div className="adm-card" style={{ marginBottom: '24px' }}>
                        <div className="adm-card-header">
                            <h3>Recent Administrative Actions</h3>
                            <Link href="/admin/logs" className="adm-link">View All Logs</Link>
                        </div>
                        <div className="adm-card-body-flush">
                            <div className="adm-table-wrapper">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>Subject</th>
                                            <th>Admin</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActions.length === 0 ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '24px' }}>No recent actions</td></tr>
                                        ) : (
                                            recentActions.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="adm-table-cell-bold">{row.action}</td>
                                                    <td>
                                                        <div className="adm-table-cell-user">
                                                            <div className="adm-table-cell-user-avatar">{(row.target || '?').charAt(0).toUpperCase()}</div>
                                                            {row.target}
                                                        </div>
                                                    </td>
                                                    <td>{row.admin}</td>
                                                    <td style={{ color: '#888' }}>{row.time}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="adm-info-grid">
                        <div className="adm-info-card dark">
                            <div className="adm-info-card-label">Network Infrastructure</div>
                            <div className="adm-info-card-value">Global Node Distribution</div>
                        </div>
                        <div className="adm-info-card light">
                            <div className="adm-info-card-label">Data Integrity</div>
                            <div className="adm-info-card-value">99.998% Hash Validation</div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

Dashboard.layout = (page) => <AdminLayout currentPage="Admin/Dashboard">{page}</AdminLayout>;

import { useState, useMemo } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatCard from '../../Components/Admin/UI/StatCard';
import BarChart from '../../Components/Admin/Features/BarChart';
import { Link } from '@inertiajs/react';

export default function Dashboard({ stats = {}, engagementData = [], recentActions = [], alerts = [] }) {
    const [chartRange, setChartRange] = useState('30');

    const fmtNum = (n) => {
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    };

    // Build chart data from dynamic engagement data
    const chartLabels = useMemo(() => engagementData.map(d => d.label), [engagementData]);
    const chartData = useMemo(() => [
        { label: 'Posts', values: engagementData.map(d => d.posts || 0) },
        { label: 'Comments', values: engagementData.map(d => d.comments || 0) },
    ], [engagementData]);

    return (
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
                                    <svg className={`adm-alert-icon ${alert.level}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
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
    );
}

Dashboard.layout = (page) => <AdminLayout currentPage="Admin/Dashboard">{page}</AdminLayout>;

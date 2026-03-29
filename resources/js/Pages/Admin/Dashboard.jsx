import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatCard from '../../Components/Admin/StatCard';
import BarChart from '../../Components/Admin/BarChart';

const recentActions = [
    { action: 'Account Suspended', subject: '@username_alpha', admin: 'Admin_Sarah', time: '2 mins ago' },
    { action: 'Policy Update', subject: 'Community Guidelines v2.4', admin: 'System_Automator', time: '14 mins ago' },
    { action: 'Flag Resolved', subject: 'Post #9230 (Hate Speech)', admin: 'Admin_Mark', time: '1 hour ago' },
    { action: 'API Key Created', subject: 'Integration_Partner_7', admin: 'Root_User', time: '3 hours ago' },
    { action: 'User Verified', subject: '@content_creator_42', admin: 'Admin_Sarah', time: '4 hours ago' },
    { action: 'Group Deleted', subject: 'Spam Group #891', admin: 'Admin_Mark', time: '5 hours ago' },
];

const alerts = [
    { id: 1, level: 'critical', title: 'Large Batch Deletion', desc: 'Moderator ID #492 removed 4,000 posts.' },
    { id: 2, level: 'warning', title: 'Brute Force Attempt', desc: '12 failed attempts from IP 192.168.1.1' },
];

const chartLabels30 = ['Oct 01', '', '', '', 'Oct 05', '', '', '', '', 'Oct 10', '', '', '', '', 'Oct 15', '', '', '', '', 'Oct 20', '', '', '', '', 'Oct 25', '', '', '', '', 'Today'];
const chartData30 = [
    { label: 'Posts', values: [30, 25, 35, 28, 40, 32, 38, 45, 42, 50, 48, 35, 40, 55, 60, 58, 62, 50, 48, 65, 70, 55, 60, 72, 68, 75, 80, 78, 82, 85] },
    { label: 'Comments', values: [20, 18, 22, 20, 28, 25, 30, 32, 28, 35, 30, 25, 28, 38, 42, 40, 45, 35, 32, 48, 50, 40, 42, 52, 48, 55, 58, 56, 60, 62] },
    { label: 'Reactions', values: [15, 12, 18, 14, 22, 18, 24, 28, 22, 30, 25, 20, 22, 32, 35, 32, 38, 28, 25, 40, 42, 35, 38, 45, 40, 48, 50, 48, 52, 55] },
];

const chartLabels90 = ['Jul', '', '', 'Aug', '', '', 'Sep', '', '', 'Oct', '', '', 'Today'];
const chartData90 = [
    { label: 'Posts', values: [40, 45, 50, 55, 48, 52, 58, 62, 65, 70, 75, 80, 85] },
    { label: 'Comments', values: [25, 28, 32, 35, 30, 34, 38, 42, 44, 48, 52, 56, 62] },
    { label: 'Reactions', values: [18, 20, 24, 28, 22, 26, 30, 34, 36, 40, 44, 48, 55] },
];

export default function Dashboard() {
    const [chartRange, setChartRange] = useState('30');

    return (
        <>
            {/* Stat Cards */}
            <div className="adm-stats-grid">
                <StatCard label="Daily Active Users" value="42.8k" change="+12% ↗" changeType="up" />
                <StatCard label="New Registrations" value="1,204" change="+5.2% ↗" changeType="up" />
                <StatCard label="Posts per Day" value="8.9k" change="-2.1% ↘" changeType="down" />
                <StatCard label="Pending Reports" value="64" change="CRITICAL" changeType="critical" />
            </div>

            {/* Chart + System Health Row */}
            <div className="adm-dashboard-grid">
                {/* Engagement Metrics */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <div>
                            <h3>Engagement Metrics</h3>
                            <div className="adm-card-header-sub">Trailing {chartRange}-day interaction volume</div>
                        </div>
                        <div className="adm-toggle-group">
                            <button className={`adm-toggle-btn ${chartRange === '30' ? 'active' : ''}`} onClick={() => setChartRange('30')}>30 Days</button>
                            <button className={`adm-toggle-btn ${chartRange === '90' ? 'active' : ''}`} onClick={() => setChartRange('90')}>90 Days</button>
                        </div>
                    </div>
                    <div className="adm-card-body">
                        <BarChart
                            data={chartRange === '30' ? chartData30 : chartData90}
                            labels={chartRange === '30' ? chartLabels30 : chartLabels90}
                            height={240}
                        />
                    </div>
                </div>

                {/* Right Column: System Health + Alerts */}
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
                            <span className="adm-alert-badge">2 NEW</span>
                        </div>
                        {alerts.map(alert => (
                            <div key={alert.id} className="adm-alert-item">
                                <svg className={`adm-alert-icon ${alert.level}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {alert.level === 'critical' ? (
                                        <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                                    ) : (
                                        <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                                    )}
                                </svg>
                                <div className="adm-alert-content">
                                    <h5>{alert.title}</h5>
                                    <p>{alert.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Administrative Actions */}
            <div className="adm-card" style={{ marginBottom: '24px' }}>
                <div className="adm-card-header">
                    <h3>Recent Administrative Actions</h3>
                    <a href="#logs" className="adm-link">View All Logs</a>
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
                                {recentActions.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="adm-table-cell-bold">{row.action}</td>
                                        <td>
                                            <div className="adm-table-cell-user">
                                                <div className="adm-table-cell-user-avatar">
                                                    {row.subject.charAt(0).toUpperCase()}
                                                </div>
                                                {row.subject}
                                            </div>
                                        </td>
                                        <td>{row.admin}</td>
                                        <td style={{ color: '#888' }}>{row.time}</td>
                                    </tr>
                                ))}
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

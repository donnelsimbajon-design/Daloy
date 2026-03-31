import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import BarChart from '../../Components/Admin/Features/BarChart';

export default function Analytics({ metrics = {}, userGrowth = [], reportTrends = [] }) {
    const [activeTab, setActiveTab] = useState('overview');

    const fmtNum = (n) => {
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n || 0);
    };

    const userGrowthLabels = userGrowth.map(d => d.label);
    const userGrowthData = [{ label: 'Users', values: userGrowth.map(d => d.count || 0) }];

    const reportLabels = reportTrends.map(d => d.label);
    const reportData = [
        { label: 'Reports', values: reportTrends.map(d => d.total || 0) },
        { label: 'Resolved', values: reportTrends.map(d => d.resolved || 0) },
    ];

    return (
        <>
            <div className="adm-tabs" style={{ background: 'white', borderRadius: '8px 8px 0 0', border: '1px solid #e5e5e5', borderBottom: 'none' }}>
                <button className={`adm-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`adm-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>Engagement</button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Daily Active Users</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.dau)}</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Monthly Active Users</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.mau)}</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Total Users</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.totalUsers)}</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Total Posts</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.totalPosts)}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="adm-card">
                            <div className="adm-card-header"><h3>User Growth (12 Months)</h3></div>
                            <div className="adm-card-body">
                                {userGrowthLabels.length > 0 ? (
                                    <BarChart data={userGrowthData} labels={userGrowthLabels} height={200} />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>No data yet</div>
                                )}
                            </div>
                        </div>
                        <div className="adm-card">
                            <div className="adm-card-header"><h3>Report Trends</h3></div>
                            <div className="adm-card-body">
                                {reportLabels.length > 0 ? (
                                    <BarChart data={reportData} labels={reportLabels} height={200} />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>No data yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'engagement' && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Posts Today</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.postsToday)}</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Comments Today</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.commentsToday)}</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Total Posts</div>
                            <div className="adm-metric-box-value">{fmtNum(metrics.totalPosts)}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Analytics.layout = (page) => <AdminLayout currentPage="Admin/Analytics">{page}</AdminLayout>;

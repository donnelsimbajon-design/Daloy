import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import BarChart from '../../Components/Admin/BarChart';

const trendingHashtags = [
    { tag: '#photography', posts: '12.4k', trend: '+18%' },
    { tag: '#daloy', posts: '9.8k', trend: '+12%' },
    { tag: '#techlife', posts: '7.2k', trend: '+8%' },
    { tag: '#fitness', posts: '6.1k', trend: '+5%' },
    { tag: '#music', posts: '5.5k', trend: '+3%' },
    { tag: '#travel', posts: '4.9k', trend: '-2%' },
    { tag: '#food', posts: '4.3k', trend: '+1%' },
    { tag: '#art', posts: '3.8k', trend: '+6%' },
];

const trendingUsers = [
    { name: 'Alice Rivera', followers: '45.2k', growth: '+340' },
    { name: 'David Kim', followers: '38.1k', growth: '+280' },
    { name: 'Iris Johnson', followers: '31.5k', growth: '+215' },
    { name: 'Grace Lee', followers: '28.9k', growth: '+190' },
    { name: 'Karen Park', followers: '22.3k', growth: '+145' },
];

const userGrowthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const userGrowthData = [{ label: 'Users', values: [12, 15, 18, 22, 28, 32, 38, 42, 48, 55, 62, 68] }];

const reportTrendLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const reportTrendData = [
    { label: 'Reports', values: [45, 52, 38, 64, 48, 55, 42, 71, 58, 49, 63, 57] },
    { label: 'Resolved', values: [40, 48, 35, 58, 44, 50, 38, 65, 52, 45, 58, 52] },
];

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <div className="adm-tabs" style={{ background: 'white', borderRadius: '8px 8px 0 0', border: '1px solid #e5e5e5', borderBottom: 'none' }}>
                <button className={`adm-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`adm-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>Engagement</button>
                <button className={`adm-tab ${activeTab === 'trending' ? 'active' : ''}`} onClick={() => setActiveTab('trending')}>Trending</button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Metric Boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Daily Active Users</div>
                            <div className="adm-metric-box-value">42.8k</div>
                            <div className="adm-metric-box-sub" style={{ color: '#10b981' }}>+12% from last week</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Monthly Active Users</div>
                            <div className="adm-metric-box-value">186k</div>
                            <div className="adm-metric-box-sub" style={{ color: '#10b981' }}>+8.4% from last month</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Engagement Rate</div>
                            <div className="adm-metric-box-value">6.8%</div>
                            <div className="adm-metric-box-sub" style={{ color: '#10b981' }}>+1.2% from average</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Avg. Session Duration</div>
                            <div className="adm-metric-box-value">8m 42s</div>
                            <div className="adm-metric-box-sub" style={{ color: '#dc2626' }}>-0.5% from last week</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* User Growth Chart */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <h3>User Growth (2026)</h3>
                            </div>
                            <div className="adm-card-body">
                                <BarChart data={userGrowthData} labels={userGrowthLabels} height={200} />
                            </div>
                        </div>
                        {/* Report Trends Chart */}
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <h3>Report Trends</h3>
                            </div>
                            <div className="adm-card-body">
                                <BarChart data={reportTrendData} labels={reportTrendLabels} height={200} />
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
                            <div className="adm-metric-box-value">8.9k</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Comments Today</div>
                            <div className="adm-metric-box-value">24.1k</div>
                        </div>
                        <div className="adm-metric-box">
                            <div className="adm-metric-box-label">Reactions Today</div>
                            <div className="adm-metric-box-value">67.3k</div>
                        </div>
                    </div>
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Post Activity (12 Months)</h3></div>
                        <div className="adm-card-body">
                            <BarChart
                                data={[
                                    { label: 'Posts', values: [5200, 5800, 6100, 6400, 7000, 7200, 7800, 8100, 8400, 8600, 8800, 8900] },
                                    { label: 'Comments', values: [14000, 15200, 16100, 17500, 18400, 19800, 20200, 21400, 22100, 23000, 23800, 24100] },
                                ]}
                                labels={userGrowthLabels}
                                height={240}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'trending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    {/* Trending Hashtags */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3>Trending Hashtags</h3>
                        </div>
                        <div className="adm-card-body-flush">
                            <table className="adm-table">
                                <thead><tr><th>#</th><th>Hashtag</th><th>Posts</th><th>Trend</th></tr></thead>
                                <tbody>
                                    {trendingHashtags.map((h, i) => (
                                        <tr key={i}>
                                            <td style={{ color: '#aaa', fontWeight: 600 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 700 }}>{h.tag}</td>
                                            <td>{h.posts}</td>
                                            <td style={{ color: h.trend.startsWith('+') ? '#10b981' : '#dc2626', fontWeight: 600 }}>{h.trend}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Trending Users */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3>Trending Users</h3>
                        </div>
                        <div className="adm-card-body-flush">
                            <table className="adm-table">
                                <thead><tr><th>#</th><th>User</th><th>Followers</th><th>New Followers</th></tr></thead>
                                <tbody>
                                    {trendingUsers.map((u, i) => (
                                        <tr key={i}>
                                            <td style={{ color: '#aaa', fontWeight: 600 }}>{i + 1}</td>
                                            <td>
                                                <div className="adm-table-cell-user">
                                                    <div className="adm-table-cell-user-avatar">{u.name.charAt(0)}</div>
                                                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                                                </div>
                                            </td>
                                            <td>{u.followers}</td>
                                            <td style={{ color: '#10b981', fontWeight: 600 }}>{u.growth}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Actions */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="adm-btn adm-btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export CSV
                </button>
                <button className="adm-btn adm-btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export PDF
                </button>
            </div>
        </>
    );
}

Analytics.layout = (page) => <AdminLayout currentPage="Admin/Analytics">{page}</AdminLayout>;

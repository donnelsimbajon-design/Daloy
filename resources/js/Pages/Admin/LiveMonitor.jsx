import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/UI/Modal';

/* ── Category dot colours for the feed ── */
const FEED_COLORS = {
    post: '#15803d', account: '#1d4ed8', social: '#7c3aed',
    message: '#0f766e', school: '#a16207', event: '#c2410c',
};

export default function LiveMonitor({ initialMetrics }) {
    const [metrics, setMetrics]           = useState(initialMetrics || {});
    const [feed, setFeed]                 = useState(initialMetrics?.feed || []);
    const [showAlert, setShowAlert]       = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const feedRef = useRef(null);

    /* ── SSE connection ── */
    useEffect(() => {
        let es;
        try {
            es = new EventSource('/admin/live/stream');
            es.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMetrics(data);
                setFeed((prev) => [...(data.feed || []), ...prev].slice(0, 50));
                setShowAlert(data.pendingReports > 10);
            };
            es.onerror = () => es?.close();
        } catch {
            // SSE unsupported — silent fallback
        }
        return () => es?.close();
    }, []);

    /* ── Auto-scroll feed to top ── */
    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = 0;
    }, [feed.length]);

    const handleConfirm = () => {
        if (confirmModal === 'maintenance') {
            router.post('/admin/live/maintenance', {}, { preserveScroll: true });
        } else if (confirmModal === 'cache') {
            router.post('/admin/live/clear-cache', {}, { preserveScroll: true });
        }
        setConfirmModal(null);
    };

    const memPct = Math.min(100, Math.round(((metrics.health?.memoryUsage || 0) / 256) * 100));

    return (
        <>
            {/* ── Alert Banner ── */}
            {showAlert && (
                <div className="adm-alert-banner adm-alert-banner--danger">
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                        ⚠ ALERT: {metrics.pendingReports} pending reports require attention
                    </span>
                    <button className="adm-btn-icon" onClick={() => setShowAlert(false)}>✕</button>
                </div>
            )}

            {/* ── Primary Stats ── */}
            <div className="adm-stats-grid">
                {[
                    { label: 'ONLINE NOW',       value: metrics.onlineNow,      sub: 'Active in last 5 min' },
                    { label: 'POSTS / MIN',      value: metrics.postsPerMin,    sub: 'Last 60 seconds' },
                    { label: 'MESSAGES / MIN',   value: metrics.messagesPerMin, sub: 'Last 60 seconds' },
                    { label: 'NEW SIGNUPS (1HR)', value: metrics.newSignups1hr,  sub: 'Last 60 minutes' },
                ].map((s) => (
                    <div key={s.label} className="adm-stat-card" style={{ position: 'relative', overflow: 'visible' }}>
                        <span className="adm-live-dot" />
                        <div className="adm-stat-label">{s.label}</div>
                        <div className="adm-stat-value-row">
                            <div className="adm-stat-value">{s.value ?? 0}</div>
                        </div>
                        <div className="adm-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Secondary Stats ── */}
            <div className="adm-stats-mini-grid">
                {[
                    { label: 'Pending Reports',     value: metrics.pendingReports, critical: (metrics.pendingReports || 0) > 10 },
                    { label: 'Active Stories',       value: metrics.activeStories },
                    { label: 'Active Conversations', value: metrics.activeConvos },
                ].map((s) => (
                    <div key={s.label} className="adm-stat-card" style={{ padding: 14 }}>
                        <div className="adm-stat-label">{s.label}</div>
                        <div className="adm-stat-value" style={{ fontSize: 22, color: s.critical ? 'var(--adm-danger)' : undefined }}>
                            {s.value ?? 0}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── 2-Column: Feed + Health ── */}
            <div className="adm-dashboard-2col">
                {/* Live Feed */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <div>
                            <h3>Live Activity Feed</h3>
                            <div className="adm-card-header-sub">Real-time platform events</div>
                        </div>
                        <span className="adm-live-badge">
                            <span className="adm-live-dot adm-live-dot--static" /> LIVE
                        </span>
                    </div>
                    <div className="adm-live-feed" ref={feedRef}>
                        {feed.length === 0 ? (
                            <div className="adm-empty-state">Waiting for activity...</div>
                        ) : feed.map((item, i) => (
                            <div key={i} className="adm-live-feed-item">
                                <div className="adm-live-feed-dot" style={{ background: FEED_COLORS[item.category] || '#888' }} />
                                <div className="adm-live-feed-avatar">{item.actor?.charAt(0)?.toUpperCase() || '?'}</div>
                                <div className="adm-live-feed-content">
                                    <strong>@{item.actor}</strong>{' '}{item.description}
                                </div>
                                <div className="adm-live-feed-time">{item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Health + Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Platform Health */}
                    <div className="adm-health-panel">
                        <div className="adm-health-header">
                            <div className="adm-health-header-label">PLATFORM HEALTH</div>
                            <div className="adm-health-status">
                                <div className="adm-health-status-dot operational" />
                                <span>Operational</span>
                            </div>
                        </div>
                        <div className="adm-health-metrics">
                            {[
                                { label: 'Memory Usage',  value: `${metrics.health?.memoryUsage ?? 0} MB` },
                                { label: 'Peak Memory',   value: `${metrics.health?.memoryPeak ?? 0} MB` },
                                { label: 'Memory Limit',  value: metrics.health?.memoryLimit ?? '—' },
                            ].map((m) => (
                                <div key={m.label} className="adm-health-metric">
                                    <span className="adm-health-metric-label">{m.label}</span>
                                    <span className="adm-health-metric-value">{m.value}</span>
                                </div>
                            ))}
                            <div className="adm-health-metric">
                                <span className="adm-health-metric-label">Maintenance</span>
                                <span className="adm-health-metric-value" style={{ color: metrics.maintenanceMode ? '#f59e0b' : '#10b981' }}>
                                    {metrics.maintenanceMode ? 'ENABLED' : 'NORMAL'}
                                </span>
                            </div>
                        </div>
                        {/* Memory Gauge */}
                        <div style={{ padding: '12px 20px 16px' }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Memory Load {memPct}%
                            </div>
                            <div className="adm-health-gauge">
                                <div
                                    className="adm-health-gauge-fill"
                                    style={{
                                        width: `${memPct}%`,
                                        background: memPct > 80 ? '#dc2626' : memPct > 60 ? '#f59e0b' : '#10b981',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Users by Location */}
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Active Users by Location</h3></div>
                        <div className="adm-card-body-flush">
                            {(metrics.locationMap || []).length === 0 ? (
                                <div className="adm-empty-state">No location data</div>
                            ) : (metrics.locationMap || []).map((loc, i) => (
                                <div key={i} className="adm-location-item">
                                    <span style={{ fontSize: 13 }}>📍 {loc.location}</span>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{loc.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Emergency Controls ── */}
            <div className="adm-emergency-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span className="adm-emergency-controls-label">⚡ Emergency Controls</span>
                    <span className="adm-emergency-controls-sub">— All actions require confirmation</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                        className="adm-btn adm-btn-outline"
                        style={metrics.maintenanceMode ? { borderColor: 'var(--adm-danger)', color: 'var(--adm-danger)' } : undefined}
                        onClick={() => setConfirmModal('maintenance')}
                    >
                        {metrics.maintenanceMode ? '🔴 Disable Maintenance Mode' : '🟡 Enable Maintenance Mode'}
                    </button>
                    <button className="adm-btn adm-btn-outline" onClick={() => setConfirmModal('cache')}>
                        🗑 Clear Application Cache
                    </button>
                </div>
            </div>

            {/* ── Confirm Modal ── */}
            <Modal
                isOpen={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                title={confirmModal === 'maintenance' ? 'Toggle Maintenance Mode' : 'Clear Cache'}
                size="sm"
                footer={
                    <>
                        <button className="adm-btn adm-btn-outline" onClick={() => setConfirmModal(null)}>Cancel</button>
                        <button className="adm-btn adm-btn-danger" onClick={handleConfirm}>Confirm</button>
                    </>
                }
            >
                <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {confirmModal === 'maintenance'
                        ? (metrics.maintenanceMode
                            ? 'This will bring the platform back online for all users.'
                            : 'This will take the platform offline for all regular users. Admins can still access the panel.')
                        : 'This will clear all application cache, compiled views, and route cache. The next request will be slower as caches rebuild.'}
                </p>
                <div className="adm-confirm-warning">
                    This action is logged in the audit trail.
                </div>
            </Modal>
        </>
    );
}

LiveMonitor.layout = (page) => <AdminLayout currentPage="Admin/LiveMonitor">{page}</AdminLayout>;

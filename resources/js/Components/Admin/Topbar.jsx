import { useState } from 'react';

const notifications = [
    { id: 1, type: 'danger', icon: '⚠', text: 'New critical report: Hate speech detected in Group #412', time: '2 mins ago', unread: true },
    { id: 2, type: 'warning', icon: '🔒', text: 'Brute force attempt detected from IP 192.168.1.1', time: '15 mins ago', unread: true },
    { id: 3, type: 'info', icon: '📊', text: 'Daily analytics report is ready for review', time: '1 hour ago', unread: true },
    { id: 4, type: 'info', icon: '👤', text: 'User verification request from @professional_account', time: '2 hours ago', unread: false },
    { id: 5, type: 'danger', icon: '🚨', text: 'Server CPU usage exceeded 90% threshold', time: '3 hours ago', unread: false },
];

export default function Topbar({ pageTitle, onMenuToggle, notifOpen, onNotifToggle }) {
    const [searchQuery, setSearchQuery] = useState('');
    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="adm-topbar">
            <div className="adm-topbar-left">
                <button className="adm-menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <h2>{pageTitle}</h2>
            </div>

            <div className="adm-topbar-right">
                <div className="adm-search-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search system logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="adm-notif-wrapper" style={{ position: 'relative' }}>
                    <button className="adm-notif-btn" onClick={onNotifToggle} aria-label="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        {unreadCount > 0 && <span className="adm-notif-badge">{unreadCount}</span>}
                    </button>

                    {notifOpen && (
                        <div className="adm-notif-dropdown open">
                            <div className="adm-notif-header">
                                <h3>Notifications</h3>
                                <button>Mark all read</button>
                            </div>
                            <div className="adm-notif-list">
                                {notifications.map((n) => (
                                    <div key={n.id} className={`adm-notif-item ${n.unread ? 'unread' : ''}`}>
                                        <div className={`adm-notif-icon ${n.type}`}>{n.icon}</div>
                                        <div className="adm-notif-content">
                                            <p>{n.text}</p>
                                            <span>{n.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="adm-avatar-top">SA</div>
            </div>
        </header>
    );
}

import { Link, usePage, router } from '@inertiajs/react';

const navItems = [
    { id: 'dashboard',     label: 'Dashboard',     page: 'Admin/Dashboard',     route: '/admin/dashboard',     icon: 'grid' },
    { id: 'users',         label: 'Users',          page: 'Admin/Users',          route: '/admin/users',          icon: 'users' },
    { id: 'moderation',    label: 'Moderation',     page: 'Admin/Moderation',     route: '/admin/moderation',     icon: 'shield' },
    { id: 'reports',       label: 'Reports',        page: 'Admin/Reports',        route: '/admin/reports',        icon: 'file' },
    { id: 'groups',        label: 'Groups',         page: 'Admin/Groups',         route: '/admin/groups',         icon: 'group' },
    { id: 'messages',      label: 'Messages',       page: 'Admin/Messages',       route: '/admin/messages',       icon: 'message' },
    { id: 'analytics',     label: 'Analytics',      page: 'Admin/Analytics',      route: '/admin/analytics',      icon: 'chart' },
    { id: 'activity',      label: 'Activity',       page: 'Admin/Activity',       route: '/admin/activity',       icon: 'activity' },
    { id: 'live',          label: 'Live Monitor',   page: 'Admin/LiveMonitor',    route: '/admin/live',           icon: 'live' },
    { id: 'announcements', label: 'Announcements',  page: 'Admin/Announcements',  route: '/admin/announcements',  icon: 'megaphone' },
    { id: 'roles',         label: 'Roles',          page: 'Admin/Roles',          route: '/admin/roles',          icon: 'key' },
    { id: 'settings',      label: 'Settings',       page: 'Admin/Settings',       route: '/admin/settings',       icon: 'settings' },
    { id: 'logs',          label: 'Logs',           page: 'Admin/Logs',           route: '/admin/logs',           icon: 'log' },
];

const icons = {
    grid: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    shield: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    file: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
    ),
    group: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
    ),
    message: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    ),
    chart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
    ),
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    ),
    log: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
    ),
    activity: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
    ),
    live: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
        </svg>
    ),
    megaphone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
    ),
    key: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
    ),
};

export default function Sidebar({ currentPage, isOpen, onNavClick }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'SA';

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/admin/logout');
    };

    return (
        <aside className={`adm-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="adm-sidebar-brand">
                <h1>Daloy</h1>
                <span>Administrative Suite</span>
            </div>

            <nav className="adm-sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.route}
                        className={`adm-nav-item ${currentPage === item.page ? 'active' : ''}`}
                        onClick={onNavClick}
                        preserveState
                    >
                        {icons[item.icon]}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="adm-sidebar-footer">
                <div className="adm-admin-profile">
                    <div className="adm-admin-avatar">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : initials}
                    </div>
                    <div className="adm-admin-info">
                        <span className="adm-admin-name">{user?.name || 'Admin'}</span>
                        <span className="adm-admin-role">Super Admin</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'none',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#888',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        fontSize: '11px',
                        marginTop: '8px',
                        width: '100%',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#555'; }}
                    onMouseLeave={e => { e.target.style.color = '#888'; e.target.style.borderColor = '#333'; }}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}



import { useState, useEffect } from 'react';
import '../../css/admin.css';
import Sidebar from '../Components/Admin/UI/Sidebar';
import Topbar from '../Components/Admin/UI/Topbar';

const pageTitles = {
    'Admin/Dashboard':     'Dashboard Overview',
    'Admin/Users':         'Users & Profiles',
    'Admin/Moderation':    'Content Moderation',
    'Admin/Reports':       'Reports Management',
    'Admin/Groups':        'Groups & Events',
    'Admin/Messages':      'Messages Monitoring',
    'Admin/Analytics':     'Analytics & Insights',
    'Admin/Activity':      'Voyager Activity',
    'Admin/LiveMonitor':   'Live Monitor',
    'Admin/Announcements': 'Announcements',
    'Admin/Roles':         'Roles & Permissions',
    'Admin/Settings':      'System Settings',
    'Admin/Logs':          'Audit Logs',
    'Admin/UserActivity':  'User Activity Timeline',
};

export default function AdminLayout({ children, currentPage }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const pageTitle = pageTitles[currentPage] || 'Dashboard Overview';

    useEffect(() => {
        const handleClick = (e) => {
            if (notifOpen && !e.target.closest('.adm-notif-wrapper')) {
                setNotifOpen(false);
            }
            // Close dropdown menus
            if (!e.target.closest('.adm-actions-menu')) {
                document.querySelectorAll('.adm-actions-dropdown.open').forEach(d => d.classList.remove('open'));
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [notifOpen]);

    // Close sidebar on nav (mobile)
    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="daloy-admin">
            <Sidebar
                currentPage={currentPage}
                isOpen={sidebarOpen}
                onNavClick={handleNavClick}
            />
            <div className="adm-main-wrapper">
                <Topbar
                    pageTitle={pageTitle}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    notifOpen={notifOpen}
                    onNotifToggle={() => setNotifOpen(!notifOpen)}
                />
                <main className="adm-main-content">
                    {children}
                </main>
                <footer className="adm-footer">
                    <div className="adm-footer-left">
                        <span>System Status: Operational</span>
                        <span className="adm-footer-dot"></span>
                    </div>
                    <div className="adm-footer-right">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <span>© 2026 Daloy Admin</span>
                    </div>
                </footer>
            </div>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="adm-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
                        zIndex: 99, display: 'block',
                    }}
                />
            )}
        </div>
    );
}

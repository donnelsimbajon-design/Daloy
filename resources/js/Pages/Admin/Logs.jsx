import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';

const mockLogs = [
    { id: 1, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'Account Suspended', target: '@toxic_user_99', timestamp: '2026-03-29 23:45:12', ip: '192.168.1.101' },
    { id: 2, admin: 'System_Automator', adminId: 'SYS-001', action: 'Auto-flagged Post', target: 'Post #8412', timestamp: '2026-03-29 23:30:00', ip: '10.0.0.1' },
    { id: 3, admin: 'Admin_Mark', adminId: 'ADM-002', action: 'Flag Resolved', target: 'Post #9230', timestamp: '2026-03-29 22:15:44', ip: '192.168.1.102' },
    { id: 4, admin: 'Root_User', adminId: 'ADM-000', action: 'API Key Created', target: 'Integration_Partner_7', timestamp: '2026-03-29 20:10:33', ip: '10.0.0.5' },
    { id: 5, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'User Verified', target: '@content_creator_42', timestamp: '2026-03-29 19:55:21', ip: '192.168.1.101' },
    { id: 6, admin: 'Admin_Mark', adminId: 'ADM-002', action: 'Group Deleted', target: 'Spam Group #891', timestamp: '2026-03-29 18:40:15', ip: '192.168.1.102' },
    { id: 7, admin: 'System_Automator', adminId: 'SYS-001', action: 'Policy Update', target: 'Community Guidelines v2.4', timestamp: '2026-03-29 17:30:00', ip: '10.0.0.1' },
    { id: 8, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'Content Hidden', target: 'Post #7654', timestamp: '2026-03-29 16:22:08', ip: '192.168.1.101' },
    { id: 9, admin: 'Root_User', adminId: 'ADM-000', action: 'Settings Changed', target: 'Max Upload Size: 10MB → 15MB', timestamp: '2026-03-29 15:10:45', ip: '10.0.0.5' },
    { id: 10, admin: 'Admin_Mark', adminId: 'ADM-002', action: 'User Banned', target: '@spam_account_55', timestamp: '2026-03-29 14:05:33', ip: '192.168.1.102' },
    { id: 11, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'Report Dismissed', target: 'Report #1204', timestamp: '2026-03-29 13:50:22', ip: '192.168.1.101' },
    { id: 12, admin: 'System_Automator', adminId: 'SYS-001', action: 'Auto-suspended User', target: '@repeated_offender', timestamp: '2026-03-29 12:30:00', ip: '10.0.0.1' },
    { id: 13, admin: 'Root_User', adminId: 'ADM-000', action: 'Maintenance Mode OFF', target: 'System', timestamp: '2026-03-29 11:00:00', ip: '10.0.0.5' },
    { id: 14, admin: 'Root_User', adminId: 'ADM-000', action: 'Maintenance Mode ON', target: 'System', timestamp: '2026-03-29 09:00:00', ip: '10.0.0.5' },
    { id: 15, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'Password Reset Sent', target: '@user_forgot_pw', timestamp: '2026-03-28 22:15:30', ip: '192.168.1.101' },
    { id: 16, admin: 'Admin_Mark', adminId: 'ADM-002', action: 'Comment Deleted', target: 'Comment #45021', timestamp: '2026-03-28 21:00:15', ip: '192.168.1.102' },
    { id: 17, admin: 'Admin_Sarah', adminId: 'ADM-001', action: 'Event Cancelled', target: 'Photography Meetup', timestamp: '2026-03-28 19:30:45', ip: '192.168.1.101' },
    { id: 18, admin: 'Root_User', adminId: 'ADM-000', action: 'Feature Toggle', target: 'Stories: Enabled', timestamp: '2026-03-28 18:15:22', ip: '10.0.0.5' },
    { id: 19, admin: 'System_Automator', adminId: 'SYS-001', action: 'Security Alert', target: 'Brute force from IP 45.33.21.8', timestamp: '2026-03-28 16:40:00', ip: '10.0.0.1' },
    { id: 20, admin: 'Admin_Mark', adminId: 'ADM-002', action: 'User Warning Sent', target: '@borderline_user', timestamp: '2026-03-28 15:20:11', ip: '192.168.1.102' },
];

export default function Logs() {
    const [search, setSearch] = useState('');
    const [filterAdmin, setFilterAdmin] = useState('all');
    const [filterAction, setFilterAction] = useState('all');

    const uniqueAdmins = [...new Set(mockLogs.map(l => l.admin))];
    const uniqueActions = [...new Set(mockLogs.map(l => l.action))];

    const filtered = mockLogs.filter(l => {
        const matchSearch = search === '' ||
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.target.toLowerCase().includes(search.toLowerCase()) ||
            l.admin.toLowerCase().includes(search.toLowerCase()) ||
            l.ip.includes(search);
        const matchAdmin = filterAdmin === 'all' || l.admin === filterAdmin;
        const matchAction = filterAction === 'all' || l.action === filterAction;
        return matchSearch && matchAdmin && matchAction;
    });

    const columns = [
        {
            key: 'admin', label: 'Admin',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{row.adminId}</div>
                </div>
            )
        },
        {
            key: 'action', label: 'Action',
            render: (val) => <span className="adm-table-cell-bold">{val}</span>
        },
        {
            key: 'target', label: 'Target',
            render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>
        },
        {
            key: 'timestamp', label: 'Timestamp',
            render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{val}</span>
        },
        {
            key: 'ip', label: 'IP Address',
            render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>{val}</span>
        },
    ];

    return (
        <div className="adm-card">
            <div className="adm-toolbar">
                <div className="adm-toolbar-left">
                    <input
                        type="text"
                        className="adm-filter-input"
                        placeholder="Search logs (action, target, admin, IP)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: '280px' }}
                    />
                    <select className="adm-filter-select" value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)}>
                        <option value="all">All Admins</option>
                        {uniqueAdmins.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select className="adm-filter-select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                        <option value="all">All Actions</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="adm-toolbar-right">
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        {filtered.length} log{filtered.length !== 1 ? 's' : ''} · Read-only
                    </span>
                </div>
            </div>

            <DataTable columns={columns} data={filtered} pageSize={15} />
        </div>
    );
}

Logs.layout = (page) => <AdminLayout currentPage="Admin/Logs">{page}</AdminLayout>;

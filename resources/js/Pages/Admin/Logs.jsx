import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import DataTable from '../../Components/Admin/DataTable';
import { router, Link } from '@inertiajs/react';

export default function Logs({ logs = { data: [] }, admins = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [adminFilter, setAdminFilter] = useState(filters.admin_filter || 'all');

    const handleSearch = (val) => {
        setSearch(val);
        router.get('/admin/logs', { search: val, admin_filter: adminFilter === 'all' ? '' : adminFilter }, { preserveState: true, replace: true });
    };

    const handleAdminFilter = (val) => {
        setAdminFilter(val);
        router.get('/admin/logs', { search, admin_filter: val === 'all' ? '' : val }, { preserveState: true, replace: true });
    };

    const logList = logs.data || [];

    const columns = [
        {
            key: 'admin', label: 'Admin',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{row.admin_id}</div>
                </div>
            )
        },
        { key: 'action', label: 'Action', render: (val) => <span className="adm-table-cell-bold">{val}</span> },
        { key: 'target', label: 'Target', render: (val) => <span style={{ fontWeight: 500 }}>{val}</span> },
        { key: 'timestamp', label: 'Timestamp', render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{val}</span> },
        { key: 'ip', label: 'IP Address', render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>{val}</span> },
    ];

    return (
        <div className="adm-card">
            <div className="adm-toolbar">
                <div className="adm-toolbar-left">
                    <input
                        type="text"
                        className="adm-filter-input"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ minWidth: '260px' }}
                    />
                    <select className="adm-filter-select" value={adminFilter} onChange={(e) => handleAdminFilter(e.target.value)}>
                        <option value="all">All Admins</option>
                        {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div className="adm-toolbar-right">
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        {logs.total || logList.length} logs · Read-only
                    </span>
                </div>
            </div>

            <DataTable columns={columns} data={logList} pageSize={20} />

            {logs.links && logs.links.length > 3 && (
                <div className="adm-pagination">
                    <span style={{ fontSize: '11px', color: '#888' }}>
                        Showing {logs.from || 0} to {logs.to || 0} of {logs.total || 0}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {logs.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'} className={`adm-pagination-btn ${link.active ? 'active' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} preserveState />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

Logs.layout = (page) => <AdminLayout currentPage="Admin/Logs">{page}</AdminLayout>;

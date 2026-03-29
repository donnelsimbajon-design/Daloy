export default function StatusBadge({ status }) {
    const statusMap = {
        active: 'adm-badge-active',
        resolved: 'adm-badge-resolved',
        suspended: 'adm-badge-suspended',
        pending: 'adm-badge-pending',
        banned: 'adm-badge-banned',
        critical: 'adm-badge-critical',
        dismissed: 'adm-badge-dismissed',
        inactive: 'adm-badge-inactive',
        verified: 'adm-badge-verified',
    };

    const cls = statusMap[status?.toLowerCase()] || 'adm-badge-inactive';
    const label = status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';

    return <span className={`adm-badge ${cls}`}>{label}</span>;
}

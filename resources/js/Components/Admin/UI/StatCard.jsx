export default function StatCard({ label, value, change, changeType = 'up' }) {
    return (
        <div className="adm-stat-card">
            <div className="adm-stat-label">{label}</div>
            <div className="adm-stat-value-row">
                <span className="adm-stat-value">{value}</span>
                {change && (
                    <span className={`adm-stat-change ${changeType}`}>
                        {changeType === 'up' && '↑'}
                        {changeType === 'down' && '↓'}
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
}

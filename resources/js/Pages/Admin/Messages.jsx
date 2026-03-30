import AdminLayout from '../../Layouts/AdminLayout';

export default function Messages({ reportedConversations = { data: [] } }) {
    const convList = reportedConversations.data || [];

    return (
        <>
            <div className="adm-card">
                <div className="adm-card-header">
                    <h3>Reported Conversations</h3>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        Only reported conversations are visible. User privacy is maintained.
                    </span>
                </div>
                <div className="adm-card-body-flush">
                    {convList.length === 0 ? (
                        <div className="adm-empty" style={{ padding: '60px 20px' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <h4>No Reported Conversations</h4>
                            <p>There are currently no flagged or reported conversations to review.</p>
                        </div>
                    ) : (
                        <div className="adm-table-wrapper">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Reporter</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {convList.map(conv => (
                                        <tr key={conv.id}>
                                            <td style={{ fontWeight: 600 }}>{conv.reporter}</td>
                                            <td>{conv.reason}</td>
                                            <td>
                                                <span className={`adm-badge ${conv.status === 'pending' ? 'adm-badge-pending' : 'adm-badge-resolved'}`}>
                                                    {conv.status}
                                                </span>
                                            </td>
                                            <td style={{ color: '#888' }}>{conv.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Messages.layout = (page) => <AdminLayout currentPage="Admin/Messages">{page}</AdminLayout>;

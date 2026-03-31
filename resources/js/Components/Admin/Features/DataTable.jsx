import { useState } from 'react';

export default function DataTable({ columns, data, onRowAction, pagination = true, pageSize = 10 }) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const pageData = pagination ? data.slice(startIdx, startIdx + pageSize) : data;

    return (
        <div>
            <div className="adm-table-wrapper">
                <table className="adm-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} style={col.width ? { width: col.width } : {}}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            pageData.map((row, idx) => (
                                <tr key={row.id || idx}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render ? col.render(row[col.key], row, onRowAction) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && totalPages > 1 && (
                <div className="adm-pagination">
                    <span className="adm-pagination-info">
                        Showing {startIdx + 1}–{Math.min(startIdx + pageSize, data.length)} of {data.length}
                    </span>
                    <div className="adm-pagination-btns">
                        <button
                            className="adm-pagination-btn"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            ‹
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={page}
                                    className={`adm-pagination-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            className="adm-pagination-btn"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

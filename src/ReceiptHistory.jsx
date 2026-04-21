import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import './ReceiptHistory.css';

export default function ReceiptHistory({
    savedInvoices,
    searchQuery,
    setSearchQuery,
    viewInvoice,
    loadInvoice,
    deleteInvoice,
    setShowHistory,
    setShowReport
}) {
    const filteredInvoices = savedInvoices.filter((inv) => {
        const term = searchQuery.toLowerCase();
        const matchesInvoiceNo = inv.invoiceNumber?.toLowerCase().includes(term);
        const matchesClientName = inv.billedTo?.name?.toLowerCase().includes(term);
        return matchesInvoiceNo || matchesClientName;
    });

    return (
        <div className="invoice-wrapper history-view">
            <div className="history-toolbar">
                <button className="btn-outline" type="button" onClick={() => setShowHistory(false)}>
                    <ArrowLeft size={18} /> Back to Edit
                </button>
                <div className="history-toolbar-content">
                    <h2 className="history-title">Saved Receipt Archive</h2>
                    <button className="btn-outline" type="button" onClick={() => { setShowReport(true); setShowHistory(false); }}>
                        Business Intelligence
                    </button>
                </div>
            </div>

            <div className="history-search">
                <div className="search-wrapper">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by client name or invoice #"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="search-icon">
                        <Search size={20} />
                    </div>
                </div>
            </div>

            <div className="history-card">
                {filteredInvoices.length === 0 ? (
                    <div className="history-empty">No saved receipts found. Generate an invoice to save it.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date Saved</th>
                                    <th>Invoice #</th>
                                    <th>Billed To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td data-label="Date Saved">{new Date(inv.savedAt).toLocaleString()}</td>
                                        <td data-label="Invoice #"><span className="badge">#{inv.invoiceNumber}</span></td>
                                        <td data-label="Billed To">{inv.billedTo?.name || '—'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-load" onClick={() => viewInvoice(inv)}>View</button>
                                                <button className="btn-load" onClick={() => loadInvoice(inv)}>Edit</button>
                                                <button className="btn-del" onClick={() => deleteInvoice(inv.id)} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

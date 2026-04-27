import { useState } from 'react';
import { ArrowLeft, Search, Trash2, AlertTriangle, X } from 'lucide-react';
import './ReceiptHistory.css';

export default function ReceiptHistory({
    savedInvoices,
    searchQuery,
    setSearchQuery,
    viewInvoice,
    loadInvoice,
    deleteInvoice,
    calculateInvoiceTotal,
    setShowHistory,
    setShowReport
}) {
    const [confirmId, setConfirmId] = useState(null);

    const filteredInvoices = savedInvoices.filter((inv) => {
        const term = searchQuery.toLowerCase();
        const matchesInvoiceNo = inv.invoiceNumber?.toLowerCase().includes(term);
        const matchesClientName = inv.billedTo?.name?.toLowerCase().includes(term);
        return matchesInvoiceNo || matchesClientName;
    });

    const handleDeleteClick = (id) => {
        setConfirmId(id);
    };

    const handleConfirmDelete = () => {
        deleteInvoice(confirmId);
        setConfirmId(null);
    };

    const handleCancelDelete = () => {
        setConfirmId(null);
    };

    return (
        <div className="invoice-wrapper history-view">
            {confirmId !== null && (
                <div className="confirm-overlay" onClick={handleCancelDelete}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="confirm-close" onClick={handleCancelDelete} title="Close">
                            <X size={18} />
                        </button>
                        <div className="confirm-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="confirm-title">Delete Receipt?</h3>
                        <p className="confirm-message">
                            This action cannot be undone. Are you sure you want to permanently delete this receipt?
                        </p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={handleCancelDelete}>
                                No
                            </button>
                            <button className="confirm-btn-delete" onClick={handleConfirmDelete}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td data-label="Date Saved">{new Date(inv.savedAt).toLocaleString()}</td>
                                        <td data-label="Invoice #"><span className="badge">#{inv.invoiceNumber}</span></td>
                                        <td data-label="Billed To">{inv.billedTo?.name || '—'}</td>
                                        <td data-label="Amount">
                                            <span className="amount-cell">
                                                {inv.currencySymbol || '₹'}{calculateInvoiceTotal(inv).toFixed(2)}
                                            </span>
                                        </td>
                                        <td data-label="Status">
                                            <span className="status-badge">
                                                {inv.paymentStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-load" onClick={() => viewInvoice(inv)}>View</button>
                                                <button className="btn-load" onClick={() => loadInvoice(inv)}>Edit</button>
                                                <button className="btn-del" onClick={() => handleDeleteClick(inv.id)} title="Delete">
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

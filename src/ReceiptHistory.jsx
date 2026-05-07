import { useState } from 'react';
import { ArrowLeft, Search, Trash2, AlertTriangle, X } from 'lucide-react';
import { translations } from './translations';
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
    setShowReport,
    language
}) {
    const t = translations[language];

    const translateStatus = (status) => {
        const s = status?.toLowerCase().replace(/\s+/g, '');
        return t[s] || status;
    };
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
                        <h3 className="confirm-title">{t.deleteReceiptTitle}</h3>
                        <p className="confirm-message">
                            {t.deleteReceiptMsg}
                        </p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={handleCancelDelete}>
                                {t.no}
                            </button>
                            <button className="confirm-btn-delete" onClick={handleConfirmDelete}>
                                {t.yes}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="history-search">
                <div className="search-wrapper">
                    <input
                        type="text"
                        className="input-field"
                        placeholder={t.searchPlaceholder}
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
                    <div className="history-empty">{t.noInvoices}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>{t.dateSaved}</th>
                                    <th>{t.invoiceNo}</th>
                                    <th>{t.billedTo}</th>
                                    <th>{t.amount}</th>
                                    <th>{t.status}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td data-label={t.dateSaved}>{new Date(inv.savedAt).toLocaleString()}</td>
                                        <td data-label={t.invoiceNo}><span className="badge">#{inv.invoiceNumber}</span></td>
                                        <td data-label={t.billedTo}>{inv.billedTo?.name || '—'}</td>
                                        <td data-label={t.amount}>
                                            <span className="amount-cell">
                                                {inv.currencySymbol || '₹'}{calculateInvoiceTotal(inv).toFixed(2)}
                                            </span>
                                        </td>
                                        <td data-label={t.status}>
                                            <span className="status-badge">
                                                {translateStatus(inv.paymentStatus) || t.pending}
                                            </span>
                                        </td>
                                        <td data-label="Actions">
                                            <div className="action-buttons">
                                                <button className="btn-load" onClick={() => viewInvoice(inv)}>{t.view}</button>
                                                <button className="btn-load" onClick={() => loadInvoice(inv)}>{t.edit}</button>
                                                <button className="btn-del" onClick={() => handleDeleteClick(inv.id)} title={t.delete}>
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

import { ArrowLeft } from 'lucide-react';
import './InvoiceReport.css';

export default function InvoiceReport({
    reportSummary,
    monthlyReport,
    clientReport,
    recentInvoices,
    currencySymbol,
    calculateInvoiceTotal,
    setShowReport,
    setShowHistory
}) {
    const statusEntries = Object.entries(reportSummary.statusCounts);
    const maxProfit = Math.max(...monthlyReport.map((row) => Math.abs(row.profit)), 1);

    return (
        <div className="invoice-wrapper history-view">
            <div className="history-toolbar">
                <button className="btn-outline" type="button" onClick={() => setShowReport(false)}>
                    <ArrowLeft size={18} /> Back to Edit
                </button>
                <div className="history-toolbar-content">
                    <h2 className="history-title">Business Intelligence Report</h2>
                    <button className="btn-history" type="button" onClick={() => { setShowHistory(true); setShowReport(false); }}>
                        View Saved Receipts
                    </button>
                </div>
            </div>

            <div className="report-grid">
                <div className="report-card">
                    <h3>Invoice Summary</h3>
                    <div className="report-card-row">
                        <span>Total invoices</span>
                        <strong>{reportSummary.totalInvoices}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Total revenue</span>
                        <strong>{currencySymbol}{reportSummary.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Total cost</span>
                        <strong>{currencySymbol}{reportSummary.totalCost.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Total profit / loss</span>
                        <strong>{currencySymbol}{reportSummary.totalProfit.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Profit margin</span>
                        <strong>{reportSummary.profitMargin.toFixed(2)}%</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Average invoice</span>
                        <strong>{currencySymbol}{reportSummary.averageInvoice.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>Unpaid / pending</span>
                        <strong>{currencySymbol}{reportSummary.unpaidRevenue.toFixed(2)}</strong>
                    </div>
                </div>

                <div className="report-card report-status-card">
                    <h3>Status Breakdown</h3>
                    <div className="status-list">
                        {statusEntries.length === 0 ? (
                            <p>No invoices to show.</p>
                        ) : (
                            statusEntries.map(([status, count]) => (
                                <div key={status} className="status-chip">
                                    <span>{status}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="report-card report-chart-card">
                <h3>Monthly Profit / Loss</h3>
                {monthlyReport.length === 0 ? (
                    <div className="history-empty">No monthly data to show.</div>
                ) : (
                    <div className="chart-list">
                        {monthlyReport.map((row) => (
                            <div key={row.key} className="chart-row">
                                <div className="chart-row-labels">
                                    <div>
                                        <strong>{row.label}</strong>
                                        <div className="chart-subtext">Revenue {currencySymbol}{row.revenue.toFixed(2)} • Cost {currencySymbol}{row.cost.toFixed(2)}</div>
                                    </div>
                                    <strong className={row.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                                        {currencySymbol}{row.profit.toFixed(2)}
                                    </strong>
                                </div>
                                <div className="chart-bar-track">
                                    <div
                                        className={row.profit >= 0 ? 'chart-bar chart-bar-positive' : 'chart-bar chart-bar-negative'}
                                        style={{ width: `${Math.min(Math.abs(row.profit) / maxProfit, 1) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="report-card report-client-card">
                <h3>Client Profit / Loss Summary</h3>
                {clientReport.length === 0 ? (
                    <div className="history-empty">No client data to show.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="report-list-table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Invoices</th>
                                    <th>Revenue</th>
                                    <th>Cost</th>
                                    <th>Profit</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientReport.map((client) => (
                                    <tr key={client.clientName}>
                                        <td>{client.clientName}</td>
                                        <td>{client.invoices}</td>
                                        <td>{currencySymbol}{client.revenue.toFixed(2)}</td>
                                        <td>{currencySymbol}{client.cost.toFixed(2)}</td>
                                        <td className={client.profit >= 0 ? 'profit-positive' : 'profit-negative'}>{currencySymbol}{client.profit.toFixed(2)}</td>
                                        <td>{client.profitMargin.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="history-card report-list-card">
                <h3>Recent invoices</h3>
                {recentInvoices.length === 0 ? (
                    <div className="history-empty">No saved invoices yet. Generate a document to populate the report.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="report-list-table">
                            <thead>
                                <tr>
                                    <th>Date Saved</th>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td>{new Date(inv.savedAt).toLocaleString()}</td>
                                        <td>#{inv.invoiceNumber}</td>
                                        <td>{inv.billedTo?.name || '—'}</td>
                                        <td>{inv.paymentStatus || 'Pending'}</td>
                                        <td>{inv.currencySymbol || '$'}{calculateInvoiceTotal(inv).toFixed(2)}</td>
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

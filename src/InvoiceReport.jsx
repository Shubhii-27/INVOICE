import { ArrowLeft } from 'lucide-react';
import { translations } from './translations';
import './InvoiceReport.css';

export default function InvoiceReport({
    reportSummary,
    monthlyReport,
    clientReport,
    recentInvoices,
    currencySymbol,
    calculateInvoiceTotal,
    setShowReport,
    setShowHistory,
    language
}) {
    const t = translations[language];
    const statusEntries = Object.entries(reportSummary.statusCounts);
    const maxProfit = Math.max(...monthlyReport.map((row) => Math.abs(row.profit)), 1);

    const translateStatus = (status) => {
        const s = status?.toLowerCase();
        return t[s] || status;
    };

    return (
        <div className="invoice-wrapper history-view">

            <div className="report-grid">
                <div className="report-card">
                    <h3>{t.invoiceSummary}</h3>
                    <div className="report-card-row">
                        <span>{t.totalInvoices}</span>
                        <strong>{reportSummary.totalInvoices}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.totalRevenue}</span>
                        <strong>{currencySymbol}{reportSummary.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.totalCost}</span>
                        <strong>{currencySymbol}{reportSummary.totalCost.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.totalProfitLoss}</span>
                        <strong>{currencySymbol}{reportSummary.totalProfit.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.profitMargin}</span>
                        <strong>{reportSummary.profitMargin.toFixed(2)}%</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.averageInvoice}</span>
                        <strong>{currencySymbol}{reportSummary.averageInvoice.toFixed(2)}</strong>
                    </div>
                    <div className="report-card-row">
                        <span>{t.unpaidPending}</span>
                        <strong>{currencySymbol}{reportSummary.unpaidRevenue.toFixed(2)}</strong>
                    </div>
                </div>

                <div className="report-card report-status-card">
                    <h3>{t.statusBreakdown}</h3>
                    <div className="status-list">
                        {statusEntries.length === 0 ? (
                            <p>{t.noData}</p>
                        ) : (
                            statusEntries.map(([status, count]) => (
                                <div key={status} className="status-chip">
                                    <span>{translateStatus(status)}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="report-card report-chart-card">
                <h3>{t.monthlyProfitLoss}</h3>
                {monthlyReport.length === 0 ? (
                    <div className="history-empty">{t.noData}</div>
                ) : (
                    <div className="chart-list">
                        {monthlyReport.map((row) => (
                            <div key={row.key} className="chart-row">
                                <div className="chart-row-labels">
                                    <div>
                                        <strong>{row.label}</strong>
                                        <div className="chart-subtext">{t.revenue} {currencySymbol}{row.revenue.toFixed(2)} • {t.cost} {currencySymbol}{row.cost.toFixed(2)}</div>
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
                <h3>{t.clientProfitLoss}</h3>
                {clientReport.length === 0 ? (
                    <div className="history-empty">{t.noData}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="report-list-table client-report-table">
                            <thead>
                                <tr>
                                    <th>{t.client}</th>
                                    <th>{t.invoices}</th>
                                    <th>{t.revenue}</th>
                                    <th>{t.cost}</th>
                                    <th>{t.profit}</th>
                                    <th>{t.margin}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientReport.map((client) => (
                                    <tr key={client.clientName}>
                                        <td data-label={t.client}>{client.clientName}</td>
                                        <td data-label={t.invoices}>{client.invoices}</td>
                                        <td data-label={t.revenue}>{currencySymbol}{client.revenue.toFixed(2)}</td>
                                        <td data-label={t.cost}>{currencySymbol}{client.cost.toFixed(2)}</td>
                                        <td data-label={t.profit} className={client.profit >= 0 ? 'profit-positive' : 'profit-negative'}>{currencySymbol}{client.profit.toFixed(2)}</td>
                                        <td data-label={t.margin}>{client.profitMargin.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="history-card report-list-card">
                <h3>{t.recentInvoices}</h3>
                {recentInvoices.length === 0 ? (
                    <div className="history-empty">{t.noInvoices}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="report-list-table recent-invoices-table">
                            <thead>
                                <tr>
                                    <th>{t.dateSaved}</th>
                                    <th>{t.invoiceNo}</th>
                                    <th>{t.client}</th>
                                    <th>{t.status}</th>
                                    <th>{t.total}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td data-label={t.dateSaved}>{new Date(inv.savedAt).toLocaleString()}</td>
                                        <td data-label={t.invoiceNo}>#{inv.invoiceNumber}</td>
                                        <td data-label={t.client}>{inv.billedTo?.name || '—'}</td>
                                        <td data-label={t.status}>{translateStatus(inv.paymentStatus) || t.pending}</td>
                                        <td data-label={t.total}>{inv.currencySymbol || '$'}{calculateInvoiceTotal(inv).toFixed(2)}</td>
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

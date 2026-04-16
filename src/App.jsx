import { useRef, useState } from 'react';
import { UploadCloud, GripVertical, Trash2, Plus, ArrowLeft, Download, Search } from 'lucide-react';
import InvoiceReport from './InvoiceReport.jsx';
import ReceiptHistory from './ReceiptHistory.jsx';
import './index.css';

function App() {
    const [items, setItems] = useState([
        { id: 1, name: '', quantity: 1, unit: '', price: '', cost: '', gst: '', description: '' }
    ]);
    const [discountEnabled, setDiscountEnabled] = useState(false);
    const [discount, setDiscount] = useState('');
    const [billedFrom, setBilledFrom] = useState({ name: '', address: '', email: '' });
    const [billedTo, setBilledTo] = useState({ name: '', address: '', email: '' });
    const [invoiceNumber, setInvoiceNumber] = useState('0001');
    const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => {
        const due = new Date();
        due.setDate(due.getDate() + 14);
        return due.toISOString().slice(0, 10);
    });
    const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('Thank you for your business. Please pay by the due date.');
    const [paymentStatus, setPaymentStatus] = useState('Pending');
    const [currency, setCurrency] = useState('INR');
    const [currencySymbol, setCurrencySymbol] = useState('₹');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const [savedInvoices, setSavedInvoices] = useState(() => {
        try {
            const item = window.localStorage.getItem('savedInvoices');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    });

    const saveToLocalStorage = (invoices) => {
        setSavedInvoices(invoices);
        window.localStorage.setItem('savedInvoices', JSON.stringify(invoices));
    };

    const calculateItemTotal = (item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const gst = parseFloat(item.gst || item.vat) || 0;
        const subtotal = quantity * price;
        const gstAmount = subtotal * (gst / 100);
        return (subtotal + gstAmount).toFixed(2);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + parseFloat(calculateItemTotal(item) || 0), 0);
    };

    const getDiscountAmount = () => {
        const subtotal = calculateSubtotal();
        const discountValue = parseFloat(discount) || 0;
        return ((subtotal * discountValue) / 100).toFixed(2);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountValue = parseFloat(discount) || 0;
        if (discountEnabled && discountValue > 0) {
            const discountAmt = parseFloat(getDiscountAmount());
            return (subtotal - discountAmt).toFixed(2);
        }
        return subtotal.toFixed(2);
    };

    const calculateItemCostTotal = (item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.cost) || 0;
        return parseFloat(quantity * cost).toFixed(2);
    };

    const calculateInvoiceCostTotal = (invoice) => {
        return invoice.items.reduce((sum, item) => sum + parseFloat(calculateItemCostTotal(item) || 0), 0);
    };

    const calculateInvoiceProfit = (invoice) => {
        const revenue = parseFloat(calculateInvoiceTotal(invoice) || 0);
        const cost = parseFloat(calculateInvoiceCostTotal(invoice) || 0);
        return (revenue - cost).toFixed(2);
    };

    const calculateInvoiceProfitMargin = (invoice) => {
        const revenue = parseFloat(calculateInvoiceTotal(invoice) || 0);
        const profit = parseFloat(calculateInvoiceProfit(invoice) || 0);
        return revenue ? ((profit / revenue) * 100).toFixed(2) : '0.00';
    };

    const calculateInvoiceItemTotal = (item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const gst = parseFloat(item.gst || item.vat) || 0;
        const subtotal = quantity * price;
        const gstAmount = subtotal * (gst / 100);
        return parseFloat(subtotal + gstAmount).toFixed(2);
    };

    const calculateInvoiceSubtotal = (invoice) => {
        return invoice.items.reduce((sum, item) => sum + parseFloat(calculateInvoiceItemTotal(item) || 0), 0);
    };

    const calculateInvoiceTotal = (invoice) => {
        const subtotal = calculateInvoiceSubtotal(invoice);
        const discountValue = parseFloat(invoice.discount) || 0;
        if (invoice.discountEnabled && discountValue > 0) {
            const discountAmt = parseFloat(((subtotal * discountValue) / 100).toFixed(2));
            return (subtotal - discountAmt).toFixed(2);
        }
        return subtotal.toFixed(2);
    };

    const getReportSummary = () => {
        const totalInvoices = savedInvoices.length;
        const totalRevenue = savedInvoices.reduce((sum, inv) => sum + parseFloat(calculateInvoiceTotal(inv) || 0), 0);
        const totalCost = savedInvoices.reduce((sum, inv) => sum + parseFloat(calculateInvoiceCostTotal(inv) || 0), 0);
        const totalProfit = totalRevenue - totalCost;
        const unpaidRevenue = savedInvoices.reduce((sum, inv) => {
            const status = inv.paymentStatus || 'Pending';
            const invoiceTotal = parseFloat(calculateInvoiceTotal(inv) || 0);
            if (status === 'Paid') return sum;
            return sum + invoiceTotal;
        }, 0);
        const averageInvoice = totalInvoices ? totalRevenue / totalInvoices : 0;
        const statusCounts = savedInvoices.reduce((acc, inv) => {
            const status = inv.paymentStatus || 'Pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalInvoices,
            totalRevenue,
            totalCost,
            totalProfit,
            unpaidRevenue,
            averageInvoice,
            profitMargin,
            statusCounts
        };
    };

    const getMonthlyReport = () => {
        const grouped = savedInvoices.reduce((acc, inv) => {
            const date = new Date(inv.issueDate || inv.savedAt);
            if (Number.isNaN(date.getTime())) return acc;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
            const revenue = parseFloat(calculateInvoiceTotal(inv) || 0);
            const cost = parseFloat(calculateInvoiceCostTotal(inv) || 0);
            const profit = revenue - cost;
            if (!acc[key]) {
                acc[key] = { key, label, revenue: 0, cost: 0, profit: 0, invoices: 0 };
            }
            acc[key].revenue += revenue;
            acc[key].cost += cost;
            acc[key].profit += profit;
            acc[key].invoices += 1;
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
    };

    const getClientReport = () => {
        const grouped = savedInvoices.reduce((acc, inv) => {
            const clientName = inv.billedTo?.name?.trim() || 'Unknown client';
            const revenue = parseFloat(calculateInvoiceTotal(inv) || 0);
            const cost = parseFloat(calculateInvoiceCostTotal(inv) || 0);
            const profit = revenue - cost;

            if (!acc[clientName]) {
                acc[clientName] = {
                    clientName,
                    invoices: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0
                };
            }

            acc[clientName].invoices += 1;
            acc[clientName].revenue += revenue;
            acc[clientName].cost += cost;
            acc[clientName].profit += profit;
            return acc;
        }, {});

        return Object.values(grouped)
            .map((client) => ({
                ...client,
                profitMargin: client.revenue ? (client.profit / client.revenue) * 100 : 0
            }))
            .sort((a, b) => b.profit - a.profit);
    };

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: '', quantity: 1, unit: '', price: '', cost: '', gst: '', description: '' }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const [year, month, day] = value.split('-');
        if (!year || !month || !day) return value;
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleGenerate = (e) => {
        if (e) e.preventDefault();
        const invoiceId = currentInvoiceId || Date.now();
        const newInvoice = {
            id: invoiceId,
            savedAt: new Date().toISOString(),
            items,
            discountEnabled,
            discount,
            billedFrom,
            billedTo,
            invoiceNumber,
            issueDate,
            dueDate,
            deliveryDate,
            notes,
            paymentStatus,
            currency,
            currencySymbol,
            logoUrl
        };

        let updatedInvoices;
        const existingIndex = savedInvoices.findIndex(inv => inv.id === invoiceId);

        if (existingIndex >= 0) {
            updatedInvoices = [...savedInvoices];
            updatedInvoices[existingIndex] = newInvoice;
        } else {
            updatedInvoices = [newInvoice, ...savedInvoices];
        }

        saveToLocalStorage(updatedInvoices);
        setCurrentInvoiceId(invoiceId);
        setShowPreview(true);
    };

    const loadInvoice = (invoice) => {
        setItems(invoice.items.map(item => ({ ...item, cost: item.cost || '', gst: item.gst || item.vat || '' })));
        setDiscountEnabled(invoice.discountEnabled);
        setDiscount(invoice.discount);
        setBilledFrom(invoice.billedFrom);
        setBilledTo(invoice.billedTo);
        setInvoiceNumber(invoice.invoiceNumber);
        setIssueDate(invoice.issueDate);
        setDueDate(invoice.dueDate);
        setDeliveryDate(invoice.deliveryDate);
        setNotes(invoice.notes);
        setPaymentStatus(invoice.paymentStatus || 'Pending');
        setCurrency(invoice.currency || 'USD');
        setCurrencySymbol(invoice.currencySymbol || '$');
        setLogoUrl(invoice.logoUrl);
        setCurrentInvoiceId(invoice.id);
        setShowHistory(false);
    };

    const viewInvoice = (invoice) => {
        setItems(invoice.items.map(item => ({ ...item, cost: item.cost || '', gst: item.gst || item.vat || '' })));
        setDiscountEnabled(invoice.discountEnabled);
        setDiscount(invoice.discount);
        setBilledFrom(invoice.billedFrom);
        setBilledTo(invoice.billedTo);
        setInvoiceNumber(invoice.invoiceNumber);
        setIssueDate(invoice.issueDate);
        setDueDate(invoice.dueDate);
        setDeliveryDate(invoice.deliveryDate);
        setNotes(invoice.notes);
        setPaymentStatus(invoice.paymentStatus || 'Pending');
        setCurrency(invoice.currency || 'USD');
        setCurrencySymbol(invoice.currencySymbol || '$');
        setLogoUrl(invoice.logoUrl);
        setCurrentInvoiceId(invoice.id);
        setShowPreview(true);
    };

    const deleteInvoice = (id) => {
        const updatedInvoices = savedInvoices.filter(inv => inv.id !== id);
        saveToLocalStorage(updatedInvoices);
    };

    const handlePrint = () => {
        window.print();
    };

    const updateField = (setter) => (event) => setter(event.target.value);

    const previewBackLabel = showHistory ? 'Back to saved receipts' : showReport ? 'Back to report' : 'Back to edit';

    const monthlyReport = getMonthlyReport();

    if (showPreview) {
        return (
            <div className="invoice-wrapper preview-view">
                <div className="preview-toolbar">
                    <button className="btn-outline" type="button" onClick={() => setShowPreview(false)}>
                        <ArrowLeft size={16} /> {previewBackLabel}
                    </button>
                    <button className="btn-generate" type="button" onClick={handlePrint}>
                        <Download size={16} /> Download / Print
                    </button>
                </div>

                <div className="preview-card">
                    <div className="preview-header">
                        <div>
                            <h2 className="preview-title">Invoice</h2>
                            <p className="preview-number">Invoice #{invoiceNumber}</p>
                        </div>
                        <div className="preview-logo-box">
                            {logoUrl ? <img src={logoUrl} alt="Logo" /> : <span>Logo</span>}
                        </div>
                    </div>

                    <div className="preview-details-grid">
                        <div className="preview-detail">
                            <div className="preview-detail-title">Billed From</div>
                            <div className="preview-detail-value">
                                {billedFrom.name || 'Your company name'}<br />
                                {billedFrom.address || 'Company address, city, state'}<br />
                                {billedFrom.email || 'email@example.com'}
                            </div>
                        </div>
                        <div className="preview-detail">
                            <div className="preview-detail-title">Billed To</div>
                            <div className="preview-detail-value">
                                {billedTo.name || 'Client name'}<br />
                                {billedTo.address || 'Client address, city, state'}<br />
                                {billedTo.email || 'client@example.com'}
                            </div>
                        </div>
                        <div className="preview-detail">
                            <div className="preview-detail-title">Dates</div>
                            <div className="preview-detail-value">
                                <strong>Issue Date:</strong> {formatDate(issueDate)}<br />
                                <strong>Due Date:</strong> {formatDate(dueDate)}<br />
                                <strong>Delivery Date:</strong> {formatDate(deliveryDate)}
                            </div>
                        </div>
                        <div className="preview-detail">
                            <div className="preview-detail-title">Status</div>
                            <div className="preview-detail-value">
                                <strong>Payment:</strong> {paymentStatus}<br />
                                <strong>Currency:</strong> {currency} ({currencySymbol})
                            </div>
                        </div>
                    </div>

                    <table className="preview-items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Price</th>
                                <th>VAT</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.name || 'Product / Service'}</strong>
                                        {item.description ? <div className="preview-description">{item.description}</div> : null}
                                    </td>
                                    <td>{parseFloat(item.quantity || 0)}</td>
                                    <td>{item.unit || '—'}</td>
                                    <td>{currencySymbol}{parseFloat(item.price || 0).toFixed(2)}</td>
                                    <td>{(item.gst || item.vat) ? `${item.gst || item.vat}%` : '—'}</td>
                                    <td>{currencySymbol}{calculateItemTotal(item)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="preview-summary">
                        <div className="preview-totals">
                            <div className="preview-totals-row">
                                <span>Sub Total</span>
                                <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                            </div>
                            {discountEnabled && parseFloat(discount) > 0 ? (
                                <div className="preview-totals-row">
                                    <span>Discount ({discount}%)</span>
                                    <span>-{currencySymbol}{getDiscountAmount()}</span>
                                </div>
                            ) : null}
                            <div className="preview-totals-row total">
                                <span>Total</span>
                                <span>{currencySymbol}{calculateTotal()}</span>
                            </div>
                        </div>
                    </div>

                    {notes && (
                        <div className="preview-notes">
                            <div className="preview-notes-title">Notes</div>
                            <div className="preview-notes-text">{notes}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const reportSummary = getReportSummary();
    const clientReport = getClientReport();
    const recentInvoices = [...savedInvoices].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5);

    if (showReport) {
        return (
            <InvoiceReport
                reportSummary={reportSummary}
                monthlyReport={monthlyReport}
                clientReport={clientReport}
                recentInvoices={recentInvoices}
                currencySymbol={currencySymbol}
                calculateInvoiceTotal={calculateInvoiceTotal}
                setShowReport={setShowReport}
                setShowHistory={setShowHistory}
            />
        );
    }

    if (showHistory) {
        return (
            <ReceiptHistory
                savedInvoices={savedInvoices}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewInvoice={viewInvoice}
                loadInvoice={loadInvoice}
                deleteInvoice={deleteInvoice}
                setShowHistory={setShowHistory}
                setShowReport={setShowReport}
            />
        );
    }

    return (
        <>
            <form className="invoice-wrapper edit-view" onSubmit={handleGenerate}>
                <div className="invoice-card">
                    <div className="header-row">
                        <div className="logo-upload-box">
                            {logoUrl ? (
                                <div className="logo-preview-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to change logo">
                                    <img src={logoUrl} alt="Logo Preview" className="logo-preview-img" />
                                    <button
                                        className="remove-logo-btn"
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLogoUrl(null);
                                        }}
                                        title="Remove logo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <UploadCloud size={28} color="#94a3b8" />
                            )}
                            <div className="logo-info">
                                <span className="logo-title">{logoUrl ? 'Logo Selected' : 'Add your logo'}</span>
                                <span className="logo-subtitle">{logoUrl ? 'Click image to change' : 'Not required'}</span>
                            </div>
                            {!logoUrl && (
                                <button
                                    className="btn-outline"
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Select File
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleLogoChange}
                            />
                        </div>
                        <h1 className="invoice-title">INVOICE</h1>
                    </div>

                    <div className="details-row">
                        <div className="detail-box">
                            <span className="detail-label">*Billed From</span>
                            <div className="detail-fields">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Company name"
                                    value={billedFrom.name}
                                    onChange={(e) => setBilledFrom({ ...billedFrom, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Address"
                                    value={billedFrom.address}
                                    onChange={(e) => setBilledFrom({ ...billedFrom, address: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Company email (e.g., owner@gmail.com)"
                                    value={billedFrom.email}
                                    onChange={(e) => setBilledFrom({ ...billedFrom, email: e.target.value })}
                                    required
                                    title="Please enter a valid Gmail or work email address"
                                />
                            </div>
                        </div>
                        <div className="detail-box">
                            <span className="detail-label">*Billed To</span>
                            <div className="detail-fields">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Client name"
                                    value={billedTo.name}
                                    onChange={(e) => setBilledTo({ ...billedTo, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Client address"
                                    value={billedTo.address}
                                    onChange={(e) => setBilledTo({ ...billedTo, address: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Client email (e.g., client@gmail.com)"
                                    value={billedTo.email}
                                    onChange={(e) => setBilledTo({ ...billedTo, email: e.target.value })}
                                    required
                                    title="Please enter the client's valid email address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="info-grid">
                        <div className="input-wrapper">
                            <span className="input-label">*Invoice Number</span>
                            <input
                                type="text"
                                className="input-field"
                                value={invoiceNumber}
                                onChange={updateField(setInvoiceNumber)}
                                required
                            />
                        </div>
                        <div className="input-wrapper">
                            <span className="input-label">*Issue Date</span>
                            <input
                                type="date"
                                className="input-field"
                                value={issueDate}
                                onChange={(e) => {
                                    setIssueDate(e.target.value);
                                    if (!dueDate) setDueDate(e.target.value);
                                }}
                                required
                            />
                        </div>
                        <div className="input-wrapper">
                            <span className="input-label">Due Date</span>
                            <input
                                type="date"
                                className="input-field"
                                value={dueDate}
                                onChange={updateField(setDueDate)}
                            />
                        </div>
                        <div className="input-wrapper">
                            <span className="input-label">Delivery Date</span>
                            <input
                                type="date"
                                className="input-field"
                                value={deliveryDate}
                                onChange={updateField(setDeliveryDate)}
                            />
                        </div>
                    </div>

                    <div className="more-options-bar" onClick={() => setShowMoreOptions(!showMoreOptions)}>
                        More Options {showMoreOptions ? '▲' : '▼'}
                    </div>

                    {showMoreOptions && (
                        <div className="info-grid">
                            <div className="input-wrapper">
                                <span className="input-label">Payment Status</span>
                                <select
                                    className="input-field"
                                    value={paymentStatus}
                                    onChange={updateField(setPaymentStatus)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Partially Paid">Partially Paid</option>
                                    <option value="Refunded">Refunded</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">Currency</span>
                                <select
                                    className="input-field"
                                    value={currency}
                                    onChange={(e) => {
                                        const map = {
                                            USD: '$', EUR: '€', GBP: '£', INR: '₹',
                                            JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$',
                                            CHF: 'Fr', SGD: 'S$', AED: 'د.إ', MYR: 'RM',
                                            BRL: 'R$', ZAR: 'R', MXN: 'MX$', KRW: '₩',
                                            HKD: 'HK$', NZD: 'NZ$', SEK: 'kr', NOK: 'kr',
                                        };
                                        setCurrency(e.target.value);
                                        setCurrencySymbol(map[e.target.value] || e.target.value);
                                    }}
                                >
                                    <option value="USD">USD – US Dollar</option>
                                    <option value="EUR">EUR – Euro</option>
                                    <option value="GBP">GBP – British Pound</option>
                                    <option value="INR">INR – Indian Rupee</option>
                                    <option value="JPY">JPY – Japanese Yen</option>
                                    <option value="CNY">CNY – Chinese Yuan</option>
                                    <option value="AUD">AUD – Australian Dollar</option>
                                    <option value="CAD">CAD – Canadian Dollar</option>
                                    <option value="CHF">CHF – Swiss Franc</option>
                                    <option value="SGD">SGD – Singapore Dollar</option>
                                    <option value="AED">AED – UAE Dirham</option>
                                    <option value="MYR">MYR – Malaysian Ringgit</option>
                                    <option value="BRL">BRL – Brazilian Real</option>
                                    <option value="ZAR">ZAR – South African Rand</option>
                                    <option value="MXN">MXN – Mexican Peso</option>
                                    <option value="KRW">KRW – South Korean Won</option>
                                    <option value="HKD">HKD – Hong Kong Dollar</option>
                                    <option value="NZD">NZD – New Zealand Dollar</option>
                                    <option value="SEK">SEK – Swedish Krona</option>
                                    <option value="NOK">NOK – Norwegian Krone</option>
                                </select>
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">Currency Symbol</span>
                                <select
                                    className="input-field"
                                    value={currencySymbol}
                                    onChange={updateField(setCurrencySymbol)}
                                >
                                    <option value="$">$ – Dollar</option>
                                    <option value="€">€ – Euro</option>
                                    <option value="£">£ – Pound</option>
                                    <option value="₹">₹ – Rupee</option>
                                    <option value="¥">¥ – Yen / Yuan</option>
                                    <option value="A$">A$ – Australian Dollar</option>
                                    <option value="C$">C$ – Canadian Dollar</option>
                                    <option value="Fr">Fr – Swiss Franc</option>
                                    <option value="S$">S$ – Singapore Dollar</option>
                                    <option value="د.إ">د.إ – UAE Dirham</option>
                                    <option value="RM">RM – Malaysian Ringgit</option>
                                    <option value="R$">R$ – Brazilian Real</option>
                                    <option value="R">R – South African Rand</option>
                                    <option value="MX$">MX$ – Mexican Peso</option>
                                    <option value="₩">₩ – Korean Won</option>
                                    <option value="HK$">HK$ – Hong Kong Dollar</option>
                                    <option value="NZ$">NZ$ – New Zealand Dollar</option>
                                    <option value="kr">kr – Scandinavian Krone</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="items-header-row">
                            <div className="header-cell" style={{ textAlign: 'left' }}>*Item</div>
                            <div className="header-cell" style={{ textAlign: 'left' }}>Quantity</div>
                            <div className="header-cell" style={{ textAlign: 'left' }}>Unit</div>
                            <div className="header-cell" style={{ textAlign: 'left' }}>*Price</div>
                            <div className="header-cell" style={{ textAlign: 'left' }}>*Cost</div>
                            <div className="header-cell" style={{ textAlign: 'left' }}>Gst (%)</div>
                            <div className="header-cell" style={{ textAlign: 'left', paddingLeft: '8px' }}>Total ({currencySymbol})</div>
                            <div className="header-cell"></div>
                        </div>

                        {items.map((item) => (
                            <div className="item-row-wrapper" key={item.id}>
                                <div className="item-row">
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div className="item-row-grip"><GripVertical size={18} /></div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder='Item description'
                                            value={item.name}
                                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder='Qty'
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                        min="0"
                                        step="1"
                                    />
                                    <select
                                        className="input-field"
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                    >
                                        <option value="">Unit</option>
                                        <option value="pcs">pcs</option>
                                        <option value="hrs">hrs</option>
                                        <option value="days">days</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="lbs">lbs</option>
                                        <option value="m">m</option>
                                        <option value="cm">cm</option>
                                        <option value="ft">ft</option>
                                        <option value="inch">inch</option>
                                        <option value="L">L</option>
                                        <option value="ml">ml</option>
                                        <option value="box">box</option>
                                        <option value="set">set</option>
                                        <option value="pair">pair</option>
                                        <option value="sqft">sqft</option>
                                        <option value="sqm">sqm</option>
                                        <option value="month">month</option>
                                        <option value="year">year</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Price"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                        required
                                        min="0"
                                        step="1"
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Cost"
                                        value={item.cost}
                                        onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                                        min="0"
                                        step="1"
                                    />
                                    <select
                                        className="input-field"
                                        value={item.gst || item.vat}
                                        onChange={(e) => handleItemChange(item.id, 'gst', e.target.value)}
                                        style={{ paddingRight: '4px' }}
                                    >
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={calculateItemTotal(item)}
                                            disabled
                                            style={{ backgroundColor: '#f8fafc' }}
                                        />
                                    </div>
                                    <button className="delete-btn" type="button" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div style={{ paddingLeft: '26px' }}>
                                    <input
                                        type="text"
                                        className="description-input"
                                        placeholder="Add Description..."
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}

                        <button className="add-item-btn" type="button" onClick={handleAddItem}>
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="bottom-section">
                        <div className="notes-section">
                            <span className="input-label" style={{ fontWeight: 800 }}>Notes</span>
                            <textarea
                                className="notes-textarea"
                                placeholder="Enter payment terms, bank details, or a thank you message..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="summary-section">
                            <label className="discount-row">
                                <span className="switch">
                                    <input type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} />
                                    <span className="slider"></span>
                                </span>
                                <span className="discount-label">Discount</span>
                                <span className="discount-input-wrapper">
                                    <input
                                        type="number"
                                        className="discount-input"
                                        disabled={!discountEnabled}
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        min="0"
                                        max="100"
                                        step="1"
                                    />
                                    <span className="discount-symbol">%</span>
                                </span>
                            </label>

                            <div className="totals-box">
                                <span className="totals-label">Total</span>
                                <div className="subtotal-row">
                                    <span>Sub Total</span>
                                    <span>{currencySymbol} {calculateSubtotal().toFixed(2)}</span>
                                </div>
                                {discountEnabled && parseFloat(discount) > 0 && (
                                    <div className="subtotal-row" style={{ color: '#ef4444' }}>
                                        <span>Discount ({discount}%)</span>
                                        <span>-{currencySymbol} {getDiscountAmount()}</span>
                                    </div>
                                )}
                                <div className="total-row">
                                    <span>Total</span>
                                    <span>{currencySymbol} {calculateTotal()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="generate-wrapper">
                    <button className="btn-history" type="button" onClick={() => { setShowHistory(true); setShowReport(false); }}>
                        Saved Receipts
                    </button>
                    <button className="btn-outline" type="button" onClick={() => { setShowReport(true); setShowHistory(false); }}>
                        Invoice Report
                    </button>
                    <div style={{ width: '20px' }} />
                    <button className="btn-generate" type="submit">
                        Generate Document
                    </button>
                </div>
            </form >
        </>
    );
}

export default App;

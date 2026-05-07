import { useRef, useState } from 'react';
import { UploadCloud, GripVertical, Trash2, Plus, ArrowLeft, Download, Search, AlertTriangle, X, FileText, History, PieChart, PlusCircle } from 'lucide-react';
import InvoiceReport from './InvoiceReport.jsx';
import ReceiptHistory from './ReceiptHistory.jsx';
import './index.css';
import Sidebar from './Sidebar.jsx';
import { translations } from './translations';

function App() {
    const [items, setItems] = useState([
        { id: 1, name: '', quantity: '', unit: '', price: '', cost: '', gst: '', description: '' }
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
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [itemDeleteConfirmId, setItemDeleteConfirmId] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('classic');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [language, setLanguage] = useState('en');
    const fileInputRef = useRef(null);

    const t = translations[language];

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

    const roundCurrency = (value) => {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(num)) return 0;
        return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    const parseNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) || !Number.isFinite(parsed) ? 0 : parsed;
    };

    const clampPercent = (value) => {
        const percent = parseNumber(value);
        return Math.min(Math.max(percent, 0), 100);
    };

    const clampNonNegative = (value) => Math.max(parseNumber(value), 0);

    const calculateItemTotal = (item) => {
        const quantity = clampNonNegative(item.quantity);
        const price = clampNonNegative(item.price);
        // Use nullish coalescing to allow 0 as a valid GST value
        const gst = clampPercent(item.gst ?? item.vat ?? 0);
        const subtotal = quantity * price;
        const gstAmount = subtotal * (gst / 100);
        return roundCurrency(subtotal + gstAmount);
    };

    const calculateSubtotal = () => {
        const total = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        return roundCurrency(total);
    };

    const getDiscountAmount = () => {
        if (!discountEnabled) return 0;
        const subtotal = calculateSubtotal();
        const discountValue = clampPercent(discount);
        return roundCurrency((subtotal * discountValue) / 100);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountAmt = getDiscountAmount();
        return roundCurrency(Math.max(subtotal - discountAmt, 0));
    };

    const calculateItemCostTotal = (item) => {
        const quantity = clampNonNegative(item.quantity);
        const cost = clampNonNegative(item.cost);
        return roundCurrency(quantity * cost);
    };

    const calculateInvoiceCostTotal = (invoice) => {
        const invItems = Array.isArray(invoice?.items) ? invoice.items : [];
        const total = invItems.reduce((sum, item) => sum + calculateItemCostTotal(item), 0);
        return roundCurrency(total);
    };

    const calculateInvoiceTotal = (invoice) => {
        if (!invoice) return 0;
        const invItems = Array.isArray(invoice.items) ? invoice.items : [];
        const subtotal = invItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        const discountValue = clampPercent(invoice.discount);
        if (invoice.discountEnabled && discountValue > 0) {
            const discountAmt = (subtotal * discountValue) / 100;
            return roundCurrency(Math.max(subtotal - discountAmt, 0));
        }
        return roundCurrency(subtotal);
    };

    const getReportSummary = () => {
        const totalInvoices = savedInvoices.length;
        const totalRevenue = savedInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv), 0);
        const totalCost = savedInvoices.reduce((sum, inv) => sum + calculateInvoiceCostTotal(inv), 0);
        const totalProfit = totalRevenue - totalCost;
        const unpaidRevenue = savedInvoices.reduce((sum, inv) => {
            const status = inv.paymentStatus || 'Pending';
            if (status === 'Paid') return sum;
            return sum + calculateInvoiceTotal(inv);
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
        setItems([...items, { id: Date.now(), name: '', quantity: '', unit: '', price: '', cost: '', gst: '', description: '' }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map((item) => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
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
        setCurrency(invoice.currency || 'INR');
        setCurrencySymbol(invoice.currencySymbol || '₹');
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
        setCurrency(invoice.currency || 'INR');
        setCurrencySymbol(invoice.currencySymbol || '₹');
        setLogoUrl(invoice.logoUrl);
        setCurrentInvoiceId(invoice.id);
        setShowPreview(true);
    };

    const deleteInvoice = (id) => {
        setDeleteConfirmation(id);
    };

    const confirmDelete = (id) => {
        const updatedInvoices = savedInvoices.filter(inv => inv.id !== id);
        saveToLocalStorage(updatedInvoices);
        setDeleteConfirmation(null);
    };

    const cancelDelete = () => {
        setDeleteConfirmation(null);
    };

    const handlePrint = () => {
        window.print();
    };

    const updateField = (setter) => (event) => setter(event.target.value);

    const previewBackLabel = showHistory ? 'Back to saved receipts' : showReport ? 'Back to report' : 'Back to edit';

    const monthlyReport = getMonthlyReport();

    const activeView = showHistory ? 'history' : showReport ? 'report' : 'edit';

    const handleNavigate = (view) => {
        if (view === 'edit') {
            setShowHistory(false);
            setShowReport(false);
            setShowPreview(false);
        } else if (view === 'history') {
            setShowHistory(true);
            setShowReport(false);
            setShowPreview(false);
        } else if (view === 'report') {
            setShowHistory(false);
            setShowReport(true);
            setShowPreview(false);
        }
    };

    const getContent = () => {
        if (showPreview) {
            return (
                <div className="invoice-wrapper preview-view">
                    <div className="preview-toolbar">
                        <button className="btn-outline" type="button" onClick={() => setShowPreview(false)}>
                            <ArrowLeft size={18} /> {previewBackLabel}
                        </button>
                        <div className="template-selector-wrapper">
                            <span className="template-label">{t.template}:</span>
                            <select 
                                className="template-select" 
                                value={selectedTemplate} 
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="classic">{t.classic}</option>
                                <option value="modern">{t.modern}</option>
                                <option value="minimalist">{t.minimalist}</option>
                                <option value="professional">{t.professional}</option>
                                <option value="elegant">{t.elegant}</option>
                            </select>
                        </div>
                        <button className="btn-generate" type="button" onClick={handlePrint}>
                            <Download size={20} /> {t.downloadPrint}
                        </button>
                    </div>

                    <div className={`preview-card ${selectedTemplate}`}>
                        <div className="preview-header">
                            <div className="preview-header-top-row">
                                <div className="preview-logo-box">
                                    {logoUrl ? <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontWeight: 800, color: 'var(--primary)' }}>LOGO</span>}
                                </div>
                                <div className="preview-header-content">
                                    <h2 className="preview-title">{t.preview}</h2>
                                    <p className="preview-number">INV-{invoiceNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="preview-body-top">
                            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                                <div className="preview-detail-title" style={{ border: 'none', marginBottom: '4px' }}>{t.billedFrom}</div>
                                <div className="preview-detail-value" style={{ fontWeight: 700 }}>
                                    {billedFrom.name || 'Your Company Name'}<br />
                                    <span style={{ fontWeight: 400, opacity: 0.8 }}>{billedFrom.address || 'Address goes here'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="preview-details-grid">
                            <div className="preview-detail">
                                <div className="preview-detail-title" style={{ fontSize: '18px', border: 'none', color: 'var(--text-main)' }}>{t.invoiceTo}:</div>
                                <div className="preview-detail-value">
                                    <strong>{billedTo.name || 'Client Name'}</strong><br />
                                    {billedTo.address || 'Client Address'}<br />
                                    {billedTo.email}
                                </div>
                            </div>
                            <div className="preview-detail" style={{ textAlign: 'right' }}>
                                <div className="preview-detail-title" style={{ fontSize: '18px', border: 'none', color: 'var(--text-main)' }}>{t.invoiceNo}:</div>
                                <div className="preview-detail-value">
                                    <strong>Date:</strong> {formatDate(issueDate)}<br />
                                    <strong>Due:</strong> {formatDate(dueDate)}<br />
                                    <strong>Status:</strong> {paymentStatus}
                                </div>
                            </div>
                        </div>

                        <div className="preview-table" >  <table className="preview-items-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35px' }}>{t.slNo}</th>
                                    <th>{t.description}</th>
                                    <th>{t.price}</th>
                                    <th>{t.quantity}</th>
                                    <th>{t.total}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td data-label="S.L. No">{index + 1}</td>
                                        <td data-label="Description">
                                            <strong>{item.name || 'Product / Service'}</strong>
                                            {item.description ? <div className="preview-description">{item.description}</div> : null}
                                        </td>
                                        <td data-label="Price">{currencySymbol}{parseFloat(item.price || 0).toFixed(2)}</td>
                                        <td data-label="Qty">{parseFloat(item.quantity || 0)} {item.unit}</td>
                                        <td data-label="Total">{currencySymbol}{calculateItemTotal(item).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                        <div className="preview-summary">
                            <div className="preview-summary-notes">
                                {notes && (
                                    <div className="preview-notes" style={{ margin: 0, padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                                        <div className="preview-notes-title" style={{ borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '4px' }}>Terms & Conditions:</div>
                                        <div className="preview-notes-text" style={{ marginTop: '10px' }}>{notes}</div>
                                    </div>
                                )}
                            </div>
                            <div className="preview-totals">
                                <div className="preview-totals-row" style={{ border: 'none', padding: '5px 20px' }}>
                                    <span>Sub Total</span>
                                    <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                {discountEnabled && parseNumber(discount) > 0 ? (
                                    <div className="preview-totals-row" style={{ border: 'none', padding: '5px 20px' }}>
                                        <span>Discount</span>
                                        <span>-{currencySymbol}{getDiscountAmount().toFixed(2)}</span>
                                    </div>
                                ) : null}
                                <div className="preview-totals-row total">
                                    <span>Total</span>
                                    <span>{currencySymbol}{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="preview-signature-area">
                            <div className="signature-box">
                                <div className="signature-line"></div>
                                <div className="signature-label">Signature</div>
                            </div>
                        </div>

                        <div className="preview-footer-geometric"></div>
                    </div>
                </div>
            );
        }

        if (showReport) {
            const reportSummary = getReportSummary();
            const clientReport = getClientReport();
            const recentInvoices = [...savedInvoices].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5);
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
                    viewInvoice={viewInvoice}
                    loadInvoice={loadInvoice}
                    deleteInvoice={deleteInvoice}
                    language={language}
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
                    calculateInvoiceTotal={calculateInvoiceTotal}
                    setShowHistory={setShowHistory}
                    setShowReport={setShowReport}
                    language={language}
                />
            );
        }

        return (
            <form className="invoice-wrapper edit-view" onSubmit={handleGenerate}>
                <div className="invoice-card">
                    <div className="card-header-geometric">
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
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="logo-preview-wrapper" onClick={() => fileInputRef.current?.click()}>
                                        <UploadCloud size={32} color="var(--primary)" />
                                    </div>
                                )}
                                <div className="logo-info">
                                    <span className="logo-title">{logoUrl ? 'Business Logo' : 'Add your logo'}</span>
                                    <span className="logo-subtitle">{logoUrl ? 'Click to replace' : 'JPG, PNG supported'}</span>
                                </div>
                                {!logoUrl && (
                                    <button
                                        className="btn-outline"
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
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
                            <h1 className="invoice-title" style={{ color: 'white', background: 'none', WebkitTextFillColor: 'initial' }}>Invoice</h1>
                        </div>
                    </div>

                    <div className="card-body-editor">
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
                                <span className="input-label">*{t.invoiceNumber}</span>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={invoiceNumber}
                                    onChange={updateField(setInvoiceNumber)}
                                    required
                                />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">*{t.issueDate}</span>
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
                                <span className="input-label">{t.dueDate}</span>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={dueDate}
                                    onChange={updateField(setDueDate)}
                                />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">{t.deliveryDate}</span>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={deliveryDate}
                                    onChange={updateField(setDeliveryDate)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="items-header-row">
                                <div className="header-cell"></div> {/* Spacer for drag handle */}
                                <div className="header-cell" style={{ textAlign: 'left' }}>*Item</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>Quantity</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>Unit</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>*Price</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>Amount</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>Gst (%)</div>
                                <div className="header-cell" style={{ textAlign: 'left', paddingLeft: '8px' }}>Total ({currencySymbol})</div>
                                <div className="header-cell"></div>
                            </div>

                            {items.map((item, index) => (
                                <div className="item-row-wrapper" key={item.id}>
                                    <div className="item-row">
                                        <div className="item-row-grip"><GripVertical size={18} /></div>
                                        
                                        <div className="item-input-group name-field">
                                            <span className="mobile-label">Item Description</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder='Item description'
                                                value={item.name}
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Quantity</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder='Qty'
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                min="0"
                                                step="1"
                                            />
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Unit</span>
                                            <select
                                                className="input-field"
                                                value={item.unit}
                                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                            >
                                                <option value="" disabled>Select unit</option>
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
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Price</span>
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
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Amount</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={(parseNumber(item.quantity) * parseNumber(item.price)).toFixed(2)}
                                                disabled
                                                style={{ backgroundColor: 'transparent' }}
                                                title="Amount before GST"
                                            />
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">GST (%)</span>
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
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Total ({currencySymbol})</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={calculateItemTotal(item).toFixed(2)}
                                                disabled
                                                style={{ backgroundColor: 'transparent' }}
                                            />
                                        </div>

                                        <button className="delete-btn" type="button" onClick={() => setItemDeleteConfirmId(item.id)} title="Delete item">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    {index === 0 && (
                                        <>
                                            <div className="more-options-bar" onClick={() => setShowMoreOptions(!showMoreOptions)}>
                                                {showMoreOptions ? t.fewerOptions : t.moreOptions} {showMoreOptions ? '▲' : '▼'}
                                            </div>
                                            {showMoreOptions && (
                                                <div className="info-grid">
                                                    <div className="input-wrapper">
                                                        <span className="input-label">{t.paymentStatus}</span>
                                                        <select
                                                            className="input-field"
                                                            value={paymentStatus}
                                                            onChange={updateField(setPaymentStatus)}
                                                        >
                                                            <option value="Pending">{t.pending}</option>
                                                            <option value="Paid">{t.paid}</option>
                                                            <option value="Overdue">{t.overdue}</option>
                                                            <option value="Cancelled">{t.cancelled}</option>
                                                            <option value="Partially Paid">{t.partiallyPaid}</option>
                                                            <option value="Refunded">{t.refunded}</option>
                                                            <option value="Draft">{t.draft}</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-wrapper">
                                                        <span className="input-label">{t.currency}</span>
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
                                                        <span className="input-label">{t.currencySymbol}</span>
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
                                        </>
                                    )}
                                    <div className="item-extras">
                                        <input
                                            type="text"
                                            className="description-input"
                                            placeholder="Add Description..."
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        />
                                        <div className="cost-input-wrapper">
                                            <span className="cost-label">Unit Purchase Cost:</span>
                                            <input
                                                type="number"
                                                className="input-field cost-input"
                                                placeholder="0.00"
                                                value={item.cost}
                                                onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                                                min="0"
                                                step="0.01"
                                                title="Internal purchase cost for profit calculation"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="add-item-btn" type="button" onClick={handleAddItem}>
                                <Plus size={16} /> {t.addItem}
                            </button>
                        </div>

                        <div className="bottom-section">
                            <div className="notes-section">
                                <span className="detail-label">{t.notes} / {t.termsConditions}</span>
                                <textarea
                                    className="notes-textarea"
                                    placeholder="Enter additional notes, payment terms, or terms & conditions here..."
                                    value={notes}
                                    onChange={updateField(setNotes)}
                                ></textarea>
                            </div>

                            <div className="summary-section">
                                <div className="totals-box">
                                    <div className="subtotal-row">
                                        <span className="totals-label">{t.subtotal}</span>
                                        <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                                    </div>

                                    <div className="discount-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={discountEnabled}
                                                    onChange={(e) => setDiscountEnabled(e.target.checked)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span className="discount-label">{t.discount}</span>
                                        </div>
                                        {discountEnabled && (
                                            <div className="discount-input-wrapper">
                                                <input
                                                    type="number"
                                                    className="discount-input"
                                                    placeholder="0"
                                                    value={discount}
                                                    onChange={updateField(setDiscount)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="discount-symbol">%</span>
                                            </div>
                                        )}
                                    </div>

                                    {discountEnabled && parseNumber(discount) > 0 && (
                                        <div className="subtotal-row">
                                            <span className="totals-label">{t.discount}</span>
                                            <span style={{ color: 'var(--primary)' }}>-{currencySymbol}{getDiscountAmount().toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="total-row">
                                        <span className="total-label">{t.total}</span>
                                        <span className="total-value">{currencySymbol}{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="generate-wrapper">
                            <button className="btn-generate" type="submit">
                                <Download size={20} /> {t.generateInvoice}
                            </button>
                        </div>
                    </div>
                    <div className="card-footer-geometric"></div>
                </div>
            </form>
        );
    };

    const getPageTitle = () => {
        if (showPreview) return { title: t.preview, icon: <FileText size={22} /> };
        if (showHistory) return { title: t.history, icon: <History size={22} /> };
        if (showReport) return { title: t.plReport, icon: <PieChart size={22} /> };
        return { title: t.createInvoice, icon: <PlusCircle size={22} /> };
    };

    const { title, icon } = getPageTitle();

    const [darkMode, setDarkMode] = useState(() => {
        try {
            return window.localStorage.getItem('darkMode') === 'true';
        } catch {
            return false;
        }
    });

    const toggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        window.localStorage.setItem('darkMode', String(next));
    };

    return (
        <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${showPreview ? 'preview-mode' : ''} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                activeView={activeView}
                onNavigate={handleNavigate}
                showPreview={showPreview}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
                savedInvoices={savedInvoices}
                language={language}
                setLanguage={setLanguage}
            />

            <main className="main-content animate-fade">
                <header className="desktop-page-header">
                    <div className="header-title-group">
                        <h1 className="header-page-title">{title}</h1>
                    </div>
                </header>
                {getContent()}
            </main>

            {itemDeleteConfirmId !== null && (
                <div className="confirm-overlay" onClick={() => setItemDeleteConfirmId(null)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="confirm-close" onClick={() => setItemDeleteConfirmId(null)} title="Close">
                            <X size={18} />
                        </button>
                        <div className="confirm-icon" style={items.length === 1 ? { background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)', color: '#f59e0b' } : {}}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="confirm-title">
                            {items.length === 1 ? 'Cannot Delete' : 'Delete Item?'}
                        </h3>
                        <p className="confirm-message">
                            {items.length === 1
                                ? 'At least one item is required. Add another item before deleting this one.'
                                : 'Are you sure you want to remove this item from the invoice?'}
                        </p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={() => setItemDeleteConfirmId(null)}>
                                {items.length === 1 ? 'OK' : 'No'}
                            </button>
                            {items.length > 1 && (
                                <button className="confirm-btn-delete" onClick={() => { handleRemoveItem(itemDeleteConfirmId); setItemDeleteConfirmId(null); }}>
                                    Yes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmation && (
                <div className="confirm-overlay" onClick={cancelDelete}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="confirm-close" onClick={cancelDelete} title="Close">
                            <X size={18} />
                        </button>
                        <div className="confirm-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="confirm-title">{t.deleteReceiptTitle}</h3>
                        <p className="confirm-message">{t.deleteReceiptMsg}</p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={cancelDelete}>{t.no}</button>
                            <button className="confirm-btn-delete" onClick={() => confirmDelete(deleteConfirmation)}>{t.yes}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default App;

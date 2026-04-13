import { useRef, useState } from 'react';
import { UploadCloud, GripVertical, Trash2, Plus, ArrowLeft, Download, Search } from 'lucide-react';
import './index.css';

function App() {
    const [items, setItems] = useState([
        { id: 1, name: '', quantity: 1, unit: '', price: '', vat: '', description: '' }
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
    const [currency, setCurrency] = useState('USD');
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
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
        const vat = parseFloat(item.vat) || 0;
        const subtotal = quantity * price;
        const vatAmount = subtotal * (vat / 100);
        return (subtotal + vatAmount).toFixed(2);
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

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: '', quantity: 1, unit: '', price: '', vat: '', description: '' }]);
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

    const handleGenerate = () => {
        const newInvoice = {
            id: Date.now(),
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
        const existingIndex = savedInvoices.findIndex(inv => inv.invoiceNumber === invoiceNumber);
        
        if (existingIndex >= 0) {
            updatedInvoices = [...savedInvoices];
            updatedInvoices[existingIndex] = newInvoice;
        } else {
            updatedInvoices = [newInvoice, ...savedInvoices];
        }
        
        saveToLocalStorage(updatedInvoices);
        setShowPreview(true);
    };

    const loadInvoice = (invoice) => {
        setItems(invoice.items);
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
        setShowHistory(false);
    };

    const viewInvoice = (invoice) => {
        setItems(invoice.items);
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

    if (showPreview) {
        return (
            <div className="invoice-wrapper preview-view">
                <div className="preview-toolbar">
                    <button className="btn-outline" type="button" onClick={() => setShowPreview(false)}>
                        <ArrowLeft size={16} /> {showHistory ? 'Back to saved receipts' : 'Back to edit'}
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
                                    <td>{item.vat ? `${item.vat}%` : '—'}</td>
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
                </div>
            </div>
        );
    }

    if (showHistory) {
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
                        <ArrowLeft size={16} /> Back to edit
                    </button>
                    <h2 className="history-title">Saved Receipts</h2>
                </div>

                <div style={{ padding: '0 0 24px 0', width: '100%' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by client name or invoice #"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px', height: '48px' }}
                        />
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
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

    return (
        <>
            <div className="invoice-wrapper edit-view">
                <div className="invoice-card">
                    <div className="header-row">
                        <div className="logo-upload-box">
                            <UploadCloud size={28} color="#94a3b8" />
                            <div className="logo-info">
                                <span className="logo-title">Add your logo</span>
                                <span className="logo-subtitle">Not required</span>
                            </div>
                            <button
                                className="btn-outline"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select File
                            </button>
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
                                />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Address"
                                    value={billedFrom.address}
                                    onChange={(e) => setBilledFrom({ ...billedFrom, address: e.target.value })}
                                />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Email"
                                    value={billedFrom.email}
                                    onChange={(e) => setBilledFrom({ ...billedFrom, email: e.target.value })}
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
                                />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Client address"
                                    value={billedTo.address}
                                    onChange={(e) => setBilledTo({ ...billedTo, address: e.target.value })}
                                />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Client email"
                                    value={billedTo.email}
                                    onChange={(e) => setBilledTo({ ...billedTo, email: e.target.value })}
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
                                <input
                                    type="text"
                                    className="input-field"
                                    value={paymentStatus}
                                    onChange={updateField(setPaymentStatus)}
                                />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">Currency</span>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={currency}
                                    onChange={updateField(setCurrency)}
                                />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-label">Currency Symbol</span>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={currencySymbol}
                                    onChange={updateField(setCurrencySymbol)}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <table className="items-table">
                            <thead>
                                <tr className="items-header">
                                    <th className="header-cell" style={{ textAlign: 'left' }}>*Item</th>
                                    <th className="header-cell" style={{ textAlign: 'left' }}>Quantity</th>
                                    <th className="header-cell" style={{ textAlign: 'left' }}>Unit</th>
                                    <th className="header-cell" style={{ textAlign: 'left' }}>*Price</th>
                                    <th className="header-cell" style={{ textAlign: 'left' }}>VAT (%)</th>
                                    <th className="header-cell" style={{ textAlign: 'left', paddingLeft: '8px' }}>Total ({currencySymbol})</th>
                                    <th className="header-cell"></th>
                                </tr>
                            </thead>
                        </table>

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
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder='Qty'
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder='Unit'
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        
                                        placeholder="Price"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="VAT %"
                                        value={item.vat}
                                        onChange={(e) => handleItemChange(item.id, 'vat', e.target.value)}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            
                                            value={calculateItemTotal(item)}
                                            disabled
                                            style={{ backgroundColor: '#f8fafc' }}
                                        />
                                    </div>
                                    <button className="delete-btn" onClick={() => handleRemoveItem(item.id)}>
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

                        <button className="add-item-btn" onClick={handleAddItem}>
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="bottom-section">
                        <div className="notes-section">
                            <span className="input-label" style={{ fontWeight: 800 }}>Notes</span>
                            <textarea
                                className="notes-textarea"
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
                                <div className="total-row">
                                    <span>Total</span>
                                    <span>{currencySymbol} {calculateTotal()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="generate-wrapper">
                <button className="btn-history" type="button" onClick={() => setShowHistory(true)}>
                    Saved Receipts
                </button>
                <div style={{ width: '20px' }} />
                <button className="btn-generate" type="button" onClick={handleGenerate}>
                    Generate Document
                </button>
            </div>
        </>
    );
}

export default App;

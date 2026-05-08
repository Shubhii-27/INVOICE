import { useRef, useState } from 'react';
import { UploadCloud, GripVertical, Trash2, Plus, ArrowLeft, Download, Search, AlertTriangle, X, FileText, History, PieChart, PlusCircle, Menu } from 'lucide-react';
import InvoiceReport from './InvoiceReport.jsx';
import ReceiptHistory from './ReceiptHistory.jsx';
import './index.css';
import Sidebar from './Sidebar.jsx';
import { translations } from './translations';

function App() {
    const [language, setLanguage] = useState('en');
    const t = translations[language];

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
    const [notes, setNotes] = useState(t.defaultNotes);
    const [paymentStatus, setPaymentStatus] = useState(t.pending);
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
    const [watermarkText, setWatermarkText] = useState('');
    const [watermarkColor, setWatermarkColor] = useState('#000000');
    const [watermarkSize, setWatermarkSize] = useState(100);
    const [watermarkFont, setWatermarkFont] = useState('Inter');
    const [showWatermarkSettings, setShowWatermarkSettings] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(null);
    const [showSignatureSettings, setShowSignatureSettings] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const signatureCanvasRef = useRef(null);
    const signatureInputRef = useRef(null);
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

    // Load draft watermark and signature on initial load
    useState(() => {
        const savedDraft = window.localStorage.getItem('watermarkDraft');
        if (savedDraft) setWatermarkText(savedDraft);
        const savedSig = window.localStorage.getItem('signatureDraft');
        if (savedSig) setSignatureUrl(savedSig);
    });

    const saveToLocalStorage = (invoices) => {
        setSavedInvoices(invoices);
        window.localStorage.setItem('savedInvoices', JSON.stringify(invoices));
    };

    const handleWatermarkChange = (val) => {
        setWatermarkText(val);
        window.localStorage.setItem('watermarkDraft', val);
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

    const calculateLineAmount = (item) => {
        return roundCurrency(parseNumber(item.quantity) * parseNumber(item.price));
    };

    const calculateLineTax = (item) => {
        const amount = parseNumber(item.quantity) * parseNumber(item.price);
        const gst = clampPercent(item.gst ?? item.vat ?? 0);
        return roundCurrency(amount * (gst / 100));
    };

    const calculateItemTotal = (item) => {
        return roundCurrency(calculateLineAmount(item) + calculateLineTax(item));
    };

    const calculateBaseSubtotal = (invoiceItems = items) => {
        return invoiceItems.reduce((sum, item) => sum + calculateLineAmount(item), 0);
    };

    const calculateTotalTax = (invoiceItems = items) => {
        return invoiceItems.reduce((sum, item) => sum + calculateLineTax(item), 0);
    };

    const calculateSubtotal = (invoiceItems = items) => {
        return roundCurrency(calculateBaseSubtotal(invoiceItems) + calculateTotalTax(invoiceItems));
    };

    const getDiscountAmount = (invoice = { items, discount, discountEnabled }) => {
        if (!invoice.discountEnabled) return 0;
        const subtotal = calculateSubtotal(invoice.items);
        const discountValue = clampPercent(invoice.discount);
        return roundCurrency((subtotal * discountValue) / 100);
    };

    const calculateTotal = (invoice = { items, discount, discountEnabled }) => {
        const subtotal = calculateSubtotal(invoice.items);
        const discountAmt = getDiscountAmount(invoice);
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
        return calculateTotal(invoice);
    };

    const getReportSummary = () => {
        const totalInvoices = savedInvoices.length;
        const totalRevenue = savedInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv), 0);
        const totalTax = savedInvoices.reduce((sum, inv) => sum + calculateTotalTax(inv.items), 0);
        const totalCost = savedInvoices.reduce((sum, inv) => sum + calculateInvoiceCostTotal(inv), 0);
        const totalProfit = totalRevenue - totalCost;
        
        const unpaidRevenue = savedInvoices.reduce((sum, inv) => {
            const status = inv.paymentStatus || 'Pending';
            if (status === 'Paid') return sum;
            return sum + calculateInvoiceTotal(inv);
        }, 0);
        
        const averageInvoice = totalInvoices ? totalRevenue / totalInvoices : 0;
        const statusCounts = savedInvoices.reduce((acc, inv) => {
            const status = inv.paymentStatus || t.pending;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalInvoices,
            totalRevenue,
            totalTax,
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
            const clientName = inv.billedTo?.name?.trim() || t.unknownClient;
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

    const translateStatus = (status) => {
        if (!status) return t.pending;
        const s = status.toLowerCase().replace(/\s+/g, '');
        return t[s] || status;
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
            logoUrl,
            watermarkText,
            watermarkColor,
            watermarkSize,
            watermarkFont,
            signatureUrl
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
        setPaymentStatus(invoice.paymentStatus || t.pending);
        setCurrency(invoice.currency || 'INR');
        setCurrencySymbol(invoice.currencySymbol || '₹');
        setLogoUrl(invoice.logoUrl);
        setWatermarkText(invoice.watermarkText || '');
        setWatermarkColor(invoice.watermarkColor || '#000000');
        setWatermarkSize(invoice.watermarkSize || 100);
        setWatermarkFont(invoice.watermarkFont || 'Inter');
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
        setPaymentStatus(invoice.paymentStatus || t.pending);
        setCurrency(invoice.currency || 'INR');
        setCurrencySymbol(invoice.currencySymbol || '₹');
        setLogoUrl(invoice.logoUrl);
        setWatermarkText(invoice.watermarkText || '');
        setWatermarkColor(invoice.watermarkColor || '#000000');
        setWatermarkSize(invoice.watermarkSize || 100);
        setWatermarkFont(invoice.watermarkFont || 'Inter');
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

    // Strict validation helpers
    const handleNumberInput = (setter) => (e) => {
        const val = e.target.value;
        // Allow empty string, numbers, and a single decimal point
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setter(val);
        }
    };

    const handleAlphaInput = (setter) => (e) => {
        const val = e.target.value;
        // Allow letters, spaces, and basic punctuation commonly used in names/descriptions
        if (val === '' || /^[a-zA-Z\s\&\.\-]*$/.test(val)) {
            setter(val);
        }
    };

    const previewBackLabel = showHistory ? t.backToReceipts : showReport ? t.backToReport : t.backToEdit;

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
    const handleSignatureUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const url = reader.result;
            setSignatureUrl(url);
            window.localStorage.setItem('signatureDraft', url);
            setShowSignatureSettings(false);
        };
        reader.readAsDataURL(file);
    };

    const clearSignature = () => {
        setSignatureUrl(null);
        if (signatureCanvasRef.current) {
            const ctx = signatureCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
        }
    };

    const saveDrawnSignature = () => {
        if (signatureCanvasRef.current) {
            const canvas = signatureCanvasRef.current;
            // Check if canvas is empty (simplified check)
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const isCanvasEmpty = !Array.from(data).some(channel => channel !== 0);
            
            if (!isCanvasEmpty) {
                setSignatureUrl(canvas.toDataURL());
                setShowSignatureSettings(false);
            }
        }
    };

    const startDrawing = (e) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        canvas.isDrawing = true;
    };

    const draw = (e) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas || !canvas.isDrawing) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        e.preventDefault();
    };

    const stopDrawing = () => {
        const canvas = signatureCanvasRef.current;
        if (canvas) canvas.isDrawing = false;
    };

    const getContent = () => {
        if (showPreview) {
            return (
                <div className="invoice-wrapper preview-view">
                    <div className="preview-toolbar">
                        <button className="btn-outline btn-back" type="button" onClick={() => setShowPreview(false)}>
                            <ArrowLeft size={18} /> {previewBackLabel}
                        </button>
                        <div className="preview-controls-group">
                            <div className="control-item">
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

                            <div className="control-item" style={{ position: 'relative' }}>
                                <button 
                                    className="btn-outline btn-watermark" 
                                    type="button" 
                                    onClick={() => {
                                        setShowWatermarkSettings(!showWatermarkSettings);
                                        setShowSignatureSettings(false);
                                    }}
                                    style={{ gap: '10px', minWidth: 'max-content', whiteSpace: 'nowrap' }}
                                >
                                    <PlusCircle size={18} /> {t.addWatermark}
                                </button>
                                
                                {showWatermarkSettings && (
                                    <div className="watermark-settings-popover">
                                        <div className="popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)', textTransform: 'uppercase' }}>{t.watermark}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowWatermarkSettings(false)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="popover-row">
                                            <label>{t.watermarkText}:</label>
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                value={watermarkText} 
                                                onChange={(e) => handleWatermarkChange(e.target.value)}
                                                placeholder={t.watermarkPlaceholder}
                                            />
                                        </div>
                                        <div className="popover-row">
                                            <label>{t.font}:</label>
                                            <select 
                                                className="input-field" 
                                                value={watermarkFont} 
                                                onChange={(e) => setWatermarkFont(e.target.value)}
                                            >
                                                <option value="Inter, sans-serif">Modern Clean</option>
                                                <option value="Georgia, serif">Classic Serif</option>
                                                <option value="'Courier New', Courier, monospace">Vintage Typewriter</option>
                                                <option value="'Brush Script MT', cursive">Elegant Handwriting</option>
                                                <option value="Impact, sans-serif">Bold Heavy Stamp</option>
                                                <option value="'Trebuchet MS', sans-serif">Corporate Pro</option>
                                                <option value="'Times New Roman', Times, serif">Legal Formal</option>
                                                <option value="Verdana, Geneva, sans-serif">Wide & Clear</option>
                                                <option value="'Lucida Console', Monaco, monospace">System Tech</option>
                                                <option value="Comic Sans MS, cursive">Casual Fun</option>
                                                <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Bookish Antique</option>
                                                <option value="Garamond, Baskerville, 'Baskerville Old Face', 'Hoefler Text', 'Times New Roman', serif">Old Style Elite</option>
                                                <option value="'Arial Black', Gadget, sans-serif">Super Bold</option>
                                                <option value="'Copperplate', 'Copperplate Gothic Light', sans-serif">Engraved Header</option>
                                                <option value="'Century Gothic', AppleGothic, sans-serif">Geometric Modern</option>
                                                <option value="'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif">News Style</option>
                                            </select>
                                        </div>
                                        <div className="popover-row-grid">
                                            <div className="popover-row">
                                                <label>{t.color}:</label>
                                                <input 
                                                    type="color" 
                                                    value={watermarkColor.startsWith('rgba') ? '#000000' : watermarkColor} 
                                                    onChange={(e) => setWatermarkColor(e.target.value)}
                                                />
                                            </div>
                                            <div className="popover-row">
                                                <label>{t.size}:</label>
                                                <input 
                                                    type="number" 
                                                    className="input-field" 
                                                    value={watermarkSize} 
                                                    onChange={(e) => setWatermarkSize(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="btn-done"
                                            onClick={() => setShowWatermarkSettings(false)}
                                            style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                width: '100%',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {t.done}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-clear-watermark"
                                            onClick={() => handleWatermarkChange('')}
                                            style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                border: 'none',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {t.clear} {t.watermark}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="control-item" style={{ position: 'relative' }}>
                                <button 
                                    className="btn-outline btn-signature-tool" 
                                    type="button" 
                                    onClick={() => {
                                        setShowSignatureSettings(!showSignatureSettings);
                                        setShowWatermarkSettings(false);
                                    }}
                                    style={{ gap: '10px', minWidth: 'max-content', whiteSpace: 'nowrap' }}
                                >
                                    <FileText size={18} /> {t.signatureMaker}
                                </button>
                                
                                {showSignatureSettings && (
                                    <div className="watermark-settings-popover signature-popover">
                                        <div className="popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)', textTransform: 'uppercase' }}>{t.signatureMaker}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowSignatureSettings(false)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="signature-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <button className="btn-tab active" type="button">{t.draw}</button>
                                            <button className="btn-tab" type="button" onClick={() => signatureInputRef.current?.click()}>{t.upload}</button>
                                            <input ref={signatureInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSignatureUpload} />
                                        </div>

                                        <div className="signature-canvas-container" style={{ border: '1px solid var(--border-light)', borderRadius: '8px', background: '#f9fafb', height: '150px', cursor: 'crosshair', position: 'relative' }}>
                                            <canvas 
                                                ref={signatureCanvasRef}
                                                width={240}
                                                height={150}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseOut={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </div>

                                        <div className="popover-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <button className="btn-outline btn-clear" type="button" onClick={clearSignature} style={{ flex: 1, padding: '8px' }}>{t.clear}</button>
                                            <button className="btn-generate" type="button" onClick={saveDrawnSignature} style={{ flex: 1, padding: '8px' }}>{t.save}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="btn-generate btn-print" type="button" onClick={handlePrint}>
                            <Download size={20} /> {t.downloadPrint}
                        </button>
                    </div>

                    <div className={`preview-card ${selectedTemplate}`}>
                        {watermarkText && (
                            <div className="preview-watermark" style={{ color: watermarkColor, fontSize: `${watermarkSize}px`, fontFamily: watermarkFont }}>
                                {watermarkText}
                            </div>
                        )}
                        <div className="preview-header">
                            <div className="preview-header-top-row">
                                <div className="preview-logo-box">
                                    {logoUrl ? <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{t.logo}</span>}
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
                                    {billedFrom.name || t.yourCompanyName}<br />
                                    <span style={{ fontWeight: 400, opacity: 0.8 }}>{billedFrom.address || t.addressGoesHere}</span>
                                </div>
                            </div>
                        </div>

                        <div className="preview-details-grid">
                            <div className="preview-detail">
                                <div className="preview-detail-title" style={{ fontSize: '18px', border: 'none', color: 'var(--text-main)' }}>{t.invoiceTo}:</div>
                                <div className="preview-detail-value">
                                    <strong>{billedTo.name || t.clientNamePlaceholder}</strong><br />
                                    {billedTo.address || t.clientAddressPlaceholder}<br />
                                    {billedTo.email}
                                </div>
                            </div>
                            <div className="preview-detail" style={{ textAlign: 'right' }}>
                                <div className="preview-detail-title" style={{ fontSize: '18px', border: 'none', color: 'var(--text-main)' }}>{t.invoiceNo}:</div>
                                <div className="preview-detail-value">
                                    <strong>{t.date}:</strong> {formatDate(issueDate)}<br />
                                    <strong>{t.dueDate}:</strong> {formatDate(dueDate)}<br />
                                    <strong>{t.status}:</strong> {translateStatus(paymentStatus)}
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
                                            <strong>{item.name || t.productService}</strong>
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
                                        <div className="preview-notes-title" style={{ borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '4px' }}>{t.termsConditions}:</div>
                                        <div className="preview-notes-text" style={{ marginTop: '10px' }}>{notes}</div>
                                    </div>
                                )}
                            </div>
                            <div className="preview-totals">
                                <div className="preview-totals-row" style={{ border: 'none', padding: '5px 20px' }}>
                                    <span>{t.subtotalExclTax}</span>
                                    <span>{currencySymbol}{calculateBaseSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="preview-totals-row" style={{ border: 'none', padding: '5px 20px' }}>
                                    <span>{t.taxTotal}</span>
                                    <span>{currencySymbol}{calculateTotalTax().toFixed(2)}</span>
                                </div>
                                <div className="preview-totals-row" style={{ borderTop: '1px solid #eee', padding: '5px 20px' }}>
                                    <span>{t.subtotal}</span>
                                    <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                {discountEnabled && parseNumber(discount) > 0 ? (
                                    <div className="preview-totals-row" style={{ border: 'none', padding: '5px 20px' }}>
                                        <span>{t.discount}</span>
                                        <span>-{currencySymbol}{getDiscountAmount().toFixed(2)}</span>
                                    </div>
                                ) : null}
                                <div className="preview-totals-row total">
                                    <span>{t.total}</span>
                                    <span>{currencySymbol}{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="preview-signature-area">
                            <div className="signature-box" style={{ cursor: 'pointer' }} onClick={() => setShowSignatureSettings(true)}>
                                {signatureUrl ? (
                                    <img src={signatureUrl} alt="Signature" style={{ maxHeight: '60px', maxWidth: '200px', marginBottom: '5px' }} />
                                ) : (
                                    <div className="signature-line"></div>
                                )}
                                <div className="signature-label">{t.signature}</div>
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
                                    <div className="logo-preview-wrapper" onClick={() => fileInputRef.current?.click()} title={t.clickReplace}>
                                        <img src={logoUrl} alt="Logo Preview" className="logo-preview-img" />
                                        <button
                                            className="remove-logo-btn"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLogoUrl(null);
                                            }}
                                            title={t.removeLogo}
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
                                    <span className="logo-title">{logoUrl ? t.logoTitle : t.addLogo}</span>
                                    <span className="logo-subtitle">{logoUrl ? t.clickReplace : t.logoSubtitle}</span>
                                </div>
                                {!logoUrl && (
                                    <button
                                        className="btn-outline btn-logo-select"
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                                    >
                                        {t.selectFile}
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
                            <h1 className="invoice-title" style={{ color: 'white', background: 'none', WebkitTextFillColor: 'initial' }}>{t.invoice}</h1>
                        </div>
                    </div>

                    <div className="card-body-editor">
                        <div className="details-row">
                            <div className="detail-box">
                                <span className="detail-label">*{t.billedFrom}</span>
                                <div className="detail-fields">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t.businessName}
                                        value={billedFrom.name}
                                        onChange={handleAlphaInput((val) => setBilledFrom({ ...billedFrom, name: val }))}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t.address}
                                        value={billedFrom.address}
                                        onChange={(e) => setBilledFrom({ ...billedFrom, address: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder={t.email}
                                        value={billedFrom.email}
                                        onChange={(e) => setBilledFrom({ ...billedFrom, email: e.target.value })}
                                        required
                                        title="Please enter a valid Gmail or work email address"
                                    />
                                </div>
                            </div>
                            <div className="detail-box">
                                <span className="detail-label">*{t.billedTo}</span>
                                <div className="detail-fields">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t.billedToPlaceholder}
                                        value={billedTo.name}
                                        onChange={handleAlphaInput((val) => setBilledTo({ ...billedTo, name: val }))}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t.addressPlaceholder}
                                        value={billedTo.address}
                                        onChange={(e) => setBilledTo({ ...billedTo, address: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder={t.emailPlaceholder}
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
                                    onChange={handleNumberInput(setInvoiceNumber)}
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
                            <div className="input-wrapper">
                                <span className="input-label">{t.watermark}</span>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={t.watermarkPlaceholder}
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="items-header-row">
                                <div className="header-cell"></div> {/* Spacer for drag handle */}
                                <div className="header-cell" style={{ textAlign: 'left' }}>*{t.item}</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>{t.quantity}</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>{t.unit}</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>*{t.price}</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>{t.amount}</div>
                                <div className="header-cell" style={{ textAlign: 'left' }}>{t.tax}</div>
                                <div className="header-cell" style={{ textAlign: 'left', paddingLeft: '8px' }}>{t.totalWithCurrency.replace('{currency}', currencySymbol)}</div>
                                <div className="header-cell"></div>
                            </div>

                            {items.map((item, index) => (
                                <div className="item-row-wrapper" key={item.id}>
                                    <div className="item-row">
                                        <div className="item-row-grip"><GripVertical size={18} /></div>
                                        
                                        <div className="item-input-group name-field">
                                            <span className="mobile-label">{t.itemDescription}</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder={t.itemPlaceholder}
                                                value={item.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^[a-zA-Z0-9\s\&\.\-\/]*$/.test(val)) {
                                                        handleItemChange(item.id, 'name', val);
                                                    }
                                                }}
                                                required
                                            />
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">{t.quantity}</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder={t.qtyPlaceholder}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                        handleItemChange(item.id, 'quantity', val);
                                                    }
                                                }}
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
                                                <option value="" disabled>{t.unit}</option>
                                                <option value="pcs">{t.pcs}</option>
                                                <option value="hrs">{t.hrs}</option>
                                                <option value="days">{t.days}</option>
                                                <option value="kg">{t.kg}</option>
                                                <option value="g">{t.g}</option>
                                                <option value="lbs">{t.lbs}</option>
                                                <option value="m">{t.m}</option>
                                                <option value="cm">{t.cm}</option>
                                                <option value="ft">{t.ft}</option>
                                                <option value="inch">{t.inch}</option>
                                                <option value="L">{t.L}</option>
                                                <option value="ml">{t.ml}</option>
                                                <option value="box">{t.box}</option>
                                                <option value="set">{t.set}</option>
                                                <option value="pair">{t.pair}</option>
                                                <option value="sqft">{t.sqft}</option>
                                                <option value="sqm">{t.sqm}</option>
                                                <option value="month">{t.month}</option>
                                                <option value="year">{t.year}</option>
                                            </select>
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">Price</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="Price"
                                                value={item.price}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                        handleItemChange(item.id, 'price', val);
                                                    }
                                                }}
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
                                                value={calculateLineAmount(item).toFixed(2)}
                                                disabled
                                                style={{ backgroundColor: 'transparent' }}
                                                title={t.description}
                                            />
                                        </div>

                                        <div className="item-input-group">
                                            <span className="mobile-label">{t.tax} (%)</span>
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
                                            <span className="mobile-label">{t.total} ({currencySymbol})</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={calculateItemTotal(item).toFixed(2)}
                                                disabled
                                                style={{ backgroundColor: 'transparent' }}
                                            />
                                        </div>

                                        <button className="delete-btn" type="button" onClick={() => setItemDeleteConfirmId(item.id)} title={t.delete}>
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
                                            placeholder={t.itemName}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        />
                                        <div className="cost-input-wrapper">
                                            <span className="cost-label">{t.purchaseCost}</span>
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
                                    placeholder={t.defaultNotes}
                                    value={notes}
                                    onChange={updateField(setNotes)}
                                ></textarea>
                            </div>

                            <div className="summary-section">
                                <div className="totals-box">
                                    <div className="subtotal-row">
                                        <span className="totals-label">{t.subtotalExclTax}</span>
                                        <span>{currencySymbol}{calculateBaseSubtotal().toFixed(2)}</span>
                                    </div>

                                    <div className="subtotal-row">
                                        <span className="totals-label">{t.taxTotal}</span>
                                        <span>{currencySymbol}{calculateTotalTax().toFixed(2)}</span>
                                    </div>

                                    <div className="subtotal-row total-before-discount" style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                                        <span className="totals-label">{t.subtotal}</span>
                                        <span style={{ fontWeight: '700' }}>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
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
                                                    onChange={handleNumberInput(setDiscount)}
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
                        <button className="desktop-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
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
                            {items.length === 1 ? t.cannotDeleteTitle : t.deleteConfirmTitle}
                        </h3>
                        <p className="confirm-message">
                            {items.length === 1
                                ? t.cannotDeleteMsg
                                : t.deleteConfirmMsg}
                        </p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={() => setItemDeleteConfirmId(null)}>
                                {items.length === 1 ? t.ok : t.no}
                            </button>
                            {items.length > 1 && (
                                <button className="confirm-btn-delete" onClick={() => { handleRemoveItem(itemDeleteConfirmId); setItemDeleteConfirmId(null); }}>
                                    {t.yes}
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

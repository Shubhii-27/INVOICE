import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  PieChart, 
  Settings, 
  Menu, 
  X,
  PlusCircle,
  Receipt,
  LogOut,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { translations } from './translations';

const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeView, 
  onNavigate,
  showPreview,
  darkMode,
  onToggleDarkMode,
  savedInvoices,
  language,
  setLanguage
}) => {
  const [showSettingsSub, setShowSettingsSub] = useState(false);
  const t = translations[language];
  
  const menuItems = [
    { id: 'edit', label: t.createInvoice, icon: <PlusCircle size={20} /> },
    { id: 'history', label: t.invoiceHistory, icon: <History size={20} /> },
    { id: 'report', label: t.plReport, icon: <PieChart size={20} /> },
  ];

  const getPageTitle = () => {
    if (showPreview) return { title: t.preview, icon: <FileText size={20} /> };
    if (activeView === 'edit') return { title: t.createInvoice, icon: <PlusCircle size={20} /> };
    if (activeView === 'history') return { title: t.history, icon: <History size={20} /> };
    if (activeView === 'report') return { title: t.plReport, icon: <PieChart size={20} /> };
    return { title: 'Invoicify', icon: <Receipt size={20} /> };
  };

  const { title, icon } = getPageTitle();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Receipt className="logo-icon" size={32} />
            <span className="logo-text">Invoicify</span>
          </div>
          <button className="sidebar-close" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">{t.mainMenu}</span>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {activeView === item.id && <div className="active-indicator" />}
              </button>
            ))}
          </div>

          <div className="nav-section" style={{ marginTop: '24px' }}>
            <span className="nav-section-title">{t.settings}</span>
            
            <button 
              className={`nav-item ${showSettingsSub ? 'active' : ''}`} 
              onClick={() => setShowSettingsSub(!showSettingsSub)}
            >
              <span className="nav-icon"><Settings size={20} /></span>
              <span className="nav-label">{t.settings}</span>
              <span style={{ marginLeft: 'auto' }}>
                {showSettingsSub ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {showSettingsSub && (
              <div className="sub-menu" style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {/* Language Section */}
                <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={14} /> {t.languages}
                </div>
                <button 
                  className={`nav-sub-item ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                  style={{
                    background: language === 'en' ? 'rgba(239,68,68,0.1)' : 'none',
                    border: 'none',
                    color: language === 'en' ? 'var(--primary)' : 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%'
                  }}
                >
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: language === 'en' ? 'var(--primary)' : 'transparent' }} />
                  {t.english}
                </button>
                <button 
                  className={`nav-sub-item ${language === 'hi' ? 'active' : ''}`}
                  onClick={() => setLanguage('hi')}
                  style={{
                    background: language === 'hi' ? 'rgba(239,68,68,0.1)' : 'none',
                    border: 'none',
                    color: language === 'hi' ? 'var(--primary)' : 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%'
                  }}
                >
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: language === 'hi' ? 'var(--primary)' : 'transparent' }} />
                  {t.hindi}
                </button>

                {/* Theme Section */}
                <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  {darkMode ? <Moon size={14} /> : <Sun size={14} />} {t.appearance}
                </div>
                <button 
                  className="nav-sub-item"
                  onClick={onToggleDarkMode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%'
                  }}
                >
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'transparent' }} />
                  {darkMode ? t.lightMode : t.darkMode}
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <button className="mobile-menu-toggle" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <span className="logo-text" style={{ fontSize: '18px', fontWeight: '700' }}>
            {title}
          </span>
        </div>
        <div style={{ width: '48px' }} /> {/* Spacer to center title */}
      </div>
    </>
  );
};

export default Sidebar;

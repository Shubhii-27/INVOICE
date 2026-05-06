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
  Sun
} from 'lucide-react';

const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeView, 
  onNavigate,
  showPreview,
  darkMode,
  onToggleDarkMode,
  savedInvoices
}) => {
  const menuItems = [
    { id: 'edit', label: 'Create Invoice', icon: <PlusCircle size={20} /> },
    { id: 'history', label: 'Invoice History', icon: <History size={20} /> },
    { id: 'report', label: 'P&L Report', icon: <PieChart size={20} /> },
  ];

  const getPageTitle = () => {
    if (showPreview) return { title: 'Invoice Preview', icon: <FileText size={20} /> };
    if (activeView === 'edit') return { title: 'Create Invoice', icon: <PlusCircle size={20} /> };
    if (activeView === 'history') return { title: 'Invoice History', icon: <History size={20} /> };
    if (activeView === 'report') return { title: 'P&L Report', icon: <PieChart size={20} /> };
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
            <span className="nav-section-title">Main Menu</span>
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
            <span className="nav-section-title">Preferences</span>
            <button className="nav-item" onClick={onToggleDarkMode}>
              <span className="nav-icon">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </span>
              <span className="nav-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
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

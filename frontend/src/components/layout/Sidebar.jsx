import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { section: 'Main', items: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/sales/new', icon: '🛒', label: 'New Sale' },
    { path: '/sales', icon: '💰', label: 'Sales History' },
  ]},
  { section: 'Inventory', items: [
    { path: '/inventory', icon: '📦', label: 'Inventory' },
    { path: '/inventory/add', icon: '➕', label: 'Add Item', adminOnly: true },
  ]},
  { section: 'Reports', items: [
    { path: '/analytics', icon: '📈', label: 'Analytics', adminOnly: true },
  ]},
  { section: 'Admin', adminOnly: true, items: [
    { path: '/users', icon: '👥', label: 'Users', adminOnly: true },
    { path: '/settings', icon: '⚙️', label: 'Settings', adminOnly: true },
  ]},
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  return (
    <>
      {mobileOpen && <div className="modal-overlay" style={{zIndex:99}} onClick={onMobileClose}></div>}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">💊</div>
          <span className="sidebar-brand-text">Moreran Chemist</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(section => {
            if (section.adminOnly && !isAdmin) return null;
            return (
              <div key={section.section}>
                <div className="nav-section-title">{section.section}</div>
                {section.items.map(item => {
                  if (item.adminOnly && !isAdmin) return null;
                  return (
                    <NavLink key={item.path} to={item.path} onClick={onMobileClose}
                      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={onToggle} style={{width:'100%'}}>
            <span className="nav-icon">{collapsed ? '→' : '←'}</span>
            <span className="nav-label">{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { isAdmin } = useAuth();
  const items = [
    { path: '/dashboard', icon: '📊', label: 'Home' },
    { path: '/sales/new', icon: '🛒', label: 'Sell' },
    { path: '/sales', icon: '💰', label: 'Sales' },
    { path: '/inventory', icon: '📦', label: 'Stock' },
    ...(isAdmin ? [{ path: '/analytics', icon: '📈', label: 'Reports' }] : []),
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {items.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <span className="mobile-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

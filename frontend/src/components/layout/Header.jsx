import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ collapsed, onMenuToggle }) {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Administrator';
    if (isAdmin) return 'Administrator';
    return 'Sales Attendant';
  };

  return (
    <header className={`header${collapsed ? ' collapsed' : ''}`}>
      <div className="header-left">
        <button className="btn-icon" onClick={onMenuToggle} aria-label="Toggle menu">☰</button>
        <div>
          <div className="header-title">Welcome back, {user?.full_name?.split(' ')[0]} 👋</div>
          <div className="header-subtitle">{getRoleLabel()}</div>
        </div>
      </div>
      <div className="header-right">
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}

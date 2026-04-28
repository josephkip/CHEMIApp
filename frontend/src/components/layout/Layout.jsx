import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        <Header collapsed={collapsed} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <div className="page-content animate-in">
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

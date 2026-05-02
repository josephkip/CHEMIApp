import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const notify = useNotification();
  const [passwords, setPasswords] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return notify.error('Passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return notify.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      notify.success('Password changed successfully');
      setPasswords({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const exportSalesCSV = async () => {
    try {
      const { data } = await api.get('/sales?limit=1000');
      const sales = data.data || [];
      if (sales.length === 0) return notify.warning('No sales to export');
      const headers = 'Receipt,Amount,Profit,Payment,Cashier,Date\n';
      const rows = sales.map(s => `${s.receipt_number},${s.total_amount},${s.total_profit},${s.payment_method},${s.cashier_name||''},${new Date(s.created_at).toLocaleString()}`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      notify.success('Sales exported as CSV');
    } catch (err) { notify.error('Export failed'); }
  };

  const exportInventoryCSV = async () => {
    try {
      const { data } = await api.get('/items?limit=500');
      const items = data.data || [];
      if (items.length === 0) return notify.warning('No items to export');
      const headers = 'Name,Category,Buying Price,Selling Price,Stock,Reorder Level,Expiry Date,Supplier\n';
      const rows = items.map(i => `"${i.name}",${i.category_name||''},${i.buying_price},${i.selling_price},${i.stock_quantity},${i.reorder_level},${i.expiry_date||'N/A'},${i.supplier||''}`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      notify.success('Inventory exported as CSV');
    } catch (err) { notify.error('Export failed'); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Settings</h1><p className="page-description">System configuration and account settings</p></div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:16}}>👤 Account Info</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const { data } = await api.put('/auth/profile', {
                full_name: e.target.full_name.value,
                username: e.target.username.value
              });
              updateUser(data.user, data.token);
              notify.success('Profile updated successfully');
            } catch (err) {
              notify.error(err.response?.data?.error || 'Failed to update profile');
            } finally {
              setLoading(false);
            }
          }}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" name="full_name" defaultValue={user?.full_name||''} disabled={user?.role !== 'super_admin'} required /></div>
            <div className="form-group"><label className="form-label">Username</label><input className="form-input" name="username" defaultValue={user?.username||''} disabled={user?.role !== 'super_admin'} required /></div>
            <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={user?.role||''} disabled /></div>
            {user?.role === 'super_admin' && (
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Saving...':'Update Profile'}</button>
            )}
          </form>
        </div>

        <div className="card">
          <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:16}}>🔒 Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})} required minLength={6} /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords,confirmPassword:e.target.value})} required /></div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Saving...':'Update Password'}</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:16}}>📥 Export Data</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'.9rem',marginBottom:16}}>Download your data as CSV files</p>
          <div className="flex-gap" style={{flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={exportSalesCSV}>📊 Export Sales</button>
            <button className="btn btn-secondary" onClick={exportInventoryCSV}>📦 Export Inventory</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:16}}>🏥 Pharmacy Info</h3>
          <p style={{fontSize:'.9rem',color:'var(--text-secondary)'}}><strong>Name:</strong> MORERAN CHEMIST</p>
          <p style={{fontSize:'.9rem',color:'var(--text-secondary)'}}><strong>Currency:</strong> KES (Kenyan Shilling)</p>
          <p style={{fontSize:'.9rem',color:'var(--text-secondary)'}}><strong>Version:</strong> 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

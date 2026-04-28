import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function UserManagement() {
  const notify = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', full_name:'', password:'', role:'sales_attendant' });

  const fetchUsers = () => { api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      notify.success('User created successfully');
      setModal(false); setForm({ username:'', email:'', full_name:'', password:'', role:'sales_attendant' });
      fetchUsers();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to create user'); }
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/users/${id}/toggle-active`);
      notify.success('User status updated');
      fetchUsers();
    } catch (err) { notify.error('Failed to update user'); }
  };

  const resetPassword = async (id, name) => {
    if (!confirm(`Reset password for ${name} to default (User@123)?`)) return;
    try {
      await api.put(`/users/${id}/reset-password`);
      notify.success('Password reset to User@123');
    } catch (err) { notify.error('Failed to reset password'); }
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1 className="page-title">User Management</h1><p className="page-description">Manage staff accounts</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Add User</button>
      </div>

      <div className="table-container card" style={{padding:0}}>
        <table className="table">
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.full_name}</strong></td>
                <td>{u.username}</td>
                <td style={{fontSize:'.85rem'}}>{u.email}</td>
                <td><span className={`badge ${u.role==='admin'?'badge-primary':'badge-info'}`}>{u.role}</span></td>
                <td><span className={`status-dot ${u.is_active?'active':'inactive'}`}></span>{u.is_active?'Active':'Inactive'}</td>
                <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                <td>
                  <div className="flex-gap">
                    <button className={`btn btn-sm ${u.is_active?'btn-danger':'btn-success'}`} onClick={()=>toggleActive(u.id)}>{u.is_active?'Disable':'Enable'}</button>
                    <button className="btn btn-sm btn-secondary" onClick={()=>resetPassword(u.id, u.full_name)}>Reset PW</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Add New User</h3><button className="modal-close" onClick={()=>setModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div>
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-input form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="sales_attendant">Sales Attendant</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary" type="submit">Create User</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

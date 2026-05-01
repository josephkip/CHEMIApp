import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function Procurement() {
  const { isAdmin } = useAuth();
  const notify = useNotification();
  const [tab, setTab] = useState('suppliers');
  
  // Suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // LPOs
  const [lpos, setLpos] = useState([]);
  
  // GRNs
  const [grns, setGrns] = useState([]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
      if (tab === 'suppliers') {
        const res = await api.get('/procurement/suppliers');
        setSuppliers(res.data);
      } else if (tab === 'lpos') {
        const res = await api.get('/procurement/lpo');
        setLpos(res.data.data);
      } else if (tab === 'grns') {
        const res = await api.get('/procurement/grn');
        setGrns(res.data.data);
      }
    } catch (err) {
      notify.error('Failed to load data');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/procurement/suppliers', supplierForm);
      notify.success('Supplier added');
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
      fetchData();
    } catch (err) {
      notify.error('Failed to add supplier');
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Procurement</h1>
          <p className="page-description">Manage Suppliers, Purchase Orders, and GRNs</p>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
        <button className={`btn btn-sm ${tab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('suppliers')}>Suppliers</button>
        <button className={`btn btn-sm ${tab === 'lpos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('lpos')}>Purchase Orders (LPO)</button>
        <button className={`btn btn-sm ${tab === 'grns' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('grns')}>Goods Received (GRN)</button>
      </div>

      {tab === 'suppliers' && (
        <div>
          {isAdmin && <button className="btn btn-primary mb-2" onClick={() => setShowSupplierModal(true)}>+ Add Supplier</button>}
          <div className="table-container card" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Name</th><th>Contact Person</th><th>Email</th><th>Phone</th></tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.contact_person || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.phone || '—'}</td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan="4" className="text-center text-muted">No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'lpos' && (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>ID</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {lpos.map(l => (
                <tr key={l.id}>
                  <td>LPO-{l.id}</td>
                  <td>{l.supplier_name}</td>
                  <td>KES {Number(l.total_amount).toLocaleString()}</td>
                  <td><span className={`badge badge-${l.status === 'pending' ? 'warning' : 'success'}`}>{l.status}</span></td>
                  <td>{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {lpos.length === 0 && <tr><td colSpan="5" className="text-center text-muted">No Purchase Orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'grns' && (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>ID</th><th>Supplier</th><th>Received By</th><th>Date</th></tr></thead>
            <tbody>
              {grns.map(g => (
                <tr key={g.id}>
                  <td>GRN-{g.id}</td>
                  <td>{g.supplier_name}</td>
                  <td>{g.received_by_name}</td>
                  <td>{new Date(g.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {grns.length === 0 && <tr><td colSpan="4" className="text-center text-muted">No GRNs found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Supplier</h3>
              <button className="modal-close" onClick={() => setShowSupplierModal(false)}>×</button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

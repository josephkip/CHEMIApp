import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const fmt = (v) => `KES ${Number(v||0).toLocaleString()}`;

export default function Inventory() {
  const { isAdmin } = useAuth();
  const notify = useNotification();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (category) params.set('category_id', category);
    if (stockStatus) params.set('stock_status', stockStatus);
    api.get(`/items?${params}`).then(res => {
      setItems(res.data.data);
      setPagination(res.data.pagination);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [page, category, stockStatus]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)).catch(()=>{}); }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchItems(); };

  const handleRestock = async () => {
    if (!restockQty || restockQty <= 0) return;
    try {
      await api.post(`/items/${restockModal.id}/restock`, { quantity: parseInt(restockQty) });
      notify.success(`Restocked ${restockModal.name}`);
      setRestockModal(null); setRestockQty('');
      fetchItems();
    } catch (err) { notify.error(err.response?.data?.error || 'Restock failed'); }
  };

  const getStockBadge = (item) => {
    if (item.stock_quantity === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (item.stock_quantity <= item.reorder_level) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  const getExpiryBadge = (item) => {
    if (!item.expiry_date) return null;
    const days = Math.ceil((new Date(item.expiry_date) - new Date()) / 86400000);
    if (days < 0) return <span className="badge badge-danger">Expired</span>;
    if (days <= 30) return <span className="badge badge-danger">Exp {days}d</span>;
    if (days <= 90) return <span className="badge badge-warning">Exp {days}d</span>;
    return null;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1 className="page-title">Inventory</h1><p className="page-description">Manage your stock items</p></div>
        {isAdmin && <Link to="/inventory/add" className="btn btn-primary">+ Add Item</Link>}
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} style={{flex:1,display:'flex',gap:12}}>
          <input className="form-input" placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:300}} />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
        </form>
        <select className="form-input form-select" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}} style={{width:180}}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-input form-select" value={stockStatus} onChange={e=>{setStockStatus(e.target.value);setPage(1)}} style={{width:150}}>
          <option value="">All Stock</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-container card" style={{padding:0}}>
          <table className="table">
            <thead><tr><th>Item Name</th><th>Category</th><th>Buying</th><th>Selling</th><th>Stock</th><th>Status</th><th>Expiry</th>{isAdmin&&<th>Actions</th>}</tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={isAdmin?8:7} className="text-center" style={{padding:40,color:'var(--text-muted)'}}>No items found</td></tr> :
              items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="badge badge-info">{item.category_name||'—'}</span></td>
                  <td>{fmt(item.buying_price)}</td>
                  <td>{fmt(item.selling_price)}</td>
                  <td><strong>{item.stock_quantity}</strong> <span style={{color:'var(--text-muted)',fontSize:'.75rem'}}>{item.unit}</span></td>
                  <td>{getStockBadge(item)}</td>
                  <td>{getExpiryBadge(item) || <span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  {isAdmin && <td>
                    <div className="flex-gap">
                      <button className="btn btn-sm btn-success" onClick={()=>setRestockModal(item)}>Restock</button>
                      <Link to={`/inventory/edit/${item.id}`} className="btn btn-sm btn-secondary">Edit</Link>
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex-center mt-2" style={{gap:8}}>
          <button className="btn btn-sm btn-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span style={{fontSize:'.85rem'}}>Page {page} of {pagination.totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={!pagination.hasMore} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}

      {restockModal && (
        <div className="modal-overlay" onClick={()=>setRestockModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Restock: {restockModal.name}</h3>
              <button className="modal-close" onClick={()=>setRestockModal(null)}>×</button>
            </div>
            <p style={{marginBottom:16,color:'var(--text-secondary)'}}>Current stock: <strong>{restockModal.stock_quantity} {restockModal.unit}</strong></p>
            <div className="form-group">
              <label className="form-label">Quantity to Add</label>
              <input className="form-input" type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="Enter quantity" autoFocus />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setRestockModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleRestock}>Confirm Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

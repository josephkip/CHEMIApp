import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

const fmt = (v) => `KES ${Number(v||0).toLocaleString()}`;

export default function Procurement() {
  const { isAdmin } = useAuth();
  const notify = useNotification();
  const [tab, setTab] = useState('suppliers');

  // Data
  const [suppliers, setSuppliers] = useState([]);
  const [lpos, setLpos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [items, setItems] = useState([]);

  // Supplier modal
  const [supplierModal, setSupplierModal] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name:'', contact_person:'', email:'', phone:'', address:'' });

  // LPO modal
  const [lpoModal, setLpoModal] = useState(false);
  const [lpoForm, setLpoForm] = useState({ supplier_id:'', notes:'', items: [{ item_id:'', quantity:'', buying_price:'' }] });

  // GRN modal
  const [grnModal, setGrnModal] = useState(false);
  const [grnForm, setGrnForm] = useState({ po_id:'', supplier_id:'', notes:'', items: [{ item_id:'', quantity_received:'', buying_price:'' }] });

  // Detail modals
  const [lpoDetail, setLpoDetail] = useState(null);
  const [grnDetail, setGrnDetail] = useState(null);

  useEffect(() => { fetchData(); }, [tab]);
  useEffect(() => {
    api.get('/items?limit=500').then(r => setItems(r.data.data || [])).catch(()=>{});
    api.get('/procurement/suppliers').then(r => setSuppliers(r.data)).catch(()=>{});
  }, []);

  const fetchData = async () => {
    try {
      if (tab === 'suppliers') { const r = await api.get('/procurement/suppliers'); setSuppliers(r.data); }
      else if (tab === 'lpos') { const r = await api.get('/procurement/lpo'); setLpos(r.data.data || []); }
      else if (tab === 'grns') { const r = await api.get('/procurement/grn'); setGrns(r.data.data || []); }
    } catch { notify.error('Failed to load data'); }
  };

  // ── Supplier CRUD ──
  const openAddSupplier = () => { setEditSupplierId(null); setSupplierForm({ name:'', contact_person:'', email:'', phone:'', address:'' }); setSupplierModal(true); };
  const openEditSupplier = (s) => { setEditSupplierId(s.id); setSupplierForm({ name: s.name, contact_person: s.contact_person||'', email: s.email||'', phone: s.phone||'', address: s.address||'' }); setSupplierModal(true); };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSupplierId) { await api.put(`/procurement/suppliers/${editSupplierId}`, supplierForm); notify.success('Supplier updated'); }
      else { await api.post('/procurement/suppliers', supplierForm); notify.success('Supplier added'); }
      setSupplierModal(false); fetchData();
    } catch { notify.error('Failed to save supplier'); }
  };

  // ── LPO ──
  const openCreateLPO = () => { setLpoForm({ supplier_id:'', notes:'', items:[{ item_id:'', quantity:'', buying_price:'' }] }); setLpoModal(true); };
  const addLpoItem = () => setLpoForm(f => ({ ...f, items: [...f.items, { item_id:'', quantity:'', buying_price:'' }] }));
  const removeLpoItem = (i) => setLpoForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }));
  const updateLpoItem = (i, k, v) => setLpoForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[k]:v} : it) }));
  const lpoTotal = lpoForm.items.reduce((s,it) => s + (parseFloat(it.quantity)||0) * (parseFloat(it.buying_price)||0), 0);

  const handleLpoSubmit = async (e) => {
    e.preventDefault();
    const validItems = lpoForm.items.filter(it => it.item_id && it.quantity && it.buying_price);
    if (validItems.length === 0) return notify.warning('Add at least one item');
    try {
      await api.post('/procurement/lpo', {
        supplier_id: parseInt(lpoForm.supplier_id),
        notes: lpoForm.notes,
        items: validItems.map(it => ({ item_id: parseInt(it.item_id), quantity: parseInt(it.quantity), buying_price: parseFloat(it.buying_price) }))
      });
      notify.success('Purchase Order created'); setLpoModal(false); setTab('lpos'); fetchData();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to create LPO'); }
  };

  const viewLpoDetail = async (id) => { try { const r = await api.get(`/procurement/lpo/${id}`); setLpoDetail(r.data); } catch { notify.error('Failed to load LPO'); } };

  // ── GRN ──
  const openCreateGRN = () => { setGrnForm({ po_id:'', supplier_id:'', notes:'', items:[{ item_id:'', quantity_received:'', buying_price:'' }] }); setGrnModal(true); };
  const addGrnItem = () => setGrnForm(f => ({ ...f, items: [...f.items, { item_id:'', quantity_received:'', buying_price:'' }] }));
  const removeGrnItem = (i) => setGrnForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }));
  const updateGrnItem = (i, k, v) => setGrnForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[k]:v} : it) }));

  const handleGrnSubmit = async (e) => {
    e.preventDefault();
    const validItems = grnForm.items.filter(it => it.item_id && it.quantity_received && it.buying_price);
    if (validItems.length === 0) return notify.warning('Add at least one item');
    try {
      await api.post('/procurement/grn', {
        po_id: grnForm.po_id ? parseInt(grnForm.po_id) : null,
        supplier_id: parseInt(grnForm.supplier_id),
        notes: grnForm.notes,
        items: validItems.map(it => ({ item_id: parseInt(it.item_id), quantity_received: parseInt(it.quantity_received), buying_price: parseFloat(it.buying_price) }))
      });
      notify.success('Goods Received Note created — stock updated!'); setGrnModal(false); setTab('grns'); fetchData();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to create GRN'); }
  };

  const viewGrnDetail = async (id) => { try { const r = await api.get(`/procurement/grn/${id}`); setGrnDetail(r.data); } catch { notify.error('Failed to load GRN'); } };

  // ── Dynamic items form component ──
  const ItemRows = ({ formItems, updateFn, removeFn, qtyField = 'quantity' }) => (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      {formItems.map((it, i) => (
        <div key={i} style={{ display:'flex', gap: 8, alignItems:'flex-end' }}>
          <div style={{ flex: 2 }}>
            {i === 0 && <label className="form-label" style={{fontSize:'.75rem'}}>Item</label>}
            <select className="form-input form-select" value={it.item_id} onChange={e => updateFn(i, 'item_id', e.target.value)} required>
              <option value="">Select item</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            {i === 0 && <label className="form-label" style={{fontSize:'.75rem'}}>Quantity</label>}
            <input className="form-input" type="number" min="1" placeholder="Qty" value={it[qtyField]} onChange={e => updateFn(i, qtyField, e.target.value)} required />
          </div>
          <div style={{ flex: 1 }}>
            {i === 0 && <label className="form-label" style={{fontSize:'.75rem'}}>Price (KES)</label>}
            <input className="form-input" type="number" min="0" step="0.01" placeholder="Price" value={it.buying_price} onChange={e => updateFn(i, 'buying_price', e.target.value)} required />
          </div>
          <button type="button" className="btn btn-sm btn-danger" style={{height:38}} onClick={() => removeFn(i)} disabled={formItems.length <= 1}>✕</button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1 className="page-title">Procurement</h1><p className="page-description">Manage Suppliers, Purchase Orders, and Goods Received</p></div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, borderBottom:'1px solid var(--border-color)', paddingBottom: 12 }}>
        {['suppliers','lpos','grns'].map(t => (
          <button key={t} className={`btn btn-sm ${tab===t?'btn-primary':'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'suppliers' ? '🏪 Suppliers' : t === 'lpos' ? '📝 Purchase Orders (LPO)' : '📥 Goods Received (GRN)'}
          </button>
        ))}
      </div>

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <div>
          {isAdmin && <button className="btn btn-primary mb-2" onClick={openAddSupplier}>+ Add Supplier</button>}
          <div className="table-container card" style={{ padding:0 }}>
            <table className="table">
              <thead><tr><th>Name</th><th>Contact Person</th><th>Email</th><th>Phone</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td><td>{s.contact_person||'—'}</td><td>{s.email||'—'}</td><td>{s.phone||'—'}</td>
                    {isAdmin && <td><button className="btn btn-sm btn-secondary" onClick={() => openEditSupplier(s)}>Edit</button></td>}
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan={isAdmin?5:4} className="text-center text-muted" style={{padding:40}}>No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LPO TAB ── */}
      {tab === 'lpos' && (
        <div>
          {isAdmin && <button className="btn btn-primary mb-2" onClick={openCreateLPO}>+ Create Purchase Order</button>}
          <div className="table-container card" style={{ padding:0 }}>
            <table className="table">
              <thead><tr><th>LPO #</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Created By</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {lpos.map(l => (
                  <tr key={l.id}>
                    <td><span className="font-mono">LPO-{l.id}</span></td>
                    <td>{l.supplier_name}</td>
                    <td><strong>{fmt(l.total_amount)}</strong></td>
                    <td><span className={`badge badge-${l.status==='pending'?'warning':'success'}`}>{l.status}</span></td>
                    <td>{l.created_by_name||'—'}</td>
                    <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => viewLpoDetail(l.id)}>View</button></td>
                  </tr>
                ))}
                {lpos.length === 0 && <tr><td colSpan="7" className="text-center text-muted" style={{padding:40}}>No Purchase Orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRN TAB ── */}
      {tab === 'grns' && (
        <div>
          {isAdmin && <button className="btn btn-primary mb-2" onClick={openCreateGRN}>+ Receive Goods (GRN)</button>}
          <div className="table-container card" style={{ padding:0 }}>
            <table className="table">
              <thead><tr><th>GRN #</th><th>Supplier</th><th>Received By</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {grns.map(g => (
                  <tr key={g.id}>
                    <td><span className="font-mono">GRN-{g.id}</span></td>
                    <td>{g.supplier_name}</td>
                    <td>{g.received_by_name}</td>
                    <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{new Date(g.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => viewGrnDetail(g.id)}>View</button></td>
                  </tr>
                ))}
                {grns.length === 0 && <tr><td colSpan="5" className="text-center text-muted" style={{padding:40}}>No Goods Received Notes found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUPPLIER MODAL ── */}
      {supplierModal && (
        <div className="modal-overlay" onClick={() => setSupplierModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">{editSupplierId ? 'Edit' : 'Add'} Supplier</h3><button className="modal-close" onClick={() => setSupplierModal(false)}>×</button></div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} /></div>
              <div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={() => setSupplierModal(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE LPO MODAL ── */}
      {lpoModal && (
        <div className="modal-overlay" onClick={() => setLpoModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:650}}>
            <div className="modal-header"><h3 className="modal-title">Create Purchase Order (LPO)</h3><button className="modal-close" onClick={() => setLpoModal(false)}>×</button></div>
            <form onSubmit={handleLpoSubmit}>
              <div className="form-row">
                <div className="form-group" style={{flex:2}}>
                  <label className="form-label">Supplier *</label>
                  <select className="form-input form-select" value={lpoForm.supplier_id} onChange={e => setLpoForm({...lpoForm, supplier_id: e.target.value})} required>
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Total</label>
                  <div className="form-input" style={{background:'var(--bg-color)',fontWeight:700,color:'var(--primary)'}}>{fmt(lpoTotal)}</div>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Items *</label>
                <ItemRows formItems={lpoForm.items} updateFn={updateLpoItem} removeFn={removeLpoItem} qtyField="quantity" />
                <button type="button" className="btn btn-ghost btn-sm mt-1" onClick={addLpoItem}>+ Add Row</button>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={lpoForm.notes} onChange={e => setLpoForm({...lpoForm, notes: e.target.value})} /></div>
              <div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={() => setLpoModal(false)}>Cancel</button><button className="btn btn-primary" type="submit">Create LPO</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE GRN MODAL ── */}
      {grnModal && (
        <div className="modal-overlay" onClick={() => setGrnModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:650}}>
            <div className="modal-header"><h3 className="modal-title">Receive Goods (GRN)</h3><button className="modal-close" onClick={() => setGrnModal(false)}>×</button></div>
            <form onSubmit={handleGrnSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select className="form-input form-select" value={grnForm.supplier_id} onChange={e => setGrnForm({...grnForm, supplier_id: e.target.value})} required>
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Link to LPO (optional)</label>
                  <select className="form-input form-select" value={grnForm.po_id} onChange={e => setGrnForm({...grnForm, po_id: e.target.value})}>
                    <option value="">No linked LPO</option>
                    {lpos.filter(l => l.status === 'pending').map(l => <option key={l.id} value={l.id}>LPO-{l.id} ({l.supplier_name})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Items Received *</label>
                <ItemRows formItems={grnForm.items} updateFn={updateGrnItem} removeFn={removeGrnItem} qtyField="quantity_received" />
                <button type="button" className="btn btn-ghost btn-sm mt-1" onClick={addGrnItem}>+ Add Row</button>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={grnForm.notes} onChange={e => setGrnForm({...grnForm, notes: e.target.value})} /></div>
              <div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={() => setGrnModal(false)}>Cancel</button><button className="btn btn-success" type="submit">Receive Goods & Update Stock</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ── LPO DETAIL MODAL ── */}
      {lpoDetail && (
        <div className="modal-overlay" onClick={() => setLpoDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Purchase Order — LPO-{lpoDetail.id}</h3><button className="modal-close" onClick={() => setLpoDetail(null)}>×</button></div>
            <div style={{marginBottom:12}}>
              <p><strong>Supplier:</strong> {lpoDetail.supplier_name}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${lpoDetail.status==='pending'?'warning':'success'}`}>{lpoDetail.status}</span></p>
              <p><strong>Date:</strong> {new Date(lpoDetail.created_at).toLocaleString()}</p>
              {lpoDetail.notes && <p><strong>Notes:</strong> {lpoDetail.notes}</p>}
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {lpoDetail.items?.map((it, i) => (
                    <tr key={i}><td>{it.item_name}</td><td>{it.quantity}</td><td>{fmt(it.buying_price)}</td><td>{fmt(it.quantity * it.buying_price)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-between mt-2 font-bold" style={{fontSize:'1.1rem'}}><span>Total:</span><span>{fmt(lpoDetail.total_amount)}</span></div>
          </div>
        </div>
      )}

      {/* ── GRN DETAIL MODAL ── */}
      {grnDetail && (
        <div className="modal-overlay" onClick={() => setGrnDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Goods Received — GRN-{grnDetail.id}</h3><button className="modal-close" onClick={() => setGrnDetail(null)}>×</button></div>
            <div style={{marginBottom:12}}>
              <p><strong>Supplier:</strong> {grnDetail.supplier_name}</p>
              <p><strong>Received By:</strong> {grnDetail.received_by_name}</p>
              <p><strong>Date:</strong> {new Date(grnDetail.created_at).toLocaleString()}</p>
              {grnDetail.notes && <p><strong>Notes:</strong> {grnDetail.notes}</p>}
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Item</th><th>Qty Received</th><th>Unit Price</th></tr></thead>
                <tbody>
                  {grnDetail.items?.map((it, i) => (
                    <tr key={i}><td>{it.item_name}</td><td>{it.quantity_received}</td><td>{fmt(it.buying_price)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

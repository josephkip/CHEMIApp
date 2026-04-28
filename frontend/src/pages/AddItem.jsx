import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function AddItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:'', category_id:'', buying_price:'', selling_price:'',
    stock_quantity:'', reorder_level:'10', expiry_date:'',
    batch_number:'', supplier:'', unit:'pcs', description:''
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(()=>{});
    if (isEdit) {
      api.get(`/items/${id}`).then(r => {
        const d = r.data;
        setForm({
          name:d.name, category_id:d.category_id||'', buying_price:d.buying_price,
          selling_price:d.selling_price, stock_quantity:d.stock_quantity,
          reorder_level:d.reorder_level, expiry_date:d.expiry_date?d.expiry_date.split('T')[0]:'',
          batch_number:d.batch_number||'', supplier:d.supplier||'', unit:d.unit||'pcs', description:d.description||''
        });
      });
    }
  }, [id]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {...form, buying_price:parseFloat(form.buying_price), selling_price:parseFloat(form.selling_price),
        stock_quantity:parseInt(form.stock_quantity)||0, reorder_level:parseInt(form.reorder_level)||10,
        category_id:form.category_id?parseInt(form.category_id):null, expiry_date:form.expiry_date||null};
      if (isEdit) { await api.put(`/items/${id}`, payload); notify.success('Item updated'); }
      else { await api.post('/items', payload); notify.success('Item added'); }
      navigate('/inventory');
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to save item'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">{isEdit?'Edit':'Add New'} Item</h1></div>
      <div className="card" style={{maxWidth:700}}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input form-select" value={form.category_id} onChange={e=>set('category_id',e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input form-select" value={form.unit} onChange={e=>set('unit',e.target.value)}>
                {['pcs','pack','bottle','tube','box','roll','strip'].map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Buying Price (KES) *</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.buying_price} onChange={e=>set('buying_price',e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (KES) *</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.selling_price} onChange={e=>set('selling_price',e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEdit?'Current Stock':'Initial Stock'}</label>
              <input className="form-input" type="number" min="0" value={form.stock_quantity} onChange={e=>set('stock_quantity',e.target.value)} disabled={isEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input className="form-input" type="number" min="0" value={form.reorder_level} onChange={e=>set('reorder_level',e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" type="date" value={form.expiry_date} onChange={e=>set('expiry_date',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Batch Number</label>
              <input className="form-input" value={form.batch_number} onChange={e=>set('batch_number',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input className="form-input" value={form.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
          <div className="flex-gap mt-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Saving...': isEdit?'Update Item':'Add Item'}</button>
            <button className="btn btn-secondary" type="button" onClick={()=>navigate('/inventory')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

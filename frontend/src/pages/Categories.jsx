import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function Categories() {
  const { isAdmin } = useAuth();
  const notify = useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories').then(r => setCategories(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditId(null); setForm({ name: '', description: '' }); setModal(true); };
  const openEdit = (cat) => { setEditId(cat.id); setForm({ name: cat.name, description: cat.description || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, form);
        notify.success('Category updated');
      } else {
        await api.post('/categories', form);
        notify.success('Category created');
      }
      setModal(false);
      fetchCategories();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to save category');
    }
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-description">Organize your inventory by category</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>}
      </div>

      <div className="table-container card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Description</th><th>Created</th>{isAdmin && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No categories found. Add your first category to get started.</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.id}>
                <td><strong>{cat.name}</strong></td>
                <td style={{ color: 'var(--text-secondary)' }}>{cat.description || '—'}</td>
                <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{new Date(cat.created_at).toLocaleDateString()}</td>
                {isAdmin && (
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(cat)}>Edit</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit' : 'Add'} Category</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Antibiotics" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

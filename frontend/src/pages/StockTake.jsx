import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';

export default function StockTake() {
  const { user } = useAuth();
  const notify = useNotification();
  const [stockTakes, setStockTakes] = useState([]);
  const [activeStockTake, setActiveStockTake] = useState(null);
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    fetchStockTakes();
  }, []);

  const fetchStockTakes = async () => {
    try {
      const res = await api.get('/stock-takes');
      setStockTakes(res.data.data);
    } catch (err) {
      notify.error('Failed to fetch stock takes');
    }
  };

  const startStockTake = async () => {
    try {
      const res = await api.post('/stock-takes', { notes });
      notify.success('Stock take started');
      setActiveStockTake(res.data);
      setNotes('');
      fetchStockTakes();
    } catch (err) {
      notify.error('Failed to start stock take');
    }
  };

  const updateItemCount = async (itemId, actualQuantity) => {
    if (!activeStockTake) return;
    try {
      await api.put(`/stock-takes/${activeStockTake.id}/items`, {
        items: [{ item_id: itemId, actual_quantity: parseInt(actualQuantity) }]
      });
      // update local state
      setActiveStockTake(prev => ({
        ...prev,
        items: prev.items.map(it => it.item_id === itemId ? { ...it, actual_quantity: parseInt(actualQuantity) } : it)
      }));
    } catch (err) {
      notify.error('Failed to update count');
    }
  };

  const completeStockTake = async () => {
    if (!activeStockTake) return;
    if (!confirm('Are you sure you want to complete this stock take? This will adjust inventory levels.')) return;
    try {
      await api.post(`/stock-takes/${activeStockTake.id}/complete`);
      notify.success('Stock take completed and inventory adjusted');
      setActiveStockTake(null);
      fetchStockTakes();
    } catch (err) {
      notify.error('Failed to complete stock take');
    }
  };

  const viewStockTake = async (id) => {
    try {
      const res = await api.get(`/stock-takes/${id}`);
      setActiveStockTake(res.data);
    } catch (err) {
      notify.error('Failed to load stock take details');
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Stock Take</h1>
          <p className="page-description">Perform physical inventory counts</p>
        </div>
        {(!activeStockTake || activeStockTake.status !== 'draft') && (
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
            <button className="btn btn-primary" onClick={startStockTake}>Start New Stock Take</button>
          </div>
        )}
      </div>

      {activeStockTake ? (
        <div className="card">
          <div className="flex-between mb-2">
            <h3>Stock Take #{activeStockTake.id} <span className={`badge badge-${activeStockTake.status === 'draft' ? 'warning' : 'success'}`}>{activeStockTake.status}</span></h3>
            <div>
              <button className="btn btn-secondary mr-1" onClick={() => setActiveStockTake(null)}>Back to List</button>
              {activeStockTake.status === 'draft' && <button className="btn btn-success" onClick={completeStockTake}>Complete & Adjust Stock</button>}
            </div>
          </div>
          <p className="text-muted mb-2">Started by: {activeStockTake.created_by_name}</p>
          
          <div className="table-container" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Item Name</th><th>Expected Stock</th><th>Actual Count</th>{activeStockTake.status === 'completed' && <th>Variance</th>}</tr></thead>
              <tbody>
                {activeStockTake.items?.map(it => (
                  <tr key={it.item_id}>
                    <td>{it.item_name}</td>
                    <td>{it.expected_quantity}</td>
                    <td>
                      {activeStockTake.status === 'draft' ? (
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: 100 }} 
                          value={it.actual_quantity === null ? '' : it.actual_quantity} 
                          onChange={(e) => updateItemCount(it.item_id, e.target.value)} 
                        />
                      ) : (
                        it.actual_quantity
                      )}
                    </td>
                    {activeStockTake.status === 'completed' && <td>{it.variance}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>ID</th><th>Started By</th><th>Status</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {stockTakes.map(st => (
                <tr key={st.id}>
                  <td>#{st.id}</td>
                  <td>{st.created_by_name}</td>
                  <td><span className={`badge badge-${st.status === 'draft' ? 'warning' : 'success'}`}>{st.status}</span></td>
                  <td>{new Date(st.created_at).toLocaleDateString()}</td>
                  <td>{st.notes || '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-info" onClick={() => viewStockTake(st.id)}>
                      {st.status === 'draft' ? 'Continue' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
              {stockTakes.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No past stock takes found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

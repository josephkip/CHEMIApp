import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { generateReceiptPDF } from '../utils/PDFService';

const fmt = (v) => `KES ${Number(v||0).toLocaleString()}`;

export default function Sales() {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { user } = useAuth();

  const fetchSales = () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search) p.set('search', search);
    if (startDate) p.set('start_date', startDate);
    if (endDate) p.set('end_date', endDate);
    if (statusFilter) p.set('status', statusFilter);
    api.get(`/sales?${p}`).then(r => { setSales(r.data.data||[]); setPagination(r.data.pagination||{}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, [page, statusFilter]);

  const viewDetail = async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    setDetail(data);
    setPaymentMethod(data.payment_method || 'cash');
  };

  const completeSale = async () => {
    if (!detail) return;
    setCompleting(true);
    try {
      await api.put(`/sales/${detail.id}/complete`, { payment_method: paymentMethod });
      // update list
      fetchSales();
      setDetail(null);
    } catch(err) {
      alert('Failed to complete sale');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Sales History</h1><p className="page-description">View all transactions</p></div>

      <div className="filters-bar">
        <input className="form-input" placeholder="Search receipt #..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:220}} />
        <input className="form-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:160}} />
        <input className="form-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{width:160}} />
        <select className="form-input form-select" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPage(1);}} style={{width:150}}>
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={()=>{setPage(1);fetchSales();}}>Filter</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setStartDate('');setEndDate('');setStatusFilter('');setPage(1);setTimeout(fetchSales,0);}}>Clear</button>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-container card" style={{padding:0}}>
          <table className="table">
            <thead><tr><th>Receipt</th><th>Amount</th>{isAdmin && <th>Profit</th>}<th>Status</th><th>Payment</th><th>Cashier</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {sales.length===0 ? <tr><td colSpan={8} className="text-center" style={{padding:40,color:'var(--text-muted)'}}>No sales found</td></tr> :
              sales.map(s => (
                <tr key={s.id}>
                  <td><span className="font-mono" style={{fontSize:'.8rem'}}>{s.receipt_number}</span></td>
                  <td><strong>{fmt(s.total_amount)}</strong></td>
                  {isAdmin && <td className="text-success">{fmt(s.total_profit)}</td>}
                  <td><span className={`badge badge-${s.status === 'pending' ? 'warning' : 'success'}`}>{s.status}</span></td>
                  <td><span className="badge badge-primary">{s.payment_method}</span></td>
                  <td>{s.cashier_name||'—'}</td>
                  <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{new Date(s.created_at).toLocaleString()}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>viewDetail(s.id)}>View</button></td>
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

      {detail && (
        <div className="modal-overlay" onClick={()=>setDetail(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Sale Details</h3>
              <button className="modal-close" onClick={()=>setDetail(null)}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <p><strong>Receipt:</strong> {detail.receipt_number}</p>
              <p><strong>Date:</strong> {new Date(detail.created_at).toLocaleString()}</p>
              <p><strong>Cashier:</strong> {detail.cashier_name}</p>
              <p><strong>Payment:</strong> {detail.payment_method}</p>
              {detail.customer_name && <p><strong>Customer:</strong> {detail.customer_name}</p>}
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {detail.items?.map((it,i) => (
                    <tr key={i}><td>{it.item_name}</td><td>{it.quantity}</td><td>{fmt(it.selling_price)}</td><td>{fmt(it.selling_price*it.quantity)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-between mt-2 font-bold" style={{fontSize:'1.1rem'}}><span>Total:</span><span>{fmt(detail.total_amount)}</span></div>
            {isAdmin && <div className="flex-between text-success" style={{fontSize:'.9rem'}}><span>Profit:</span><span>{fmt(detail.total_profit)}</span></div>}
            
            {detail.status === 'pending' && (user?.role === 'admin' || user?.permissions?.can_receive_payments) ? (
              <div style={{marginTop: 15, padding: 15, background: 'var(--surface-color)', borderRadius: 8}}>
                <h4 style={{marginBottom: 10}}>Receive Payment</h4>
                <div className="form-group">
                  <select className="form-input form-select" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                    <option value="cash">💵 Cash</option><option value="mpesa">📱 M-Pesa</option>
                    <option value="card">💳 Card</option><option value="insurance">🏥 Insurance</option>
                  </select>
                </div>
                <button className="btn btn-success" style={{width:'100%'}} onClick={completeSale} disabled={completing}>
                  {completing ? 'Processing...' : `Mark as Paid (${fmt(detail.total_amount)})`}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary mt-2" style={{width:'100%'}} onClick={()=>generateReceiptPDF(detail)}>📄 Download PDF Receipt</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

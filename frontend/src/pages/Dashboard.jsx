import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v) => `KES ${Number(v||0).toLocaleString('en-KE', {minimumFractionDigits:0})}`;

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      isAdmin ? api.get('/analytics/summary').catch(() => ({data:null})) : Promise.resolve({data:null}),
      isAdmin ? api.get('/analytics/sales-trend?group_by=day').catch(() => ({data:[]})) : Promise.resolve({data:[]}),
      api.get('/sales?limit=5').catch(() => ({data:{data:[]}})),
      api.get('/items/alerts/low-stock').catch(() => ({data:[]})),
    ]).then(([s, t, r, l]) => {
      setSummary(s.data);
      setTrend(t.data || []);
      setRecent(r.data?.data || []);
      setLowStock(l.data || []);
    }).finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your pharmacy operations</p>
        </div>
        <Link to="/sales/new" className="btn btn-primary">+ New Sale</Link>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-1">
          <div className="kpi-icon">💰</div>
          <div className="kpi-value">{fmt(summary?.today?.revenue)}</div>
          <div className="kpi-label">Today's Revenue</div>
        </div>
        {isAdmin && (
          <div className="kpi-card kpi-2">
            <div className="kpi-icon">📈</div>
            <div className="kpi-value">{fmt(summary?.today?.profit)}</div>
            <div className="kpi-label">Today's Profit</div>
          </div>
        )}
        <div className="kpi-card kpi-3">
          <div className="kpi-icon">🛒</div>
          <div className="kpi-value">{summary?.today?.sales || 0}</div>
          <div className="kpi-label">Today's Sales</div>
        </div>
        <div className="kpi-card kpi-4">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-value">{summary?.inventory?.low_stock || lowStock.length}</div>
          <div className="kpi-label">Low Stock Alerts</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Sales Trend Chart */}
        {isAdmin && trend.length > 0 && (
          <div className="card">
            <div className="chart-title">Sales Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{fontSize:11}} stroke="var(--text-muted)" />
                <YAxis tick={{fontSize:11}} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}} />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#gRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex-between mb-2">
            <div className="chart-title" style={{marginBottom:0}}>Low Stock Alerts</div>
            <Link to="/inventory?stock_status=low" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><div>All items well stocked</div></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Item</th><th>Stock</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStock.slice(0,6).map(item => (
                    <tr key={item.id}>
                      <td className="truncate" style={{maxWidth:180}}>{item.name}</td>
                      <td><strong>{item.stock_quantity}</strong> / {item.reorder_level}</td>
                      <td><span className={`badge ${item.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {item.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card mt-3">
        <div className="flex-between mb-2">
          <div className="chart-title" style={{marginBottom:0}}>Recent Sales</div>
          <Link to="/sales" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🛒</div><div>No sales yet today</div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Receipt</th><th>Amount</th>{isAdmin && <th>Profit</th>}<th>Method</th><th>Time</th></tr></thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono">{s.receipt_number}</span></td>
                    <td><strong>{fmt(s.total_amount)}</strong></td>
                    {isAdmin && <td className="text-success">{fmt(s.total_profit)}</td>}
                    <td><span className="badge badge-primary">{s.payment_method}</span></td>
                    <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{new Date(s.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmt = (v) => `KES ${Number(v||0).toLocaleString()}`;
const COLORS = ['#0d9488','#8b5cf6','#3b82f6','#f59e0b','#ef4444','#22c55e','#ec4899','#6366f1'];

export default function Analytics() {
  const { isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [catBreakdown, setCatBreakdown] = useState([]);
  const [groupBy, setGroupBy] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('charts');

  const fetchData = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (startDate) p.set('start_date', startDate);
    if (endDate) p.set('end_date', endDate);
    p.set('group_by', groupBy);

    Promise.all([
      api.get(`/analytics/summary?${p}`),
      api.get(`/analytics/sales-trend?${p}`),
      api.get(`/analytics/top-items?${p}&limit=10`),
      api.get(`/analytics/category-breakdown?${p}`),
    ]).then(([s,t,ti,cb]) => {
      setSummary(s.data); setTrend(t.data||[]);
      setTopItems(ti.data||[]); setCatBreakdown(cb.data||[]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [groupBy]);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Analytics & Reports</h1><p className="page-description">Insights into your pharmacy performance</p></div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-1"><div className="kpi-icon">💰</div><div className="kpi-value">{fmt(summary?.period_totals?.revenue)}</div><div className="kpi-label">Period Revenue</div></div>
        {isAdmin && <div className="kpi-card kpi-2"><div className="kpi-icon">📈</div><div className="kpi-value">{fmt(summary?.period_totals?.profit)}</div><div className="kpi-label">Period Profit</div></div>}
        <div className="kpi-card kpi-3"><div className="kpi-icon">🛒</div><div className="kpi-value">{summary?.period_totals?.sales||0}</div><div className="kpi-label">Total Sales</div></div>
        <div className="kpi-card kpi-4"><div className="kpi-icon">📦</div><div className="kpi-value">{summary?.inventory?.total_items||0}</div><div className="kpi-label">Total Items</div></div>
      </div>

      <div className="filters-bar">
        <input className="form-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:160}} />
        <input className="form-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{width:160}} />
        <select className="form-input form-select" value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={{width:130}}>
          <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={fetchData}>Apply</button>
      </div>

      <div className="tabs">
        <button className={`tab${tab==='charts'?' active':''}`} onClick={()=>setTab('charts')}>📊 Charts</button>
        <button className={`tab${tab==='tables'?' active':''}`} onClick={()=>setTab('tables')}>📋 Tables</button>
      </div>

      {tab === 'charts' ? (
        <div className="grid-2">
          <div className="card">
            <div className="chart-title">Revenue & Profit Trend</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{fontSize:10}} stroke="var(--text-muted)" />
                <YAxis tick={{fontSize:10}} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#gR)" strokeWidth={2} name="Revenue" />
                {isAdmin && <Area type="monotone" dataKey="profit" stroke="#8b5cf6" fill="url(#gP)" strokeWidth={2} name="Profit" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="chart-title">Top Selling Items</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{fontSize:10}} stroke="var(--text-muted)" />
                <YAxis dataKey="item_name" type="category" width={120} tick={{fontSize:10}} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}} />
                <Bar dataKey="total_revenue" fill="#0d9488" radius={[0,4,4,0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="chart-title">Sales Count Trend</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{fontSize:10}} stroke="var(--text-muted)" />
                <YAxis tick={{fontSize:10}} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}} />
                <Line type="monotone" dataKey="sales_count" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="chart-title">Category Breakdown</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={catBreakdown} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {catBreakdown.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div>
          <div className="card mb-3">
            <div className="chart-title">Top Items Report</div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Item</th><th>Qty Sold</th><th>Revenue</th>{isAdmin && <th>Profit</th>}</tr></thead>
                <tbody>
                  {topItems.map((it,i) => (
                    <tr key={i}><td><strong>{it.item_name}</strong></td><td>{it.total_qty}</td><td>{fmt(it.total_revenue)}</td>{isAdmin && <td className="text-success">{fmt(it.total_profit)}</td>}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="chart-title">Category Performance</div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Category</th><th>Qty Sold</th><th>Revenue</th>{isAdmin && <th>Profit</th>}</tr></thead>
                <tbody>
                  {catBreakdown.map((c,i) => (
                    <tr key={i}><td><strong>{c.category||'Uncategorized'}</strong></td><td>{c.total_qty}</td><td>{fmt(c.revenue)}</td>{isAdmin && <td className="text-success">{fmt(c.profit)}</td>}</tr>
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

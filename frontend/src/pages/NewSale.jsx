import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';
import { generateReceiptPDF } from '../utils/PDFService';

const fmt = (v) => `KES ${Number(v||0).toLocaleString()}`;

export default function NewSale() {
  const { isAdmin, user } = useAuth();
  const notify = useNotification();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    api.get('/items?limit=100').then(r => setItems(r.data.data || [])).catch(()=>{});
  }, []);

  const filtered = items.filter(i => i.stock_quantity > 0 &&
    i.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item_id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) { notify.warning('Max stock reached'); return prev; }
        return prev.map(c => c.item_id === item.id ? {...c, quantity: c.quantity + 1} : c);
      }
      return [...prev, { item_id: item.id, name: item.name, selling_price: item.selling_price,
        buying_price: item.buying_price, quantity: 1, max_stock: item.stock_quantity }];
    });
  };

  const updateQty = (itemId, qty) => {
    if (qty <= 0) return removeFromCart(itemId);
    setCart(prev => prev.map(c => c.item_id === itemId ? {...c, quantity: Math.min(qty, c.max_stock)} : c));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(c => c.item_id !== itemId));
  const cartTotal = cart.reduce((s,c) => s + c.selling_price * c.quantity, 0);
  const cartProfit = cart.reduce((s,c) => s + (c.selling_price - c.buying_price) * c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return notify.warning('Cart is empty');
    setLoading(true);
    
    const canReceivePayments = isAdmin || user?.permissions?.can_receive_payments;
    const status = canReceivePayments ? 'completed' : 'pending';

    try {
      const payload = { 
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity, selling_price: c.selling_price })),
        payment_method: payment, 
        customer_name: customer || null,
        status
      };
      const { data } = await api.post('/sales', payload);
      
      if (status === 'completed') {
        setReceipt(data);
        notify.success('Sale completed!');
      } else {
        notify.success('Sale sent to Cashier!');
        setCart([]);
      }
      
      // Refresh items
      api.get('/items?limit=100').then(r => setItems(r.data.data || []));
    } catch (err) { notify.error(err.response?.data?.error || 'Sale failed'); }
    finally { setLoading(false); }
  };

  if (receipt) return (
    <div>
      <div className="page-header flex-between">
        <h1 className="page-title">Sale Complete ✓</h1>
        <button className="btn btn-primary" onClick={()=>setReceipt(null)}>New Sale</button>
      </div>
      <div className="card" style={{maxWidth:400,margin:'0 auto',padding:'24px 16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
        <div style={{
          background: '#fff', color: '#000', borderRadius: 8, padding: '20px 16px',
          fontFamily: 'Courier New, monospace', fontSize: '.85rem', lineHeight: 1.6,
          border: '1px dashed #ccc', margin: '0 auto 20px auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>MORERAN CHEMIST</div>
            <div style={{ fontSize: '.75rem', color: '#666' }}>Health & Wellness Our Priority</div>
            <div style={{ fontSize: '.75rem', color: '#666' }}>Nairobi, Kenya | +254 700 000 000</div>
          </div>

          <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', marginBottom: 8 }}>
            <div><strong>Receipt:</strong> #{receipt.receipt_number}</div>
            <div><strong>Date:</strong> {new Date(receipt.created_at || new Date()).toLocaleString()}</div>
            <div><strong>Cashier:</strong> {user?.full_name || user?.username || '—'}</div>
            {receipt.customer_name && <div><strong>Customer:</strong> {receipt.customer_name}</div>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #999' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((it, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.item_name || it.name}</td>
                  <td style={{ textAlign: 'center', padding: '4px' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>{fmt(it.selling_price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #999', marginTop: 12, paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
              <span>TOTAL:</span><span>{fmt(receipt.total_amount)}</span>
            </div>
            <div style={{ fontSize: '.75rem', color: '#666', marginTop: 4 }}>
              Payment: {receipt.payment_method?.toUpperCase()}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: '.75rem', color: '#888', fontStyle: 'italic' }}>
            Thank you for shopping with us!<br />Quick Recovery!
          </div>
        </div>

        <button className="btn btn-primary" style={{width:'100%', marginBottom: 8}} onClick={()=>generateReceiptPDF(receipt)}>
          🖨 Print PDF Receipt
        </button>
        <button className="btn btn-ghost" style={{width:'100%'}} onClick={()=>setReceipt(null)}>
          ← Back to New Sale
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h1 className="page-title">New Sale</h1><p className="page-description">Point of Sale</p></div>
      <div className="pos-layout">
        <div className="pos-items">
          <input ref={searchRef} className="form-input mb-2" placeholder="🔍 Search items..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
          <div className="pos-item-grid">
            {filtered.map(item => (
              <div key={item.id} className="pos-item-card" onClick={()=>addToCart(item)}>
                <div style={{fontWeight:600,fontSize:'.9rem',marginBottom:4}}>{item.name}</div>
                <div style={{color:'var(--primary)',fontWeight:700}}>{fmt(item.selling_price)}</div>
                <div style={{fontSize:'.75rem',color:'var(--text-muted)',marginTop:4}}>Stock: {item.stock_quantity} {item.unit}</div>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty-state" style={{gridColumn:'1/-1'}}><div>No items found</div></div>}
          </div>
        </div>
        <div className="pos-cart">
          <div className="pos-cart-header">🛒 Cart ({cart.length} items)</div>
          <div className="pos-cart-items">
            {cart.length === 0 ? <div className="empty-state" style={{padding:30}}><div>Cart is empty</div></div> :
            cart.map(c => (
              <div key={c.item_id} className="pos-cart-item">
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:'.85rem'}}>{c.name}</div>
                  <div style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{fmt(c.selling_price)} each</div>
                </div>
                <div className="flex-gap">
                  <button className="btn-icon" style={{width:28,height:28,fontSize:'.8rem'}} onClick={()=>updateQty(c.item_id,c.quantity-1)}>−</button>
                  <span style={{fontWeight:700,minWidth:20,textAlign:'center'}}>{c.quantity}</span>
                  <button className="btn-icon" style={{width:28,height:28,fontSize:'.8rem'}} onClick={()=>updateQty(c.item_id,c.quantity+1)}>+</button>
                  <button className="btn-icon" style={{width:28,height:28,fontSize:'.8rem',color:'var(--danger)'}} onClick={()=>removeFromCart(c.item_id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="pos-cart-total">
            <div className="flex-between mb-2"><span>Subtotal</span><span className="font-bold" style={{fontSize:'1.2rem'}}>{fmt(cartTotal)}</span></div>
            <div className="form-group">
              <select className="form-input form-select" value={payment} onChange={e=>setPayment(e.target.value)}>
                <option value="cash">💵 Cash</option><option value="mpesa">📱 M-Pesa</option>
                <option value="card">💳 Card</option><option value="insurance">🏥 Insurance</option>
              </select>
            </div>
            <input className="form-input mb-2" placeholder="Customer name (optional)" value={customer} onChange={e=>setCustomer(e.target.value)} />
            <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={handleCheckout} disabled={loading || cart.length===0}>
              {loading ? 'Processing...' : (isAdmin || user?.permissions?.can_receive_payments ? `Checkout ${fmt(cartTotal)}` : `Send to Cashier ${fmt(cartTotal)}`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

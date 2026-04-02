import React, { useState, useEffect, createContext, useContext } from 'react';

const API = 'http://localhost:8000';
const AuthContext = createContext(null);

// ─── API helpers ─────────────────────────────────────────────
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
};

// ─── Auth Provider ────────────────────────────────────────────
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API}/auth/login`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    // Decode role from token payload
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    const userData = { email: payload.sub, role: payload.role };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  nav: { background: '#1a1a2e', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { color: '#e94560', fontSize: 22, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 },
  navLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  navBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: '6px 12px', borderRadius: 6, transition: 'background 0.2s' },
  navBtnActive: { background: '#e94560', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, padding: '6px 16px', borderRadius: 6 },
  page: { minHeight: '100vh', background: '#16213e', color: '#eee', fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 },
  card: { background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a4e', transition: 'transform 0.2s' },
  cardBody: { padding: '1rem' },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#fff' },
  cardPrice: { color: '#e94560', fontWeight: 700, fontSize: 18, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#aaa', marginBottom: 12, lineHeight: 1.5 },
  btn: { background: '#e94560', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnOutline: { background: 'transparent', color: '#e94560', border: '1px solid #e94560', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  input: { width: '100%', padding: '10px 12px', background: '#0f3460', border: '1px solid #2a2a4e', borderRadius: 8, color: '#eee', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' },
  formBox: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: 12, padding: '2rem', maxWidth: 420, margin: '4rem auto' },
  h2: { color: '#e94560', marginBottom: '1.5rem', textAlign: 'center' },
  badge: { background: '#e94560', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, marginLeft: 4 },
  tag: { background: '#0f3460', color: '#7eb3e8', fontSize: 12, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 16, padding: '1rem', background: '#1a1a2e', borderRadius: 10, marginBottom: 12, border: '1px solid #2a2a4e' },
  orderRow: { background: '#1a1a2e', borderRadius: 10, padding: '1rem', marginBottom: 12, border: '1px solid #2a2a4e' },
  statusBadge: (s) => ({ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s === 'delivered' ? '#1a4a2e' : s === 'pending' ? '#3a2a0e' : '#0e2a3a', color: s === 'delivered' ? '#4ade80' : s === 'pending' ? '#fbbf24' : '#60a5fa' }),
};

// ─── Navbar ───────────────────────────────────────────────────
function Navbar({ page, setPage, cartCount }) {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav style={styles.nav}>
      <span style={styles.navBrand} onClick={() => setPage('home')}>🛒 ShopEase</span>
      <div style={styles.navLinks}>
        <button style={styles.navBtn} onClick={() => setPage('home')}>Products</button>
        {user && <button style={styles.navBtn} onClick={() => setPage('cart')}>Cart <span style={styles.badge}>{cartCount}</span></button>}
        {user && <button style={styles.navBtn} onClick={() => setPage('orders')}>My Orders</button>}
        {user?.role === 'admin' && <button style={styles.navBtn} onClick={() => setPage('admin')}>Admin</button>}
        {user ? (
          <button style={styles.navBtnActive} onClick={() => { logout(); setPage('home'); }}>Logout</button>
        ) : (
          <button style={styles.navBtnActive} onClick={() => setPage('login')}>Login</button>
        )}
      </div>
    </nav>
  );
}

// ─── Product Card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const { user } = useContext(AuthContext);
  return (
    <div style={styles.card}>
      <div style={{ height: 160, background: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
      </div>
      <div style={styles.cardBody}>
        {product.category && <span style={styles.tag}>{product.category.name}</span>}
        <div style={styles.cardTitle}>{product.name}</div>
        <div style={styles.cardDesc}>{product.description?.slice(0, 80)}...</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={styles.cardPrice}>₹{product.price.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: product.stock > 0 ? '#4ade80' : '#f87171' }}>{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
        </div>
        {user && product.stock > 0 && (
          <button style={{ ...styles.btn, width: '100%', marginTop: 8 }} onClick={() => onAddToCart(product.id)}>Add to Cart</button>
        )}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────
function HomePage({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch('/categories').then(setCategories).catch(() => {});
    fetchProducts();
  }, [selectedCat]);

  const fetchProducts = () => {
    const url = selectedCat ? `/products?category_id=${selectedCat}` : '/products';
    apiFetch(url).then(setProducts).catch(() => {});
  };

  const handleAdd = async (pid) => {
    try {
      await onAddToCart(pid);
      setMsg('Added to cart!');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg(e.message); setTimeout(() => setMsg(''), 3000); }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: '#e94560', marginBottom: '1rem' }}>Featured Products</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button style={selectedCat === null ? styles.btn : styles.btnOutline} onClick={() => setSelectedCat(null)}>All</button>
        {categories.map(c => (
          <button key={c.id} style={selectedCat === c.id ? styles.btn : styles.btnOutline} onClick={() => setSelectedCat(c.id)}>{c.name}</button>
        ))}
      </div>
      {msg && <div style={{ background: '#1a4a2e', color: '#4ade80', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>{msg}</div>}
      {products.length === 0
        ? <div style={{ color: '#888', textAlign: 'center', marginTop: 80 }}>No products found. Seed the database or add via Admin panel.</div>
        : <div style={styles.grid}>{products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />)}</div>
      }
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────
function CartPage({ cart, setCart, setPage }) {
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState('');
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const removeItem = async (id) => {
    await apiFetch(`/cart/${id}`, { method: 'DELETE' });
    setCart(cart.filter(i => i.id !== id));
  };

  const placeOrder = async () => {
    if (!address) return setMsg('Enter a shipping address');
    try {
      await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ shipping_address: address, payment_id: 'test_pay_' + Date.now() }) });
      setCart([]);
      setMsg('Order placed! 🎉');
      setTimeout(() => setPage('orders'), 1500);
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#e94560' }}>Shopping Cart</h2>
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>
          <div style={{ fontSize: 64 }}>🛒</div>
          <p>Your cart is empty</p>
          <button style={styles.btn} onClick={() => setPage('home')}>Browse Products</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            {cart.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <div style={{ fontSize: 32 }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                  <div style={{ color: '#e94560', fontWeight: 700 }}>₹{(item.product.price * item.quantity).toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>₹{item.product.price} × {item.quantity}</div>
                </div>
                <button style={{ ...styles.btnOutline, fontSize: 12 }} onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div>
            <div style={{ ...styles.card, padding: '1.5rem' }}>
              <h3 style={{ color: '#e94560', marginTop: 0 }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#aaa' }}>
                <span>Items ({cart.length})</span><span>₹{total.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid #2a2a4e', paddingTop: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                  <span>Total</span><span style={{ color: '#e94560' }}>₹{total.toLocaleString()}</span>
                </div>
              </div>
              <textarea
                placeholder="Shipping address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ ...styles.input, height: 80, resize: 'vertical' }}
              />
              {msg && <div style={{ color: msg.includes('!') ? '#4ade80' : '#f87171', marginBottom: 8, fontSize: 13 }}>{msg}</div>}
              <button style={{ ...styles.btn, width: '100%' }} onClick={placeOrder}>Place Order (Test Pay)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders Page ──────────────────────────────────────────────
function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { apiFetch('/orders').then(setOrders).catch(() => {}); }, []);

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#e94560' }}>My Orders</h2>
      {orders.length === 0 ? <div style={{ color: '#888' }}>No orders yet.</div> : orders.map(order => (
        <div key={order.id} style={styles.orderRow}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Order #{order.id}</span>
            <span style={styles.statusBadge(order.status)}>{order.status.toUpperCase()}</span>
          </div>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>{new Date(order.created_at).toLocaleDateString()}</div>
          {order.items.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#ccc', marginBottom: 4 }}>
              <span>{i.product.name} × {i.quantity}</span>
              <span>₹{(i.price_at_purchase * i.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #2a2a4e', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span><span style={{ color: '#e94560' }}>₹{order.total_amount.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────
function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image_url: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch('/products').then(setProducts).catch(() => {});
    apiFetch('/admin/orders').then(setOrders).catch(() => {});
  }, []);

  const addProduct = async () => {
    try {
      const p = await apiFetch('/products', { method: 'POST', body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) }) });
      setProducts([...products, p]);
      setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
      setMsg('Product added!');
    } catch (e) { setMsg(e.message); }
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteProduct = async (id) => {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStatus = async (orderId, status) => {
    await apiFetch(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#e94560' }}>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        {['products', 'orders'].map(t => (
          <button key={t} style={tab === t ? styles.btn : styles.btnOutline} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === 'products' && (
        <>
          <div style={{ ...styles.card, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#e94560', marginTop: 0 }}>Add Product</h3>
            {['name', 'description', 'price', 'stock', 'image_url'].map(f => (
              <input key={f} style={styles.input} placeholder={f.replace('_', ' ').toUpperCase()} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
            ))}
            {msg && <div style={{ color: '#4ade80', marginBottom: 8 }}>{msg}</div>}
            <button style={styles.btn} onClick={addProduct}>Add Product</button>
          </div>
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={{ ...styles.card, ...styles.cardBody }}>
                <div style={styles.cardTitle}>{p.name}</div>
                <div style={{ color: '#e94560', fontWeight: 700 }}>₹{p.price} · Stock: {p.stock}</div>
                <button style={{ ...styles.btnOutline, marginTop: 8, fontSize: 12 }} onClick={() => deleteProduct(p.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'orders' && orders.map(order => (
        <div key={order.id} style={styles.orderRow}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Order #{order.id} — ₹{order.total_amount}</span>
            <select
              value={order.status}
              onChange={e => updateStatus(order.id, e.target.value)}
              style={{ background: '#0f3460', color: '#eee', border: '1px solid #2a2a4e', borderRadius: 6, padding: '4px 8px' }}
            >
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{order.shipping_address}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Login / Register ─────────────────────────────────────────
function AuthPage({ setPage }) {
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      setPage('home');
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#16213e', display: 'flex', alignItems: 'center' }}>
      <div style={styles.formBox}>
        <h2 style={styles.h2}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        {mode === 'register' && <input style={styles.input} placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
        <input style={styles.input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={styles.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {error && <div style={{ color: '#f87171', marginBottom: 12, fontSize: 13 }}>{error}</div>}
        <button style={{ ...styles.btn, width: '100%' }} onClick={submit}>{mode === 'login' ? 'Login' : 'Register'}</button>
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 16 }}>
          {mode === 'login' ? 'No account? ' : 'Have account? '}
          <span style={{ color: '#e94560', cursor: 'pointer' }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [cart, setCart] = useState([]);
  const { user } = useContext(AuthContext) || {};

  useEffect(() => {
    if (user) apiFetch('/cart').then(setCart).catch(() => {});
    else setCart([]);
  }, [user]);

  const addToCart = async (productId) => {
    if (!user) { setPage('login'); throw new Error('Please login first'); }
    const item = await apiFetch('/cart', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1 }) });
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing ? prev.map(i => i.id === item.id ? item : i) : [...prev, item];
    });
  };

  const renderPage = () => {
    if (!user && (page === 'cart' || page === 'orders' || page === 'admin')) return <AuthPage setPage={setPage} />;
    switch (page) {
      case 'home': return <HomePage onAddToCart={addToCart} />;
      case 'cart': return <CartPage cart={cart} setCart={setCart} setPage={setPage} />;
      case 'orders': return <OrdersPage />;
      case 'admin': return <AdminPage />;
      case 'login': return <AuthPage setPage={setPage} />;
      default: return <HomePage onAddToCart={addToCart} />;
    }
  };

  return (
    <div style={styles.page}>
      <Navbar page={page} setPage={setPage} cartCount={cart.length} />
      {renderPage()}
    </div>
  );
}

// Wrap with AuthProvider in index.js:
export { AuthProvider };

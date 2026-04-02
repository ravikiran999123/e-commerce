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

// ─── Global Styles ────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #f5f6fa;
      color: #1a1d23;
      -webkit-font-smoothing: antialiased;
    }

    input, textarea, select, button {
      font-family: inherit;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #c5c9d6; border-radius: 3px; }

    .fade-in {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-hover {
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .card-hover:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,0.10);
      transform: translateY(-2px);
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s;
      letter-spacing: 0.01em;
    }
    .btn-primary:hover { background: #1d4ed8; }

    .btn-outline {
      background: transparent;
      color: #2563eb;
      border: 1.5px solid #2563eb;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s, color 0.18s;
    }
    .btn-outline:hover { background: #eff6ff; }

    .btn-ghost {
      background: transparent;
      color: #64748b;
      border: none;
      padding: 8px 14px;
      border-radius: 7px;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .btn-ghost:hover { background: #f1f5f9; color: #1a1d23; }
    .btn-ghost.active { color: #2563eb; font-weight: 500; }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #1a1d23;
      background: #fff;
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      margin-bottom: 12px;
    }
    .form-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
    }
    .form-input::placeholder { color: #94a3b8; }

    .tag-pill {
      background: #eff6ff;
      color: #2563eb;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.02em;
    }

    .status-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .status-delivered { background: #dcfce7; color: #16a34a; }
    .status-pending   { background: #fef9c3; color: #ca8a04; }
    .status-confirmed { background: #dbeafe; color: #1d4ed8; }
    .status-shipped   { background: #e0f2fe; color: #0369a1; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 14px;
      color: #475569;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-weight: 400;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }
    .sidebar-link:hover { background: #f1f5f9; color: #1a1d23; }
    .sidebar-link.active { background: #eff6ff; color: #2563eb; font-weight: 500; }
  `}</style>
);

// ─── Navbar ───────────────────────────────────────────────────
function Navbar({ page, setPage, cartCount }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e8ecf0',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Brand */}
      <div
        onClick={() => setPage('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32, background: '#2563eb', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>🛒</div>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#1a1d23', letterSpacing: '-0.01em' }}>
          ShopEase
        </span>
      </div>

      {/* Center nav */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button className={`btn-ghost ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
          Home
        </button>
        <button className="btn-ghost" onClick={() => setPage('home')}>Products</button>
        {user && (
          <button className={`btn-ghost ${page === 'cart' ? 'active' : ''}`} onClick={() => setPage('cart')}>
            Cart
            {cartCount > 0 && (
              <span style={{
                marginLeft: 6, background: '#2563eb', color: '#fff',
                borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600,
              }}>{cartCount}</span>
            )}
          </button>
        )}
        {user && (
          <button className={`btn-ghost ${page === 'orders' ? 'active' : ''}`} onClick={() => setPage('orders')}>
            My Orders
          </button>
        )}
        {user?.role === 'admin' && (
          <button className={`btn-ghost ${page === 'admin' ? 'active' : ''}`} onClick={() => setPage('admin')}>
            Admin
          </button>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {user ? (
          <>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#2563eb',
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <button className="btn-ghost" onClick={() => { logout(); setPage('home'); }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => setPage('login')}>Sign in</button>
            <button className="btn-primary" onClick={() => setPage('login')}>Get started</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Product Card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const { user } = useContext(AuthContext);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await onAddToCart(product.id);
    setTimeout(() => setAdding(false), 800);
  };

  return (
    <div className="card-hover" style={{
      background: '#fff',
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid #e8ecf0',
    }}>
      {/* Image area */}
      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 52, opacity: 0.7 }}>📦</span>
        }
        {product.stock === 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#fee2e2', color: '#dc2626',
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          }}>Out of stock</div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#fef9c3', color: '#ca8a04',
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          }}>Only {product.stock} left</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {product.category && (
          <span className="tag-pill">{product.category.name}</span>
        )}
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1d23', margin: '8px 0 4px', lineHeight: 1.3 }}>
          {product.name}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
          {product.description?.slice(0, 72)}...
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: user && product.stock > 0 ? 12 : 0 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1d23' }}>
            ₹{product.price.toLocaleString()}
          </span>
          {product.stock > 5 && (
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>In stock</span>
          )}
        </div>
        {user && product.stock > 0 && (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '9px 0' }}
            onClick={handleAdd}
          >
            {adding ? 'Added ✓' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────
function HeroBanner({ setPage }) {
  return (
    <div style={{
      background: 'linear-gradient(120deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)',
      borderRadius: 16,
      padding: '2.5rem 3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', right: 80, bottom: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          New Arrivals
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
          Best Deals on<br />Latest Products
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 20 }}>
          Discover top picks at unbeatable prices
        </p>
        <button
          className="btn-primary"
          style={{ background: '#fff', color: '#1d4ed8', fontWeight: 600, padding: '10px 24px' }}
          onClick={() => setPage('home')}
        >
          Shop Now →
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
        {['🎧', '⌚', '📱'].map((icon, i) => (
          <div key={i} style={{
            width: 80, height: 80,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────
function HomePage({ onAddToCart, setPage }) {
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
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
      <HeroBanner setPage={setPage} />

      {/* Category filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a1d23' }}>Featured Products</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn-ghost ${selectedCat === null ? 'active' : ''}`}
            onClick={() => setSelectedCat(null)}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`btn-ghost ${selectedCat === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(c.id)}
            >{c.name}</button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{
          background: '#dcfce7', color: '#15803d', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500,
        }}>{msg}</div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16 }}>No products found. Add some via the Admin panel.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />)}
        </div>
      )}
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
    if (!address) return setMsg('Please enter a shipping address');
    try {
      await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ shipping_address: address, payment_id: 'test_pay_' + Date.now() }) });
      setCart([]);
      setMsg('Order placed successfully! 🎉');
      setTimeout(() => setPage('orders'), 1500);
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>Shopping Cart</h2>

      {cart.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e8ecf0',
          textAlign: 'center', padding: '80px 0',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1d23', marginBottom: 8 }}>Your cart is empty</div>
          <div style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Add some products to get started</div>
          <button className="btn-primary" onClick={() => setPage('home')}>Browse Products</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Cart items */}
          <div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px',
                padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
                fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <span>Items</span><span>Price</span><span>Qty</span><span style={{ textAlign: 'center' }}>Save</span>
              </div>

              {cart.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: idx < cart.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, background: '#f8faff', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      border: '1px solid #e8ecf0', flexShrink: 0,
                    }}>📦</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1d23' }}>{item.product.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>In stock</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>₹{item.product.price.toLocaleString()}</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.quantity}</div>
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: '#fee2e2', color: '#dc2626', border: 'none',
                        borderRadius: 7, width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                      }}
                    >×</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <div style={{ marginTop: 16 }}>
              <button className="btn-ghost" onClick={() => setPage('home')}>
                ← Continue Shopping
              </button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Order Summary</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}>
                <span>Subtotal ({cart.length} items)</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}>
                <span>Shipping</span>
                <span style={{ color: '#16a34a' }}>Free</span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 17, marginBottom: 20 }}>
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <textarea
                className="form-input"
                placeholder="Shipping address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ height: 80, resize: 'vertical', marginBottom: 12 }}
              />

              {msg && (
                <div style={{
                  color: msg.includes('!') ? '#15803d' : '#dc2626',
                  background: msg.includes('!') ? '#dcfce7' : '#fee2e2',
                  padding: '8px 12px', borderRadius: 7, fontSize: 13, marginBottom: 12,
                }}>{msg}</div>
              )}

              <button className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 15 }} onClick={placeOrder}>
                Place Order
              </button>

              <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
                🔒 Secure checkout
              </div>
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
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>My Orders</h2>

      {orders.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60, background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0' }}>
          No orders yet.
        </div>
      ) : orders.map(order => (
        <div key={order.id} style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0',
          marginBottom: 16, overflow: 'hidden',
        }}>
          {/* Order header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
            background: '#fafbfc',
          }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Order #{order.id}</span>
              <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 12 }}>
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <span className={`status-badge status-${order.status}`}>{order.status}</span>
          </div>

          {/* Items */}
          <div style={{ padding: '14px 20px' }}>
            {order.items.map(i => (
              <div key={i.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 14, color: '#475569', marginBottom: 6,
              }}>
                <span>{i.product.name} <span style={{ color: '#94a3b8' }}>× {i.quantity}</span></span>
                <span style={{ fontWeight: 500, color: '#1a1d23' }}>₹{(i.price_at_purchase * i.quantity).toLocaleString()}</span>
              </div>
            ))}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid #f1f5f9', marginTop: 10, paddingTop: 10,
            }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>{order.shipping_address}</span>
              <span style={{ fontWeight: 600, fontSize: 16 }}>₹{order.total_amount.toLocaleString()}</span>
            </div>
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

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: '📦' },
    { label: 'Revenue', value: `₹${orders.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString()}`, icon: '💰' },
    { label: 'Products', value: products.length, icon: '🏷️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }} className="fade-in">
      {/* Sidebar */}
      <div style={{
        width: 220, background: '#1e293b', padding: '1.5rem 1rem',
        display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      }}>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px', marginBottom: 8 }}>
          Dashboard
        </div>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'products', label: 'Products', icon: '🏷️' },
          { id: 'orders', label: 'Orders', icon: '📦' },
        ].map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${tab === item.id ? 'active' : ''}`}
            style={{ color: tab === item.id ? '#60a5fa' : '#94a3b8', background: tab === item.id ? 'rgba(96,165,250,0.1)' : 'transparent' }}
            onClick={() => setTab(item.id)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem', background: '#f5f6fa', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#1a1d23' }}>
          {tab === 'overview' ? 'Overview' : tab === 'products' ? 'Products' : 'Orders'}
        </h2>

        {/* Stats row - always visible */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 12, padding: '18px 20px',
              border: '1px solid #e8ecf0',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1d23', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <>
            {/* Add product form */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', padding: '1.5rem', marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add New Product</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['name', 'image_url', 'description', 'price', 'stock'].map(f => (
                  <input
                    key={f}
                    className="form-input"
                    style={{ gridColumn: f === 'description' || f === 'image_url' ? '1 / -1' : 'auto', marginBottom: 0 }}
                    placeholder={f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                    value={form[f]}
                    onChange={e => setForm({ ...form, [f]: e.target.value })}
                  />
                ))}
              </div>
              {msg && <div style={{ color: '#15803d', background: '#dcfce7', padding: '8px 12px', borderRadius: 7, fontSize: 13, marginTop: 12 }}>{msg}</div>}
              <button className="btn-primary" style={{ marginTop: 14 }} onClick={addProduct}>Add Product</button>
            </div>

            {/* Products table */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px',
                padding: '11px 20px', borderBottom: '1px solid #f1f5f9',
                fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <span>Product</span><span>Price</span><span>Stock</span><span>Action</span>
              </div>
              {products.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px',
                  alignItems: 'center', padding: '13px 20px',
                  borderBottom: idx < products.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1d23' }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>₹{p.price?.toLocaleString()}</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>{p.stock}</span>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none',
                      borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
                    }}
                  >Delete</button>
                </div>
              ))}
              {products.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No products yet</div>
              )}
            </div>
          </>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 140px',
              padding: '11px 20px', borderBottom: '1px solid #f1f5f9',
              fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>Order #</span><span>Amount</span><span>Address</span><span>Status</span>
            </div>
            {orders.map((order, idx) => (
              <div key={order.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 140px',
                alignItems: 'center', padding: '13px 20px',
                borderBottom: idx < orders.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>#{order.id}</span>
                <span style={{ fontSize: 14, color: '#475569' }}>₹{order.total_amount}</span>
                <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {order.shipping_address}
                </span>
                <select
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  style={{
                    background: '#f8fafc', color: '#1a1d23', border: '1px solid #e2e8f0',
                    borderRadius: 7, padding: '5px 8px', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
            {orders.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No orders yet</div>
            )}
          </div>
        )}

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Use the sidebar to manage Products and Orders.
          </div>
        )}
      </div>
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
    <div style={{
      minHeight: 'calc(100vh - 60px)', background: '#f5f6fa',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Two-panel layout: Login + Signup side by side (like reference) */}
      <div style={{ width: '100%', maxWidth: 640 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, textAlign: 'center', marginBottom: 8 }}>
          Welcome to ShopEase
        </h2>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
          Sign in to your account or create a new one
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Login */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: mode === 'login' ? '2px solid #2563eb' : '1px solid #e8ecf0',
            padding: '1.8rem', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }} onClick={() => setMode('login')}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: mode === 'login' ? '#2563eb' : '#1a1d23' }}>
              Login
            </h3>
            {mode === 'login' ? (
              <>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Email Address</div>
                <input className="form-input" placeholder="john@example.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Password</div>
                <input className="form-input" placeholder="••••••••" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {error && mode === 'login' && (
                  <div style={{ color: '#dc2626', background: '#fee2e2', padding: '7px 10px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>{error}</div>
                )}
                <button className="btn-primary" style={{ width: '100%' }} onClick={submit}>Sign In</button>
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Click to sign into your account</div>
            )}
          </div>

          {/* Register */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: mode === 'register' ? '2px solid #2563eb' : '1px solid #e8ecf0',
            padding: '1.8rem', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }} onClick={() => setMode('register')}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: mode === 'register' ? '#2563eb' : '#1a1d23' }}>
              Sign Up
            </h3>
            {mode === 'register' ? (
              <>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Full Name</div>
                <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Email</div>
                <input className="form-input" placeholder="john@example.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Password</div>
                <input className="form-input" placeholder="••••••••" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {error && mode === 'register' && (
                  <div style={{ color: '#dc2626', background: '#fee2e2', padding: '7px 10px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>{error}</div>
                )}
                <button className="btn-primary" style={{ width: '100%' }} onClick={submit}>Create Account</button>
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Click to create a new account</div>
            )}
          </div>
        </div>
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
      case 'home':   return <HomePage onAddToCart={addToCart} setPage={setPage} />;
      case 'cart':   return <CartPage cart={cart} setCart={setCart} setPage={setPage} />;
      case 'orders': return <OrdersPage />;
      case 'admin':  return <AdminPage />;
      case 'login':  return <AuthPage setPage={setPage} />;
      default:       return <HomePage onAddToCart={addToCart} setPage={setPage} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
        <Navbar page={page} setPage={setPage} cartCount={cart.length} />
        {renderPage()}
      </div>
    </>
  );
}

export { AuthProvider };

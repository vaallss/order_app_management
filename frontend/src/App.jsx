import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Banknote, Check, ChefHat, ChevronDown,
  CircleUserRound, Clock3, Coffee, CreditCard, FileText, Filter,
  Minus, Package, Plus, Printer, Search, ShoppingBag,
  ShoppingCart, Soup, Trash2, Utensils, Wallet, X, LogOut,
} from 'lucide-react';
import api from './services/api';

const seedProducts = [
  { id: 1, name: 'Nasi Goreng Kampung', category: 'Makanan Utama', price: 28000, stock: 18, description: 'Nasi goreng dengan terasi, telur, ayam suwir, dan kerupuk.', emoji: '🍛', color: 'peach' },
  { id: 2, name: 'Ayam Bakar Madu', category: 'Makanan Utama', price: 35000, stock: 12, description: 'Ayam bakar bumbu rempah dengan olesan madu, disajikan dengan nasi.', emoji: '🍗', color: 'yellow' },
  { id: 3, name: 'Soto Ayam Lamongan', category: 'Makanan Utama', price: 30000, stock: 9, description: 'Soto ayam hangat dengan koya, soun, dan telur.', emoji: '🍜', color: 'cream' },
  { id: 4, name: 'Sate Ayam Madura', category: 'Makanan Utama', price: 32000, stock: 15, description: 'Sepuluh tusuk sate ayam dengan bumbu kacang khas Madura.', emoji: '🍢', color: 'pink' },
  { id: 5, name: 'Pisang Goreng', category: 'Appetizer', price: 18000, stock: 20, description: 'Pisang pilihan berbalut adonan renyah, disajikan hangat.', emoji: '🍌', color: 'yellow' },
  { id: 6, name: 'Tahu Walik', category: 'Appetizer', price: 16000, stock: 14, description: 'Tahu aci goreng dengan sambal kecap segar.', emoji: '🥟', color: 'cream' },
  { id: 7, name: 'Es Teh Kampung', category: 'Minuman', price: 8000, stock: 30, description: 'Teh melati segar, tersedia dingin atau hangat.', emoji: '🧋', color: 'mint' },
  { id: 8, name: 'Es Jeruk Peras', category: 'Minuman', price: 12000, stock: 22, description: 'Jeruk peras segar dengan pilihan gula normal atau sedikit.', emoji: '🍊', color: 'peach' },
  { id: 9, name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 18000, stock: 16, description: 'Espresso, susu segar, dan gula aren lokal.', emoji: '☕', color: 'pink' },
];

const categories = ['Semua Menu', 'Makanan Utama', 'Appetizer', 'Minuman'];
const orderStages = ['Pending Confirmation', 'Diproses', 'Siap Disajikan', 'Selesai'];
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const readStore = (key, fallback) => {
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch { return fallback; }
};
const orderId = () => `INA-${String(Date.now()).slice(-6)}`;
const apiMode = import.meta.env.VITE_DATA_SOURCE === 'api';
const responseData = (response) => response.data?.data ?? response.data;
const fetchCustomerOrder = (id) => {
  const cachedOrders = readStore(apiMode ? 'ina-customer-order-cache' : 'ina-orders', []);
  const order = cachedOrders.find((item) => item.id === id);
  return api.get(`/orders/${id}`, { params: { phone: order?.phone } });
};

function IconButton({ label, onClick, children, className = '' }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`icon-button ${className}`}>{children}</button>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><h2>{title}</h2><IconButton label="Tutup" onClick={onClose}><X size={20} /></IconButton></header>
      {children}
    </section>
  </div>;
}

function LoginModal({ error, onClose, onSubmit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({ username, password });
    setSubmitting(false);
  }
  return <Modal title="Login staf" onClose={onClose}><form className="login-form" onSubmit={handleSubmit}><span className="login-icon"><CircleUserRound size={23} /></span><p>Masuk dulu dengan akun staf untuk membuka halaman operasional.</p><label>Username<input type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username akun" /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password akun" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full-button" disabled={submitting}>{submitting ? 'Memeriksa akun…' : 'Masuk'} <ArrowRight size={16} /></button><small className="login-footnote">Akun dibuat oleh administrator, bukan lewat pendaftaran publik.</small></form></Modal>;
}

function App() {
  const [products, setProducts] = useState(() => readStore('ina-products', seedProducts));
  const [orders, setOrders] = useState(() => readStore(apiMode ? 'ina-customer-order-cache' : 'ina-orders', []));
  const [customerOrderCache, setCustomerOrderCache] = useState(() => readStore('ina-customer-order-cache', []));
  const [customerOrderIds, setCustomerOrderIds] = useState(() => apiMode
    ? readStore('ina-customer-order-cache', []).map((order) => order.id)
    : readStore('ina-customer-orders', []));
  const [cart, setCart] = useState(() => readStore('ina-cart', []));
  const [view, setView] = useState('customer');
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ina-user') || 'null'); } catch { return null; }
  });
  const [loginTarget, setLoginTarget] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [category, setCategory] = useState('Semua Menu');
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [adminPeriod, setAdminPeriod] = useState('Minggu ini');
  const [productModal, setProductModal] = useState(null);
  const [toast, setToast] = useState('');
  const [billToPrint, setBillToPrint] = useState(null);

  useEffect(() => { localStorage.setItem('ina-products', JSON.stringify(products)); }, [products]);
  useEffect(() => {
    if (!apiMode) localStorage.setItem('ina-orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => { localStorage.setItem('ina-customer-order-cache', JSON.stringify(customerOrderCache)); }, [customerOrderCache]);
  useEffect(() => { localStorage.setItem('ina-customer-orders', JSON.stringify(customerOrderIds)); }, [customerOrderIds]);
  useEffect(() => { localStorage.setItem('ina-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (apiMode) {
      api.get('/products').then((response) => setProducts(responseData(response))).catch(() => setToast('API belum tersambung; memakai data contoh.'));
      if (view === 'customer') {
        customerOrderIds.forEach((id) => fetchCustomerOrder(id).then((response) => {
          const updated = responseData(response);
          setOrders((items) => [updated, ...items.filter((item) => item.id !== updated.id)]);
          setCustomerOrderCache((items) => [updated, ...items.filter((item) => item.id !== updated.id)].slice(0, 50));
        }).catch(() => {}));
      } else {
        api.get('/orders').then((response) => setOrders(responseData(response))).catch(() => {});
      }
    }
  }, [view, customerOrderIds]);
  useEffect(() => {
    if (!apiMode || !sessionStorage.getItem('ina-token')) return;
    api.get('/auth/me').then((response) => {
      const currentUser = responseData(response).user;
      setAuthUser(currentUser);
      sessionStorage.setItem('ina-user', JSON.stringify(currentUser));
      setView(currentUser.role === 'admin' ? 'admin' : 'staff');
    }).catch(() => {
      sessionStorage.removeItem('ina-token');
      sessionStorage.removeItem('ina-user');
      setAuthUser(null);
    });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const clearPrintSelection = () => setBillToPrint(null);
    window.addEventListener('afterprint', clearPrintSelection);
    return () => window.removeEventListener('afterprint', clearPrintSelection);
  }, []);
  useEffect(() => {
    if (!apiMode || view !== 'customer' || !customerOrderIds.length) return undefined;
    const refresh = () => customerOrderIds.forEach((id) => fetchCustomerOrder(id).then((response) => {
      const updated = responseData(response);
      setOrders((items) => [updated, ...items.filter((item) => item.id !== updated.id)]);
      setCustomerOrderCache((items) => [updated, ...items.filter((item) => item.id !== updated.id)].slice(0, 50));
    }).catch(() => {}));
    const timer = setInterval(refresh, 12000);
    return () => clearInterval(timer);
  }, [view, customerOrderIds]);

  const filteredProducts = useMemo(() => products.filter((product) =>
    (category === 'Semua Menu' || product.category === category)
    && `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const activeOrders = orders.filter((order) => order.status !== 'Selesai');
  const reportOrders = useMemo(() => {
    const now = new Date();
    const start = adminPeriod === 'Minggu ini'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
      : new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return orders.filter((order) => new Date(order.createdAt) >= start);
  }, [orders, adminPeriod]);

  function updateCart(product, delta) {
    if (delta > 0 && product.stock <= 0) return setToast('Stok menu sedang habis.');
    setCart((items) => {
      const current = items.find((item) => item.id === product.id);
      if (!current && delta > 0) return [...items, { ...product, quantity: 1, note: '' }];
      return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + delta) } : item).filter((item) => item.quantity > 0);
    });
  }
  function updateNote(id, note) { setCart((items) => items.map((item) => item.id === id ? { ...item, note } : item)); }
  async function login(credentials) {
    try {
      const result = responseData(await api.post('/auth/login', credentials));
      sessionStorage.setItem('ina-token', result.token);
      sessionStorage.setItem('ina-user', JSON.stringify(result.user));
      setAuthUser(result.user);
      setLoginTarget(null);
      setView(result.user.role === 'admin' ? 'admin' : 'staff');
      setToast(`Login berhasil. Hai, ${result.user.name}.`);
    } catch (error) {
      setLoginError(error.response?.data?.errors?.username?.[0] || error.response?.data?.message || 'Login gagal. Periksa koneksi API dan akunmu.');
    }
  }
  async function logout() {
    try { if (apiMode) await api.post('/auth/logout'); } catch { /* Clear the local session even if the API is offline. */ }
    sessionStorage.removeItem('ina-token');
    sessionStorage.removeItem('ina-user');
    setAuthUser(null);
    setView('customer');
    setToast('Kamu sudah logout.');
  }
  async function submitOrder(form) {
    if (!cart.length) return;
    const order = { id: orderId(), createdAt: new Date().toISOString(), customer: form.name, phone: form.phone, service: form.service, table: form.service === 'Dine-in' ? form.table : 'Takeaway', payment: form.payment, paymentStatus: form.payment === 'Tunai / Bayar di Kasir' ? 'Belum dibayar' : 'Menunggu verifikasi', items: cart.map(({ id, name, price, quantity, note }) => ({ id, name, price, quantity, note })), subtotal, tax, total, status: 'Pending Confirmation' };
    let savedOrder = order;
    if (apiMode) {
      try {
        const response = await api.post('/orders', order);
        savedOrder = responseData(response);
        setOrders((items) => [savedOrder, ...items]);
        setCustomerOrderCache((items) => [savedOrder, ...items.filter((item) => item.id !== savedOrder.id)].slice(0, 50));
        const productsResponse = await api.get('/products');
        setProducts(responseData(productsResponse));
      } catch { setToast('Pesanan gagal tersimpan ke API. Coba lagi.'); return; }
    } else {
      setOrders((items) => [order, ...items]);
      setProducts((items) => items.map((product) => { const ordered = cart.find((item) => item.id === product.id); return ordered ? { ...product, stock: Math.max(0, product.stock - ordered.quantity) } : product; }));
    }
    setCustomerOrderIds((ids) => [savedOrder.id, ...ids.filter((id) => id !== savedOrder.id)]);
    setCart([]); setCheckoutOpen(false); setCartOpen(false); setTracking(savedOrder.id); setToast('Pesanan berhasil dikirim ke dapur.');
  }
  async function advanceOrder(id, status) {
    if (apiMode) { try { await api.patch(`/orders/${id}`, { status }); } catch { setToast('Status gagal diperbarui ke API.'); return; } }
    setOrders((items) => items.map((order) => order.id === id ? { ...order, status } : order));
  }
  async function recordPayment(orderIdValue, cashReceived) {
    const order = orders.find((item) => item.id === orderIdValue);
    if (!order) return;
    if (cashReceived < order.total) return setToast('Nominal pembayaran masih kurang.');
    if (apiMode) { try { await api.post(`/orders/${orderIdValue}/payment`, { cashReceived: Number(cashReceived) }); } catch { setToast('Pembayaran gagal disimpan ke API.'); return; } }
    setOrders((items) => items.map((item) => item.id === orderIdValue ? { ...item, paymentStatus: 'Lunas', cashReceived: Number(cashReceived), change: Number(cashReceived) - item.total } : item));
    setToast(`Pembayaran lunas · kembalian ${rupiah(cashReceived - order.total)}`);
  }
  async function saveProduct(product) {
    if (apiMode) {
      try {
        const response = product.id ? await api.put(`/products/${product.id}`, product) : await api.post('/products', product);
        const saved = responseData(response);
        setProducts((items) => product.id ? items.map((item) => item.id === product.id ? saved : item) : [saved, ...items]);
        setProductModal(null); setToast('Produk berhasil disimpan.'); return;
      } catch { setToast('Produk gagal disimpan ke API.'); return; }
    }
    if (product.id) setProducts((items) => items.map((item) => item.id === product.id ? product : item));
    else setProducts((items) => [{ ...product, id: Date.now(), emoji: '🍽️', color: 'cream' }, ...items]);
    setProductModal(null); setToast('Produk berhasil disimpan.');
  }
  async function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    if (window.confirm(`Hapus ${product?.name} dari katalog?`)) {
      if (apiMode) { try { await api.delete(`/products/${id}`); } catch { setToast('Produk gagal dihapus dari API.'); return; } }
      setProducts((items) => items.filter((item) => item.id !== id)); setToast('Produk dihapus.');
    }
  }
  function deleteOrderFromHistory(id) {
    if (!window.confirm('Hapus invoice ini dari riwayat di perangkat ini? Data pesanan restoran tetap tersimpan.')) return;
    setCustomerOrderIds((ids) => ids.filter((orderIdValue) => orderIdValue !== id));
    setCustomerOrderCache((items) => items.filter((order) => order.id !== id));
    setToast('Invoice dihapus dari riwayat perangkat ini.');
  }
  function exportReport() {
    const rows = [['ID Pesanan', 'Tanggal', 'Pelanggan', 'Metode', 'Pembayaran', 'Total'], ...reportOrders.map((order) => [order.id, new Date(order.createdAt).toLocaleString('id-ID'), order.customer, order.payment, order.paymentStatus, order.total])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'laporan-penjualan.csv'; link.click(); URL.revokeObjectURL(link.href);
  }

  const trackedOrder = orders.find((order) => order.id === tracking);
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => { if (authUser?.role === 'kasir') { event.preventDefault(); return; } setView('customer'); }}><span className="brand-mark"><Utensils size={19} /></span><span><b>Dapur Ina Aina</b><small>Rasa rumahan, selalu hangat</small></span></a>
      <div className="topbar-actions">
        {authUser?.role !== 'kasir' && <div className="store-actions"><button className="orders-link" onClick={() => { setView('customer'); setOrdersOpen(true); }} aria-label="Riwayat pesanan"><FileText size={17} /><span>Pesanan</span>{customerOrderIds.length > 0 && <b>{customerOrderIds.length}</b>}</button><button className="top-cart" onClick={() => setCartOpen(true)} aria-label="Keranjang"><ShoppingBag size={17} /><span>Keranjang</span>{cart.length > 0 && <b>{cart.reduce((sum, item) => sum + item.quantity, 0)}</b>}</button></div>}
        <div className={`account-actions ${authUser ? 'is-authenticated' : ''}`}>
          <button className={`auth-user ${authUser ? 'account-profile' : 'auth-login'}`} onClick={() => authUser ? setView(authUser.role === 'admin' ? 'admin' : 'staff') : (setLoginTarget('staff'), setLoginError(''))} aria-label={authUser ? 'Buka halaman akun' : 'Login staf'} title={authUser ? 'Buka halaman akun' : 'Login staf'}><span className="account-avatar"><CircleUserRound size={18} /></span>{authUser ? <span className="account-copy"><b>{authUser.name}</b><small>{authUser.role === 'admin' ? 'Administrator' : 'Kasir'}</small></span> : <span className="account-copy"><b>Masuk</b><small>Akun staf</small></span>}</button>
          {authUser && <button className="header-logout" onClick={logout}><LogOut size={16} /><span>Keluar</span></button>}
        </div>
      </div>
    </header>

    {view === 'customer' && <main className="customer-page" id="home">
      <section className="hero-banner"><div className="hero-copy"><span className="eyebrow"><span className="live-dot" /> BUKA HARI INI · 10.00–22.00</span><h1>Masakan hangat,<br /><em>rasa dekat rumah.</em></h1><p>Pesan favoritmu dengan mudah. Kami siapkan segar khusus untukmu.</p><a href="#menu" className="button button-dark">Jelajahi menu <ArrowRight size={17} /></a><div className="hero-perks"><span><Check size={15} /> Dibuat setelah dipesan</span><span><Check size={15} /> Bahan segar setiap hari</span></div></div><div className="hero-art"><div className="hero-plate">🍲</div><span className="floating-note note-top">♡ Dibuat dengan cinta</span><span className="floating-note note-bottom">Menu favorit keluarga</span><span className="hero-sparkle">✳</span></div></section>
      <div className="section-heading" id="menu"><div><span className="eyebrow muted">DARI DAPUR KAMI</span><h2>Menu pilihan</h2><p>Semua yang enak, dibuat segar untukmu.</p></div><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari menu..." /></label></div>
      <div className="category-row">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'category-chip active' : 'category-chip'}>{item === 'Makanan Utama' ? <Soup size={16} /> : item === 'Minuman' ? <Coffee size={16} /> : <Utensils size={16} />}{item}</button>)}</div>
      <div className="product-grid">{filteredProducts.map((product) => { const item = cart.find((entry) => entry.id === product.id); return <article className={`product-card ${product.stock < 1 ? 'sold-out' : ''}`} key={product.id}><div className={`product-art ${product.color || 'cream'}`}><span className="product-emoji">{product.emoji || '🍽️'}</span><span className={`stock-badge ${product.stock ? '' : 'empty'}`}>{product.stock ? `Tersedia · ${product.stock}` : 'Habis'}</span></div><div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><strong>{rupiah(product.price)}</strong>{item ? <div className="stepper"><button onClick={() => updateCart(product, -1)} aria-label="Kurangi"><Minus size={15} /></button><b>{item.quantity}</b><button onClick={() => updateCart(product, 1)} disabled={item.quantity >= product.stock} aria-label="Tambah"><Plus size={15} /></button></div> : <button className="add-button" disabled={!product.stock} onClick={() => updateCart(product, 1)}><Plus size={16} /> Tambah</button>}</div></div></article>; })}</div>
      {filteredProducts.length === 0 && <div className="empty-state"><Search size={26} /><h3>Menu tidak ditemukan</h3><p>Coba kata kunci atau kategori lain.</p></div>}
      <footer className="site-footer"><div className="brand"><span className="brand-mark"><Utensils size={18} /></span><span><b>Dapur Ina Aina</b><small>Masakan yang selalu dirindukan.</small></span></div><span>© 2026 Dapur Ina Aina</span><button onClick={() => setCartOpen(true)}>Lihat keranjang <ArrowRight size={15} /></button></footer>
    </main>}

    {view === 'staff' && <main className="dashboard-page"><div className="page-title-row"><div><span className="eyebrow muted">OPERASIONAL RESTORAN</span><h1>Pesanan masuk</h1><p>Pantau pesanan dan perbarui progres dari dapur.</p></div><span className="live-status"><i /> Sinkronisasi lokal aktif</span></div><div className="metric-row"><Metric label="Perlu konfirmasi" value={orders.filter((order) => order.status === orderStages[0]).length} icon={<Clock3 />} /><Metric label="Sedang disiapkan" value={orders.filter((order) => order.status === orderStages[1]).length} icon={<ChefHat />} /><Metric label="Siap disajikan" value={orders.filter((order) => order.status === orderStages[2]).length} icon={<Check />} /><Metric label="Belum dibayar" value={orders.filter((order) => order.paymentStatus !== 'Lunas').length} icon={<Wallet />} /></div><div className="order-list">{activeOrders.length === 0 ? <div className="empty-state large"><ShoppingBag size={29} /><h3>Belum ada pesanan</h3><p>Pesanan pelanggan akan muncul di sini setelah checkout.</p></div> : activeOrders.map((order) => <StaffOrder key={order.id} order={order} printing={billToPrint === order.id} onAdvance={advanceOrder} onPaid={recordPayment} onBill={(id) => { setBillToPrint(id); setTimeout(() => window.print(), 120); }} />)}</div>{orders.some((order) => order.status === 'Selesai') && <section className="completed-orders"><h2>Pesanan selesai <span>{orders.filter((order) => order.status === 'Selesai').length}</span></h2><p>Semua pesanan yang selesai tetap tersimpan di riwayat transaksi.</p></section>}</main>}

    {view === 'admin' && <main className="dashboard-page"><div className="page-title-row"><div><span className="eyebrow muted">PANEL ADMINISTRATOR</span><h1>Ringkasan restoran</h1><p>Kelola katalog, stok, dan laporan penjualan.</p></div><div className="admin-actions"><button className="button button-dark" onClick={() => setProductModal({})}><Plus size={17} /> Tambah produk</button></div></div><div className="metric-row"><Metric label="Total produk" value={products.length} icon={<Package />} /><Metric label="Stok menipis" value={products.filter((item) => item.stock > 0 && item.stock < 5).length} icon={<Filter />} /><Metric label="Pesanan hari ini" value={orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()).length} icon={<ShoppingBag />} /><Metric label="Penjualan tercatat" value={rupiah(orders.reduce((sum, order) => sum + order.total, 0))} icon={<Banknote />} compact /></div><div className="admin-columns"><section className="panel inventory-panel"><div className="panel-heading"><div><h2>Produk & stok</h2><p>Perubahan stok mengikuti jumlah pesanan.</p></div><span className="table-count">{products.length} produk</span></div><div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><span className="mini-product">{product.emoji || '🍽️'}</span><b>{product.name}</b></td><td>{product.category}</td><td>{rupiah(product.price)}</td><td><span className={`stock-number ${product.stock < 5 ? 'low' : ''}`}>{product.stock} pcs</span></td><td><div className="row-actions"><IconButton label="Edit produk" onClick={() => setProductModal({ ...product })}><FileText size={16} /></IconButton><IconButton label="Hapus produk" onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></IconButton></div></td></tr>)}</tbody></table></div></section><section className="panel report-panel"><div className="panel-heading"><div><h2>Laporan penjualan</h2><p>Rekap metode pembayaran.</p></div><button className="icon-button" title="Unduh CSV" onClick={exportReport}><ArrowDownToLine size={17} /></button></div><label className="select-wrap"><Filter size={15} /><select value={adminPeriod} onChange={(event) => setAdminPeriod(event.target.value)}><option>Minggu ini</option><option>Bulan ini</option></select><ChevronDown size={15} /></label><div className="report-total"><small>{adminPeriod}</small><strong>{rupiah(reportOrders.reduce((sum, order) => sum + order.total, 0))}</strong><span>{reportOrders.length} transaksi tercatat</span></div><PaymentBar orders={reportOrders} /></section></div></main>}

    {cartOpen && <CartDrawer cart={cart} subtotal={subtotal} tax={tax} total={total} onClose={() => setCartOpen(false)} onQuantity={updateCart} onNote={updateNote} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
    {ordersOpen && <CustomerOrdersModal orders={orders.filter((order) => customerOrderIds.includes(order.id))} onClose={() => setOrdersOpen(false)} onView={(id) => { setOrdersOpen(false); setTracking(id); }} onDelete={deleteOrderFromHistory} />}
    {checkoutOpen && <CheckoutModal cart={cart} subtotal={subtotal} tax={tax} total={total} onClose={() => setCheckoutOpen(false)} onSubmit={submitOrder} />}
    {loginTarget && <LoginModal error={loginError} onClose={() => setLoginTarget(null)} onSubmit={login} />}
    {productModal && <ProductModal product={productModal} onClose={() => setProductModal(null)} onSave={saveProduct} />}
    {trackedOrder && <Modal title="Pesanan berhasil dibuat" onClose={() => setTracking(null)} wide><div className="tracking-content"><div className="tracking-confirm"><span><Check size={24} /></span><div><b>Pesanan {trackedOrder.id}</b><small>Terima kasih, {trackedOrder.customer}. Pesananmu sudah diterima.</small></div></div><div className="tracking-steps">{orderStages.map((stage, index) => { const current = orderStages.indexOf(trackedOrder.status); return <div className={`tracking-step ${index <= current ? 'done' : ''}`} key={stage}><span>{index < current ? <Check size={15} /> : index + 1}</span><small>{stage}</small></div>; })}</div><Bill order={trackedOrder} /><button className="button button-dark full-button" onClick={() => setTracking(null)}>Kembali ke menu</button></div></Modal>}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </div>;
}

function Metric({ label, value, icon, compact = false }) { return <article className="metric-card"><span className="metric-icon">{icon}</span><div><small>{label}</small><strong className={compact ? 'compact-value' : ''}>{value}</strong></div></article>; }

function StaffOrder({ order, onAdvance, onPaid, onBill, printing }) {
  const [cash, setCash] = useState(String(order.total));
  const next = orderStages[Math.min(orderStages.indexOf(order.status) + 1, orderStages.length - 1)];
  const unpaid = order.paymentStatus !== 'Lunas';
  return <article className={`panel staff-order ${printing ? 'printing-order' : ''}`}><div className="order-main"><div className="order-heading"><div><span className="order-id">{order.id}</span><span className={`status-pill status-${orderStages.indexOf(order.status)}`}>{order.status}</span></div><small>{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><div className="order-customer"><CircleUserRound size={17} /><b>{order.customer}</b><span>{order.phone}</span><span className="service-pill">{order.service === 'Dine-in' ? `Meja ${order.table}` : order.service}</span></div><div className="order-items">{order.items.map((item) => <div key={item.id}><span><b>{item.quantity}×</b> {item.name}{item.note && <small>Catatan: {item.note}</small>}</span><strong>{rupiah(item.price * item.quantity)}</strong></div>)}</div><div className="order-total"><span>Total termasuk PB1 10%</span><b>{rupiah(order.total)}</b></div><Bill order={order} /></div><aside className="order-side"><div className="payment-state"><span>Pembayaran</span><b className={order.paymentStatus === 'Lunas' ? 'paid' : ''}>{order.paymentStatus}</b><small>{order.payment}</small></div>{order.payment === 'Tunai / Bayar di Kasir' && unpaid && <form className="cash-form" onSubmit={(event) => { event.preventDefault(); onPaid(order.id, Number(cash)); }}><label>Uang diterima<input type="number" min={order.total} value={cash} onChange={(event) => setCash(event.target.value)} /></label><button className="button button-outline" type="submit"><Banknote size={16} /> Konfirmasi bayar</button></form>}{order.payment !== 'Tunai / Bayar di Kasir' && unpaid && <button className="button button-outline" onClick={() => onPaid(order.id, order.total)}><CreditCard size={16} /> Verifikasi pembayaran</button>}{order.paymentStatus === 'Lunas' && order.change > 0 && <small>Kembalian {rupiah(order.change)}</small>}<div className="order-buttons"><button className="button button-outline" onClick={() => onBill(order.id)}><Printer size={16} /> Cetak billing</button><button className="button button-dark" disabled={unpaid} onClick={() => onAdvance(order.id, next)}>{unpaid ? 'Konfirmasi bayar dulu' : next === 'Selesai' ? 'Tandai selesai' : `Ke: ${next}`} <ArrowRight size={16} /></button></div></aside></article>;
}

function PaymentBar({ orders, onExport }) {
  const cash = orders.filter((order) => order.payment === 'Tunai / Bayar di Kasir').reduce((sum, order) => sum + order.total, 0);
  const digital = orders.filter((order) => order.payment !== 'Tunai / Bayar di Kasir').reduce((sum, order) => sum + order.total, 0);
  const sum = cash + digital;
  return <div className="payment-breakdown"><div className="payment-bar"><i style={{ width: `${sum ? cash / sum * 100 : 0}%` }} /></div><div><span><i className="legend-dot cash" />Tunai / kasir</span><b>{rupiah(cash)}</b></div><div><span><i className="legend-dot digital" />Non-tunai</span><b>{rupiah(digital)}</b></div><button className="export-button" onClick={onExport}><ArrowDownToLine size={15} /> Unduh laporan CSV</button></div>;
}

function Bill({ order }) { return <div className="bill-box"><div className="bill-top"><span><FileText size={17} /> Ringkasan tagihan</span><b>{order.paymentStatus}</b></div>{order.items.map((item) => <div className="bill-line" key={item.id}><span>{item.quantity}× {item.name}</span><span>{rupiah(item.price * item.quantity)}</span></div>)}<div className="bill-line"><span>Subtotal</span><span>{rupiah(order.subtotal)}</span></div><div className="bill-line"><span>PB1 (10%)</span><span>{rupiah(order.tax)}</span></div><div className="bill-line bill-grand"><b>Total</b><b>{rupiah(order.total)}</b></div></div>; }

function CustomerOrdersModal({ orders, onClose, onView, onDelete }) {
  return <Modal title="Pesanan saya" onClose={onClose} wide><div className="customer-orders-list">{orders.length === 0 ? <div className="empty-state"><ShoppingBag size={28} /><h3>Belum ada pesanan</h3><p>Invoice dan progres pesananmu akan tersimpan di sini.</p></div> : [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => <article className="customer-order-card" key={order.id}><div className="customer-order-top"><div><b>{order.id}</b><small>{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><span className={`status-pill status-${orderStages.indexOf(order.status)}`}>{order.status}</span></div><div className="customer-order-summary"><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item · {order.service === 'Dine-in' ? `Meja ${order.table}` : 'Takeaway'}</span><b>{rupiah(order.total)}</b></div><div className="customer-order-track">{orderStages.map((stage, index) => <span key={stage} className={index <= orderStages.indexOf(order.status) ? 'done' : ''} title={stage} />)}</div><div className="customer-order-actions"><button className="button button-outline" onClick={() => onView(order.id)}><FileText size={15} /> Lihat invoice & progres <ArrowRight size={15} /></button><button className="button button-outline customer-delete" onClick={() => onDelete(order.id)}><Trash2 size={15} /> Hapus</button></div></article>)}</div></Modal>;
}

function CartDrawer({ cart, subtotal, tax, total, onClose, onQuantity, onNote, onCheckout }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="cart-drawer"><div className="drawer-heading"><div><span className="eyebrow muted">PESANANMU</span><h2>Keranjang</h2></div><IconButton label="Tutup" onClick={onClose}><X size={20} /></IconButton></div>{cart.length === 0 ? <div className="empty-state drawer-empty"><ShoppingCart size={27} /><h3>Keranjang masih kosong</h3><p>Yuk pilih menu favoritmu.</p><button className="button button-outline" onClick={onClose}>Lihat menu</button></div> : <><div className="cart-lines">{cart.map((item) => <div className="cart-item" key={item.id}><span className={`cart-emoji ${item.color}`}>{item.emoji}</span><div className="cart-item-detail"><b>{item.name}</b><small>{rupiah(item.price)}</small><input aria-label={`Catatan ${item.name}`} placeholder="Tambah catatan (opsional)" value={item.note} onChange={(event) => onNote(item.id, event.target.value)} /></div><div className="stepper"><button onClick={() => onQuantity(item, -1)} aria-label="Kurangi"><Minus size={14} /></button><b>{item.quantity}</b><button onClick={() => onQuantity(item, 1)} disabled={item.quantity >= item.stock} aria-label="Tambah"><Plus size={14} /></button></div></div>)}</div><div className="drawer-summary"><div><span>Subtotal</span><b>{rupiah(subtotal)}</b></div><div><span>PB1 (10%)</span><b>{rupiah(tax)}</b></div><div className="summary-total"><span>Total</span><strong>{rupiah(total)}</strong></div><button className="button button-dark full-button" onClick={onCheckout}>Lanjut checkout <ArrowRight size={17} /></button><small className="secure-note">Pajak PB1 sebesar 10% dihitung otomatis.</small></div></>}</aside></div>;
}

function CheckoutModal({ cart, subtotal, tax, total, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', service: 'Dine-in', table: '', payment: 'Tunai / Bayar di Kasir' });
  const [error, setError] = useState('');
  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  return <Modal title="Selesaikan pesanan" onClose={onClose} wide><form className="checkout-grid" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim() || !form.phone.trim() || (form.service === 'Dine-in' && !form.table.trim())) return setError('Lengkapi nama, nomor telepon, dan nomor meja.'); setError(''); onSubmit(form); }}><div className="checkout-fields"><div className="checkout-section-title"><span>01</span><div><b>Data pemesan</b><small>Supaya pesanan sampai ke orang yang tepat.</small></div></div><label>Nama lengkap<input autoFocus value={form.name} onChange={(event) => change('name', event.target.value)} placeholder="Nama kamu" /></label><label>Nomor telepon<input type="tel" value={form.phone} onChange={(event) => change('phone', event.target.value)} placeholder="08xxxxxxxxxx" /></label><div className="checkout-section-title spaced"><span>02</span><div><b>Cara menikmati</b><small>Pilih makan di tempat atau dibawa pulang.</small></div></div><div className="choice-row"><button type="button" className={form.service === 'Dine-in' ? 'choice-card chosen' : 'choice-card'} onClick={() => change('service', 'Dine-in')}><Utensils size={19} /><b>Makan di sini</b><small>Dine-in</small></button><button type="button" className={form.service === 'Takeaway' ? 'choice-card chosen' : 'choice-card'} onClick={() => change('service', 'Takeaway')}><ShoppingBag size={19} /><b>Dibawa pulang</b><small>Takeaway</small></button></div>{form.service === 'Dine-in' && <label>Nomor meja<input value={form.table} onChange={(event) => change('table', event.target.value)} placeholder="Contoh: 05" /></label>}<div className="checkout-section-title spaced"><span>03</span><div><b>Metode pembayaran</b><small>Pembayaran non-tunai menunggu verifikasi.</small></div></div><div className="payment-choices"><button type="button" className={form.payment === 'Tunai / Bayar di Kasir' ? 'payment-choice chosen' : 'payment-choice'} onClick={() => change('payment', 'Tunai / Bayar di Kasir')}><Banknote size={18} /><span><b>Tunai di kasir</b><small>Bayar saat pesanan selesai.</small></span>{form.payment === 'Tunai / Bayar di Kasir' && <Check size={17} />}</button><button type="button" className={form.payment !== 'Tunai / Bayar di Kasir' ? 'payment-choice chosen' : 'payment-choice'} onClick={() => change('payment', 'QRIS / E-Wallet / Debit')}><CreditCard size={18} /><span><b>QRIS / E-Wallet / Kartu</b><small>Pembayaran digital.</small></span>{form.payment !== 'Tunai / Bayar di Kasir' && <Check size={17} />}</button></div>{error && <p className="form-error">{error}</p>}</div><aside className="checkout-summary"><span className="eyebrow muted">PESANANMU</span><h3>{cart.reduce((sum, item) => sum + item.quantity, 0)} item pilihan</h3><div className="checkout-items">{cart.map((item) => <div key={item.id}><span>{item.quantity}× {item.name}</span><b>{rupiah(item.price * item.quantity)}</b></div>)}</div><div className="drawer-summary"><div><span>Subtotal</span><b>{rupiah(subtotal)}</b></div><div><span>PB1 (10%)</span><b>{rupiah(tax)}</b></div><div className="summary-total"><span>Total tagihan</span><strong>{rupiah(total)}</strong></div><button className="button button-dark full-button" type="submit">Buat pesanan <ArrowRight size={16} /></button><small className="secure-note">Pesanan diteruskan ke dapur setelah dikirim.</small></div></aside></form></Modal>;
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({ name: product.name || '', category: product.category || 'Makanan Utama', price: product.price || '', stock: product.stock ?? '', description: product.description || '' });
  return <Modal title={product.id ? 'Edit produk' : 'Tambah produk'} onClose={onClose}><form className="product-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...product, ...form, price: Number(form.price), stock: Number(form.stock) }); }}><label>Nama produk<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Makanan Utama</option><option>Appetizer</option><option>Minuman</option></select></label><div className="form-pair"><label>Harga (Rp)<input type="number" min="0" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Stok<input type="number" min="0" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label></div><label>Deskripsi<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="button button-dark full-button" type="submit"><Check size={17} /> Simpan produk</button></form></Modal>;
}

export default App;

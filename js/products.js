/* ============================================================
   MEDISUPPLY — PRODUCTS MODULE
   - Renderizado de grid con stock badges
   - Filtros: categoría, búsqueda, precio, disponibilidad
   - Modal de detalle con control de cantidad limitado a stock
   ============================================================ */

const Products = (() => {
  let allProducts    = [];
  let activeCategory = 'all';
  let searchQuery    = '';
  let minPrice       = null;
  let maxPrice       = null;
  let availFilter    = 'all'; // 'all' | 'instock' | 'outofstock'
  let sortOrder      = 'default'; // 'default' | 'price-asc' | 'price-desc'

  const CATEGORY_TITLES = {
    all:          'Todos los Productos',
    diagnostico:  'Equipo de Diagnóstico',
    medicamentos: 'Medicamentos y Fármacos',
    curaciones:   'Material de Curaciones',
    proteccion:   'Equipo de Protección Personal (EPP)',
    laboratorio:  'Material de Laboratorio',
    hospitalario: 'Equipo Hospitalario',
  };

  // ── Filtering ────────────────────────────────────────────
  function getFiltered() {
    const filtered = allProducts.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (CATEGORY_INFO[p.category]?.name || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      if (minPrice !== null && p.price < minPrice) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      if (availFilter === 'instock'    && p.stock <= 0) return false;
      if (availFilter === 'outofstock' && p.stock > 0)  return false;
      return true;
    });

    if (sortOrder === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }

  // ── Stock badge ──────────────────────────────────────────
  function stockBadge(stock) {
    if (stock <= 0)  return `<span class="stock-badge oos">🚫 Agotado</span>`;
    if (stock <= 5)  return `<span class="stock-badge low">⚠️ Pocas unidades (${stock})</span>`;
    if (stock <= 15) return `<span class="stock-badge mid">📦 En stock (${stock})</span>`;
    return              `<span class="stock-badge ok">✅ En stock (${stock})</span>`;
  }

  // ── Filter tags ──────────────────────────────────────────
  function updateFilterUI() {
    const tagsEl   = document.getElementById('active-filter-tags');
    const clearBtn = document.getElementById('btn-clear-filters');
    if (!tagsEl) return;

    const tags = [];
    if (minPrice !== null) tags.push({ label: `Precio ≥ $${minPrice}`, key: 'minPrice' });
    if (maxPrice !== null) tags.push({ label: `Precio ≤ $${maxPrice}`, key: 'maxPrice' });
    if (availFilter === 'instock')    tags.push({ label: 'Solo en stock',  key: 'avail' });
    if (availFilter === 'outofstock') tags.push({ label: 'Solo agotados',  key: 'avail' });
    if (sortOrder === 'price-asc')    tags.push({ label: 'Precio: menor a mayor', key: 'sort' });
    if (sortOrder === 'price-desc')   tags.push({ label: 'Precio: mayor a menor', key: 'sort' });

    tagsEl.innerHTML = tags.map(t =>
      `<span class="filter-tag">${t.label} <button onclick="Products.clearFilter('${t.key}')" aria-label="Quitar filtro">✕</button></span>`
    ).join('');
    if (clearBtn) clearBtn.hidden = tags.length === 0;
  }

  function clearFilter(key) {
    if (key === 'minPrice') { minPrice = null; const el = document.getElementById('filter-min-price'); if (el) el.value = ''; }
    if (key === 'maxPrice') { maxPrice = null; const el = document.getElementById('filter-max-price'); if (el) el.value = ''; }
    if (key === 'avail')    { availFilter = 'all'; document.querySelectorAll('.avail-btn').forEach(b => b.classList.toggle('active', b.dataset.avail === 'all')); }
    if (key === 'sort')     { sortOrder = 'default'; const el = document.getElementById('filter-sort'); if (el) el.value = 'default'; }
    renderGrid();
  }

  function clearAllFilters() {
    minPrice = maxPrice = null;
    availFilter = 'all';
    sortOrder = 'default';
    const minEl = document.getElementById('filter-min-price');
    const maxEl = document.getElementById('filter-max-price');
    const sortEl = document.getElementById('filter-sort');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    if (sortEl) sortEl.value = 'default';
    document.querySelectorAll('.avail-btn').forEach(b => b.classList.toggle('active', b.dataset.avail === 'all'));
    renderGrid();
  }

  // ── Render grid ──────────────────────────────────────────
  function renderGrid() {
    const grid     = document.getElementById('products-grid');
    const countEl  = document.getElementById('products-count');
    const titleEl  = document.getElementById('section-title');
    const emptyEl  = document.getElementById('empty-state');
    if (!grid) return;

    const filtered = getFiltered();
    updateFilterUI();

    if (titleEl) {
      const catTitle = CATEGORY_TITLES[activeCategory] || CATEGORY_INFO[activeCategory]?.name || 'Productos';
      titleEl.textContent = searchQuery ? `Resultados para "${searchQuery}"` : catTitle;
    }
    if (countEl) countEl.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyEl?.removeAttribute('hidden');
      return;
    }
    emptyEl?.setAttribute('hidden', '');

    grid.innerHTML = filtered.map((p, idx) => {
      const cat   = CATEGORY_INFO[p.category] || { name: p.category, icon: '📦', color: '#0A84FF' };
      const color = cat.color;
      const oos   = p.stock <= 0;
      const delay = Math.min(idx * 0.04, 0.5);

      return `
        <article
          class="product-card${oos ? ' out-of-stock' : ''}"
          style="--cat-color:${color};animation-delay:${delay}s"
          id="product-${p.id}"
          tabindex="0" role="button"
          aria-label="Ver detalle de ${p.name}"
          onclick="Products.openDetail('${p.id}')"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();Products.openDetail('${p.id}')}"
        >
          <div class="product-image-wrapper">
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy"
              onerror="this.src='https://placehold.co/400x400/${color.slice(1)}/FFFFFF?text=${encodeURIComponent(cat.icon)}'">
            <div class="product-category-badge" style="color:${color}">${cat.icon} ${cat.name}</div>
            ${oos
              ? '<div class="oos-overlay">Agotado</div>'
              : `<button class="product-quick-add" onclick="event.stopPropagation();Products.quickAdd('${p.id}')" aria-label="Agregar al carrito" title="Agregar al carrito">+</button>`}
          </div>

          <div class="product-body">
            <h3 class="product-name">${p.name}</h3>
            <span class="product-id" style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.5rem;font-family:monospace;">ID: ${p.id}</span>
            <p class="product-description">${p.description}</p>
          </div>

          <div class="product-stock-row">${stockBadge(p.stock)}</div>

          <div class="product-footer">
            <div class="product-price"><span class="currency">$</span>${p.price.toFixed(2)}</div>
            <button
              class="btn-add-to-cart${oos ? ' disabled-btn' : ''}"
              onclick="event.stopPropagation();Products.quickAdd('${p.id}')"
              id="add-btn-${p.id}"
              ${oos ? 'disabled aria-disabled="true"' : ''}
            >${oos ? '🚫 Agotado' : '🛒 Agregar'}</button>
          </div>
        </article>
      `;
    }).join('');
  }

  // ── Quick add ────────────────────────────────────────────
  function quickAdd(productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;
    if (p.stock <= 0) { showToast('🚫 Este producto está agotado', 'error'); return; }
    Cart.add(p, 1);
  }

  // ── Product detail modal ─────────────────────────────────
  function openDetail(productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;

    const cat   = CATEGORY_INFO[p.category] || { name: p.category, icon: '📦', color: '#0A84FF' };
    const color = cat.color;
    const oos   = p.stock <= 0;
    let   qty   = 1;

    const modal   = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    if (!modal || !content) return;

    const stockInfo = oos
      ? `<div class="product-modal-stock is-out"><span class="stock-dot out"></span><span style="color:var(--danger)">Producto agotado — sin existencias</span></div>`
      : p.stock <= 5
        ? `<div class="product-modal-stock"><span class="stock-dot low"></span><span style="color:#F59E0B">⚠️ Solo quedan ${p.stock} unidades — Entrega en 24 h</span></div>`
        : `<div class="product-modal-stock"><span class="stock-dot"></span>${p.stock} unidades disponibles — Entrega en 24 h</div>`;

    content.innerHTML = `
      <div class="product-modal-image-wrapper">
        <img src="${p.image}" alt="${p.name}" class="product-modal-image"
          onerror="this.src='https://placehold.co/400x400/${color.slice(1)}/FFFFFF?text=${encodeURIComponent(cat.icon)}'">
      </div>
      <div class="product-modal-info">
        <span class="product-modal-category-badge" style="color:${color};background:${color}18;border-color:${color}44">${cat.icon} ${cat.name}</span>
        <h2 class="product-modal-name" id="product-modal-title">${p.name}</h2>
        <p class="product-modal-description">${p.description}</p>
        <div class="product-modal-price-row">
          <span class="product-modal-price-sup">$</span>
          <span class="product-modal-price">${p.price.toFixed(2)}</span>
        </div>
        ${stockInfo}
        <div class="product-modal-actions">
          ${oos
            ? `<button class="btn-primary-full" disabled style="opacity:.45;cursor:not-allowed">🚫 Producto Agotado</button>`
            : `<div class="quantity-selector">
                <span class="qty-label">Cantidad:</span>
                <div class="qty-controls">
                  <button class="qty-btn" id="modal-qty-dec">−</button>
                  <span class="qty-value" id="modal-qty-val" aria-live="polite">1</span>
                  <button class="qty-btn" id="modal-qty-inc">+</button>
                </div>
                <span class="qty-max-hint">(máx. ${p.stock})</span>
              </div>
              <button class="btn-primary-full" id="modal-add-btn">🛒 Agregar al Carrito</button>`
          }
        </div>
      </div>`;

    if (!oos) {
      document.getElementById('modal-qty-dec')?.addEventListener('click', () => {
        qty = Math.max(1, qty - 1);
        document.getElementById('modal-qty-val').textContent = qty;
      });
      document.getElementById('modal-qty-inc')?.addEventListener('click', () => {
        qty = Math.min(p.stock, qty + 1);
        document.getElementById('modal-qty-val').textContent = qty;
      });
      document.getElementById('modal-add-btn')?.addEventListener('click', () => {
        Cart.add(p, qty);
        closeDetail();
      });
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Category filter ──────────────────────────────────────
  function setCategory(category) {
    activeCategory = category;
    document.querySelectorAll('.category-tab').forEach(t => {
      const active = t.dataset.category === category;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    renderGrid();
  }

  // ── Refresh category tabs (admin edits) ──────────────────
  function refreshCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;
    container.innerHTML = [
      `<button class="category-tab${activeCategory === 'all' ? ' active' : ''}" data-category="all" role="tab"><span class="cat-icon">🏥</span><span>Todos</span></button>`,
      ...Object.entries(CATEGORY_INFO).map(([id, cat]) =>
        `<button class="category-tab${activeCategory === id ? ' active' : ''}" data-category="${id}" role="tab"><span class="cat-icon">${cat.icon}</span><span>${cat.name}</span></button>`)
    ].join('');
    container.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setCategory(tab.dataset.category);
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    renderGrid();
  }

  // ── Search ────────────────────────────────────────────────
  function setSearch(query) { searchQuery = query; renderGrid(); }

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    /* Category tabs */
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setCategory(tab.dataset.category);
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* Search */
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    searchInput?.addEventListener('input', e => {
      setSearch(e.target.value);
      searchClear?.[e.target.value ? 'removeAttribute' : 'setAttribute']('hidden', '');
    });
    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      setSearch('');
      searchClear.setAttribute('hidden', '');
      searchInput?.focus();
    });

    /* Price filters */
    document.getElementById('filter-min-price')?.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      minPrice = isNaN(v) || e.target.value === '' ? null : v;
      renderGrid();
    });
    document.getElementById('filter-max-price')?.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      maxPrice = isNaN(v) || e.target.value === '' ? null : v;
      renderGrid();
    });
    document.getElementById('filter-sort')?.addEventListener('change', e => {
      sortOrder = e.target.value;
      renderGrid();
    });

    /* Availability filter */
    document.querySelectorAll('.avail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        availFilter = btn.dataset.avail;
        document.querySelectorAll('.avail-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderGrid();
      });
    });

    /* Clear all filters */
    document.getElementById('btn-clear-filters')?.addEventListener('click', clearAllFilters);

    /* Product modal close */
    document.getElementById('product-modal-close')?.addEventListener('click', closeDetail);
    document.getElementById('product-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeDetail();
    });

    /* Header scroll */
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

    /* Load products */
    try {
      allProducts = await fetchMedicalProducts();
      window._allProducts = allProducts;
      renderGrid();
    } catch (err) {
      console.error('Error cargando productos:', err);
      const grid = document.getElementById('products-grid');
      if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:64px 16px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
        <h3 style="color:var(--text);margin-bottom:8px">Error al cargar productos</h3>
        <p>Por favor recarga la página o revisa tu conexión</p></div>`;
    }
  }

  return { init, openDetail, quickAdd, setCategory, refreshCategoryTabs, clearFilter };
})();


/* ============================================================
   ORDER MODULE
   ============================================================ */
const Order = (() => {
  async function show() {
    const user  = Auth.getCurrentUser();
    const items = Cart.getItems();
    const total = Cart.getTotal();
    const ship  = window._lastShippingData || {};
    if (!user || items.length === 0) return;

    try {
      await PurchaseHistory.save({
        userEmail: user.email,
        userName: ship.name || user.name,
        email: ship.email || user.email,
        address: ship.address
          ? `${ship.address}, ${ship.city ? ship.city + ', ' : ''}${ship.state || ''} ${ship.zip || ''}`.trim()
          : '',
        items,
        total,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('No se pudo guardar el pedido:', err);
      showToast('⚠️ No se pudo guardar el pedido en la base de datos. Intenta de nuevo.', 'error');
      return;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('order-user-name',    ship.name  || user.name);
    set('order-email',        ship.email || user.email);
    set('order-total-display', `$${total.toFixed(2)}`);

    const addrEl = document.getElementById('order-address-line');
    if (addrEl) {
      addrEl.textContent = ship.address
        ? `${ship.address}, ${ship.city ? ship.city + ', ' : ''}${ship.state || ''} ${ship.zip || ''}`.trim()
        : '—';
    }

    const sumEl = document.getElementById('order-summary');
    if (sumEl) {
      sumEl.innerHTML = items.map(item => `
        <div class="order-item">
          <span class="order-item-name"><strong>${item.qty}×</strong> ${item.name}</span>
          <span class="order-item-amount">$${(item.price * item.qty).toFixed(2)}</span>
        </div>`).join('');
    }

    const modal = document.getElementById('order-modal');
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }

  function close() {
    const modal = document.getElementById('order-modal');
    if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
    Cart.clear();
    window._lastShippingData = null;
    showToast('🎉 ¡Pedido realizado con éxito! Recibirás confirmación por correo.', 'success', 5000);
  }

  function init() {
    document.getElementById('btn-order-close')?.addEventListener('click', close);
    document.getElementById('order-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });
  }

  return { init, show };
})();


/* ============================================================
   PURCHASE HISTORY MODULE
   ============================================================ */
const PurchaseHistory = (() => {
  function getDb() {
    if (!window.firebase?.firestore) {
      throw new Error('Firebase Firestore no está disponible.');
    }
    if (!window.__medisupplyFirestore) {
      window.__medisupplyFirestore = window.firebase.firestore();
    }
    return window.__medisupplyFirestore;
  }

  async function save(order) {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión para guardar tu pedido.');

    const payload = {
      userUid: user.uid || user.id,
      userEmail: user.email,
      userName: order.userName || user.name,
      email: order.email || user.email,
      address: order.address || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      })),
      total: Number(order.total || 0),
      createdAt: order.createdAt || new Date().toISOString(),
      status: 'completed',
    };

    const ref = await getDb().collection('orders').add(payload);
    return { id: ref.id, ...payload };
  }

  async function getCurrentUserOrders() {
    const user = Auth.getCurrentUser();
    if (!user) return [];

    const userUid = user.uid || user.id;
    const snapshot = await getDb().collection('orders').where('userUid', '==', userUid).get();

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function open() {
    Auth.requireAuth(async () => {
      await render();
      const modal = document.getElementById('history-modal');
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  function close() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  async function render() {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = `
      <div class="history-empty">
        <span aria-hidden="true">📋</span>
        <h3>Cargando tus compras…</h3>
        <p>Estamos consultando tu historial en la base de datos.</p>
      </div>`;

    try {
      const orders = await getCurrentUserOrders();

      if (orders.length === 0) {
        list.innerHTML = `
          <div class="history-empty">
            <span aria-hidden="true">📋</span>
            <h3>Aún no tienes compras</h3>
            <p>Cuando confirmes un pedido, aparecerá en esta sección.</p>
          </div>`;
        return;
      }

      list.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleString('es', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
          <article class="history-order">
            <div class="history-order-header">
              <div>
                <strong>Pedido #${order.id}</strong>
                <span>${date}</span>
              </div>
              <strong class="history-total">$${Number(order.total || 0).toFixed(2)}</strong>
            </div>
            <div class="history-items">
              ${order.items.map(item => `
                <div class="history-item">
                  <span>${item.qty}× ${item.name}</span>
                  <strong>$${(item.price * item.qty).toFixed(2)}</strong>
                </div>`).join('')}
            </div>
            ${order.address ? `<p class="history-address">Entrega: ${order.address}</p>` : ''}
          </article>`;
      }).join('');
    } catch (err) {
      console.error('Error cargando historial:', err);
      list.innerHTML = `
        <div class="history-empty">
          <span aria-hidden="true">⚠️</span>
          <h3>No se pudo cargar el historial</h3>
          <p>Revisa tu conexión o la configuración de Firestore.</p>
        </div>`;
    }
  }

  function init() {
    document.getElementById('history-btn')?.addEventListener('click', open);
    document.getElementById('history-modal-close')?.addEventListener('click', close);
    document.getElementById('history-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });
    document.addEventListener('keydown', e => {
      const modal = document.getElementById('history-modal');
      if (e.key === 'Escape' && modal?.classList.contains('open')) close();
    });
  }

  return { init, open, save };
})();


/* ============================================================
   APP BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  Auth.init();
  Cart.init();
  Order.init();
  PurchaseHistory.init();
  if (window.Admin?.init) Admin.init();
  Shipping.init();
  await Products.init();
  console.info('✅ MediSupply — todos los módulos iniciados correctamente.');
});

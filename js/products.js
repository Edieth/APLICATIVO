/* ============================================================
   MEDISUPPLY — PRODUCTS MODULE
   ============================================================ */

const Products = (() => {
  let allProducts    = [];
  let activeCategory = 'all';
  let searchQuery    = '';

  const CATEGORY_TITLES = {
    all:          'Todos los Productos',
    diagnostico:  'Equipo de Diagnóstico',
    medicamentos: 'Medicamentos y Fármacos',
    curaciones:   'Material de Curaciones',
    proteccion:   'Equipo de Protección Personal (EPP)',
    laboratorio:  'Material de Laboratorio',
    hospitalario: 'Equipo Hospitalario',
  };

  // ── Filtering ─────────────────────────────────────────────
  function getFiltered() {
    return allProducts.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
        || (CATEGORY_INFO[p.category]?.name || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }

  // ── Render grid ───────────────────────────────────────────
  function renderGrid() {
    const grid       = document.getElementById('products-grid');
    const countEl    = document.getElementById('products-count');
    const titleEl    = document.getElementById('section-title');
    const emptyState = document.getElementById('empty-state');

    if (!grid) return;

    const filtered = getFiltered();

    // Update title
    if (titleEl) {
      titleEl.textContent = searchQuery
        ? `Resultados para "${searchQuery}"`
        : (CATEGORY_TITLES[activeCategory] || 'Productos');
    }

    // Update count
    if (countEl) {
      countEl.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState?.removeAttribute('hidden');
      return;
    }

    emptyState?.setAttribute('hidden', '');

    grid.innerHTML = filtered.map((p, idx) => {
      const cat   = CATEGORY_INFO[p.category] || { name: p.category, icon: '📦', color: '#0A84FF' };
      const color = cat.color;
      const delay = Math.min(idx * 0.04, 0.5);

      return `
        <article
          class="product-card"
          style="--cat-color: ${color}; animation-delay: ${delay}s"
          id="product-${p.id}"
          tabindex="0"
          role="button"
          aria-label="Ver detalle de ${p.name}, precio $${p.price.toFixed(2)}"
          onclick="Products.openDetail(${p.id})"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();Products.openDetail(${p.id})}"
        >
          <div class="product-image-wrapper">
            <img
              src="${p.image}"
              alt="Imagen de ${p.name}"
              class="product-image"
              loading="lazy"
              onerror="this.src='https://placehold.co/400x400/${color.slice(1)}/FFFFFF?text=${encodeURIComponent(cat.icon)}'"
            >
            <div class="product-category-badge" style="color: ${color}">
              ${cat.icon} ${cat.name}
            </div>
            <button
              class="product-quick-add"
              onclick="event.stopPropagation(); Products.quickAdd(${p.id})"
              aria-label="Agregar ${p.name} al carrito"
              title="Agregar al carrito"
            >+</button>
          </div>

          <div class="product-body">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-description">${p.description}</p>
          </div>

          <div class="product-footer">
            <div class="product-price">
              <span class="currency">$</span>${p.price.toFixed(2)}
            </div>
            <button
              class="btn-add-to-cart"
              onclick="event.stopPropagation(); Products.quickAdd(${p.id})"
              id="add-btn-${p.id}"
              aria-label="Agregar ${p.name} al carrito"
            >
              🛒 Agregar
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // ── Quick add (direct, no modal) ──────────────────────────
  function quickAdd(productId) {
    const p = allProducts.find(x => x.id === productId);
    if (p) Cart.add(p, 1);
  }

  // ── Product detail modal ──────────────────────────────────
  function openDetail(productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;

    const cat   = CATEGORY_INFO[p.category] || { name: p.category, icon: '📦', color: '#0A84FF' };
    const color = cat.color;
    let   qty   = 1;

    const modal   = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="product-modal-image-wrapper">
        <img
          src="${p.image}"
          alt="Imagen de ${p.name}"
          class="product-modal-image"
          onerror="this.src='https://placehold.co/400x400/${color.slice(1)}/FFFFFF?text=${encodeURIComponent(cat.icon)}'"
        >
      </div>
      <div class="product-modal-info">
        <span
          class="product-modal-category-badge"
          style="color:${color}; background:${color}18; border-color:${color}44"
        >${cat.icon} ${cat.name}</span>

        <h2 class="product-modal-name" id="product-modal-title">${p.name}</h2>
        <p class="product-modal-description">${p.description}</p>

        <div class="product-modal-price-row">
          <span class="product-modal-price-sup">$</span>
          <span class="product-modal-price">${p.price.toFixed(2)}</span>
        </div>

        <div class="product-modal-stock">
          <span class="stock-dot"></span>
          En stock — Entrega en 24 horas
        </div>

        <div class="product-modal-actions">
          <div class="quantity-selector">
            <span class="qty-label">Cantidad:</span>
            <div class="qty-controls">
              <button class="qty-btn" id="modal-qty-dec" aria-label="Disminuir">−</button>
              <span class="qty-value" id="modal-qty-val" aria-live="polite">1</span>
              <button class="qty-btn" id="modal-qty-inc" aria-label="Aumentar">+</button>
            </div>
          </div>
          <button class="btn-primary-full" id="modal-add-btn">
            🛒 Agregar al Carrito
          </button>
        </div>
      </div>
    `;

    // Quantity controls
    document.getElementById('modal-qty-dec')?.addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      document.getElementById('modal-qty-val').textContent = qty;
    });

    document.getElementById('modal-qty-inc')?.addEventListener('click', () => {
      qty = Math.min(99, qty + 1);
      document.getElementById('modal-qty-val').textContent = qty;
    });

    document.getElementById('modal-add-btn')?.addEventListener('click', () => {
      Cart.add(p, qty);
      closeDetail();
    });

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Category filter ───────────────────────────────────────
  function setCategory(category) {
    activeCategory = category;

    document.querySelectorAll('.category-tab').forEach(tab => {
      const active = tab.dataset.category === category;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    renderGrid();
  }

  // ── Search ────────────────────────────────────────────────
  function setSearch(query) {
    searchQuery = query;
    renderGrid();
  }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    /* Category tabs */
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setCategory(tab.dataset.category);
        document.getElementById('products-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* Search bar */
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    searchInput?.addEventListener('input', e => {
      const val = e.target.value;
      setSearch(val);
      searchClear?.[val ? 'removeAttribute' : 'setAttribute']('hidden', '');
    });

    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      setSearch('');
      searchClear.setAttribute('hidden', '');
      searchInput?.focus();
    });

    /* Product modal close */
    document.getElementById('product-modal-close')?.addEventListener('click', closeDetail);
    document.getElementById('product-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeDetail();
    });

    /* Header scroll effect */
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    /* Escape closes product modal */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDetail();
    });

    /* Load products from API */
    try {
      allProducts = await fetchMedicalProducts();
      renderGrid();
    } catch (err) {
      console.error('Error cargando productos:', err);
      const grid = document.getElementById('products-grid');
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:64px 16px; color:var(--text-muted)">
            <div style="font-size:48px; margin-bottom:16px">⚠️</div>
            <h3 style="color:var(--text); margin-bottom:8px">Error al cargar productos</h3>
            <p>Por favor recarga la página o revisa tu conexión</p>
          </div>
        `;
      }
    }
  }

  return { init, openDetail, quickAdd, setCategory };
})();

/* ============================================================
   ORDER MODULE
   ============================================================ */
const Order = (() => {
  function show() {
    const user  = Auth.getCurrentUser();
    const items = Cart.getItems();
    const total = Cart.getTotal();

    if (!user || items.length === 0) return;

    // Fill header
    const nameEl  = document.getElementById('order-user-name');
    const emailEl = document.getElementById('order-email');
    const totalEl = document.getElementById('order-total-display');
    const sumEl   = document.getElementById('order-summary');

    if (nameEl)  nameEl.textContent  = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    if (sumEl) {
      sumEl.innerHTML = items.map(item => `
        <div class="order-item">
          <span class="order-item-name">
            <strong>${item.qty}×</strong> ${item.name}
          </span>
          <span class="order-item-amount">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `).join('');
    }

    const modal = document.getElementById('order-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function close() {
    const modal = document.getElementById('order-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    Cart.clear();
    showToast('🎉 ¡Pedido realizado con éxito! Recibirás un correo de confirmación.', 'success', 5000);
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
   APP BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialise all modules in dependency order
  Auth.init();
  Cart.init();
  Order.init();
  await Products.init();

  console.info('✅ MediSupply cargado correctamente.');
});

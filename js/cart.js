/* ============================================================
   MEDISUPPLY — CART MODULE
   ============================================================ */

const Cart = (() => {
  const STORAGE_KEY = 'medisupply-cart';

  // ── State ──────────────────────────────────────────────────
  let items = [];

  // ── Helpers ────────────────────────────────────────────────
  function load() {
    try {
      items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      items = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function fmt(price) {
    return `$${price.toFixed(2)}`;
  }

  // ── Public API ─────────────────────────────────────────────

  function add(product, qty = 1) {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
    } else {
      items.push({
        id:    product.id,
        name:  product.name,
        price: product.price,
        image: product.image,
        qty,
      });
    }
    save();
    render();
    updateBadge();

    const shortName = product.name.split(' ').slice(0, 3).join(' ');
    showToast(`✅ ${shortName}... agregado al carrito`, 'success');
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    save();
    render();
    updateBadge();
  }

  function updateQty(id, delta) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const next = item.qty + delta;
    if (next < 1) {
      // Remove if decremented below 1
      remove(id);
      return;
    }
    item.qty = Math.min(99, next);
    save();
    render();
    updateBadge();
  }

  function clear() {
    items = [];
    save();
    render();
    updateBadge();
  }

  function getItems()  { return [...items]; }
  function getCount()  { return items.reduce((s, i) => s + i.qty, 0); }
  function getTotal()  { return items.reduce((s, i) => s + i.price * i.qty, 0); }

  // ── Badge ──────────────────────────────────────────────────
  function updateBadge() {
    const badge = document.getElementById('cart-badge');
    const count = getCount();
    if (!badge) return;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('hidden', count === 0);
  }

  // ── Render ─────────────────────────────────────────────────
  function render() {
    const container  = document.getElementById('cart-items');
    const footer     = document.getElementById('cart-footer');
    const countEl    = document.getElementById('cart-items-count');
    const subtotalEl = document.getElementById('cart-subtotal-amount');
    const totalEl    = document.getElementById('cart-total-amount');

    if (!container) return;

    const count = getCount();
    if (countEl) countEl.textContent = `${count} artículo${count !== 1 ? 's' : ''}`;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <span aria-hidden="true">🛒</span>
          <p>Tu carrito está vacío</p>
          <small>Agrega productos para comenzar</small>
        </div>
      `;
      if (footer) footer.classList.remove('visible');
      return;
    }

    // Build items HTML
    container.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img
          src="${item.image}"
          alt="${item.name}"
          class="cart-item-image"
          loading="lazy"
          onerror="this.src='https://placehold.co/60x60/21262D/656D76?text=IMG'"
        >
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-unit-price">${fmt(item.price)} c/u</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-total">${fmt(item.price * item.qty)}</div>
          <div class="cart-item-qty">
            <button
              class="cart-qty-btn"
              onclick="Cart.updateQty(${item.id}, -1)"
              aria-label="Disminuir cantidad de ${item.name}"
            >−</button>
            <span class="cart-qty-val" aria-label="Cantidad: ${item.qty}">${item.qty}</span>
            <button
              class="cart-qty-btn"
              onclick="Cart.updateQty(${item.id}, 1)"
              aria-label="Aumentar cantidad de ${item.name}"
            >+</button>
          </div>
          <button
            class="cart-item-remove"
            onclick="Cart.remove(${item.id})"
            aria-label="Eliminar ${item.name} del carrito"
          >Eliminar</button>
        </div>
      </div>
    `).join('');

    // Update totals
    const total = getTotal();
    if (subtotalEl) subtotalEl.textContent = fmt(total);
    if (totalEl)    totalEl.textContent    = fmt(total);
    if (footer)     footer.classList.add('visible');
  }

  // ── Open / Close ───────────────────────────────────────────
  function open() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    load();

    // Open/close events
    document.getElementById('cart-btn')?.addEventListener('click', open);
    document.getElementById('cart-close')?.addEventListener('click', close);

    // Click outside panel to close
    document.getElementById('cart-overlay')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });

    // Buy button
    document.getElementById('btn-buy')?.addEventListener('click', () => {
      if (items.length === 0) {
        showToast('⚠️ Tu carrito está vacío', 'error');
        return;
      }
      close();
      Auth.requireAuth(() => Order.show());
    });

    render();
    updateBadge();
  }

  // ── Public surface ─────────────────────────────────────────
  return { init, add, remove, updateQty, clear, getItems, getTotal, open, close };
})();

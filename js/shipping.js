/* ============================================================
   MEDISUPPLY — SHIPPING MODULE
   Formulario de datos de envío antes de confirmar el pedido.
   ============================================================ */

const Shipping = (() => {
  const PREF_KEY = 'medisupply-ship-prefs';

  // ── Persistence ─────────────────────────────────────────
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; }
    catch { return {}; }
  }

  function savePrefs(data) {
    localStorage.setItem(PREF_KEY, JSON.stringify(data));
  }

  // ── Pre-fill form ────────────────────────────────────────
  function prefillForm() {
    const user  = Auth.getCurrentUser();
    const prefs = loadPrefs();

    const fields = {
      'ship-name':    user?.name    || prefs.name    || '',
      'ship-email':   user?.email   || prefs.email   || '',
      'ship-phone':   prefs.phone   || '',
      'ship-address': prefs.address || '',
      'ship-city':    prefs.city    || '',
      'ship-state':   prefs.state   || '',
      'ship-zip':     prefs.zip     || '',
    };

    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = val;
    });

    const country = document.getElementById('ship-country');
    if (country && prefs.country) country.value = prefs.country;
  }

  function updateTotal() {
    const el = document.getElementById('shipping-total-display');
    if (el) el.textContent = `$${Cart.getTotal().toFixed(2)}`;
  }

  // ── Open / close ─────────────────────────────────────────
  function open() {
    updateTotal();
    // Reset form
    document.getElementById('shipping-form')?.reset();
    document.getElementById('shipping-error')?.setAttribute('hidden', '');
    // Then pre-fill
    prefillForm();
    updateTotal();

    const modal = document.getElementById('shipping-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('ship-phone')?.focus(), 200);
    }
  }

  function close() {
    const modal = document.getElementById('shipping-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    document.getElementById('shipping-modal-close')?.addEventListener('click', close);
    document.getElementById('shipping-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });

    document.getElementById('shipping-form')?.addEventListener('submit', e => {
      e.preventDefault();

      const errEl = document.getElementById('shipping-error');
      errEl?.setAttribute('hidden', '');

      const name    = document.getElementById('ship-name')?.value.trim()    || '';
      const email   = document.getElementById('ship-email')?.value.trim()   || '';
      const phone   = document.getElementById('ship-phone')?.value.trim()   || '';
      const address = document.getElementById('ship-address')?.value.trim() || '';
      const city    = document.getElementById('ship-city')?.value.trim()    || '';
      const state   = document.getElementById('ship-state')?.value.trim()   || '';
      const zip     = document.getElementById('ship-zip')?.value.trim()     || '';
      const country = document.getElementById('ship-country')?.value        || 'MX';
      const notes   = document.getElementById('ship-notes')?.value.trim()   || '';

      // Basic validation
      if (!phone) {
        if (errEl) { errEl.textContent = '⚠️ El teléfono de contacto es requerido.'; errEl.removeAttribute('hidden'); }
        document.getElementById('ship-phone')?.focus();
        return;
      }
      if (!address) {
        if (errEl) { errEl.textContent = '⚠️ La dirección de envío es requerida.'; errEl.removeAttribute('hidden'); }
        document.getElementById('ship-address')?.focus();
        return;
      }

      // Save preferences for next time
      const prefs = { name, email, phone, address, city, state, zip, country };
      savePrefs(prefs);

      // Store shipping data for order confirmation
      window._lastShippingData = { ...prefs, notes };

      close();
      Order.show();
    });

    document.addEventListener('keydown', e => {
      const modal = document.getElementById('shipping-modal');
      if (e.key === 'Escape' && modal?.classList.contains('open')) close();
    });
  }

  return { init, open, close };
})();

/* ============================================================
   MEDISUPPLY — ADMIN MODULE
   Panel de administración para CRUD de categorías.
   Acceso: admin@medisupply.com / Admin2024
   ============================================================ */

const Admin = (() => {
  const CAT_KEY = 'medisupply-categories';

  const COLOR_PALETTE = [
    '#0A84FF', '#30D158', '#FF6B6B', '#FFD93D', '#A855F7',
    '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1',
    '#84CC16', '#06B6D4', '#EF4444', '#8B5CF6',
  ];

  // ── Storage ─────────────────────────────────────────────
  function getCustomCategories() {
    try {
      const stored = localStorage.getItem(CAT_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  }

  function saveCustomCategories(cats) {
    localStorage.setItem(CAT_KEY, JSON.stringify(cats));
    refreshCategories();
  }

  // ── CRUD ────────────────────────────────────────────────
  function addCategory(name, icon, color) {
    if (!name.trim()) throw new Error('El nombre de la categoría es requerido.');
    const id = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!id) throw new Error('Nombre inválido para generar ID.');
    if (CATEGORY_INFO[id]) throw new Error(`Ya existe "${CATEGORY_INFO[id].name}".`);
    const custom = getCustomCategories();
    custom[id] = { name: name.trim(), icon: icon.trim() || '📦', color: color || '#0A84FF', custom: true };
    saveCustomCategories(custom);
    return id;
  }

  function updateCategory(id, name, icon, color) {
    if (!name.trim()) throw new Error('El nombre no puede estar vacío.');
    const custom = getCustomCategories();
    const base   = DEFAULT_CATEGORY_INFO[id] || {};
    custom[id]   = {
      name:   name.trim(),
      icon:   icon.trim() || base.icon || '📦',
      color:  color || base.color || '#0A84FF',
      custom: !DEFAULT_CATEGORY_INFO[id],
    };
    saveCustomCategories(custom);
  }

  function deleteCategory(id, products, confirmed = false) {
    if (DEFAULT_CATEGORY_INFO[id]) {
      throw new Error('Las categorías base del sistema no pueden eliminarse.');
    }
    const count = products.filter(p => p.category === id).length;
    if (count > 0 && !confirmed) return { needsConfirm: true, count };
    const custom = getCustomCategories();
    delete custom[id];
    saveCustomCategories(custom);
    return { needsConfirm: false };
  }

  // ── Render list ─────────────────────────────────────────
  function renderPanel(products) {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;

    const cats = CATEGORY_INFO;

    if (Object.keys(cats).length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px">No hay categorías.</p>';
      return;
    }

    listEl.innerHTML = Object.entries(cats).map(([id, cat]) => {
      const count     = products.filter(p => p.category === id).length;
      const isDefault = !!DEFAULT_CATEGORY_INFO[id];
      return `
        <div class="admin-cat-item" data-id="${id}" id="admin-cat-${id}">
          <div class="admin-cat-left">
            <span class="admin-cat-icon" style="background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}44">
              ${cat.icon}
            </span>
            <div class="admin-cat-info">
              <span class="admin-cat-name">${cat.name}</span>
              <span class="admin-cat-meta">
                ${count} producto${count !== 1 ? 's' : ''}
                · <span class="${isDefault ? 'tag-default' : 'tag-custom'}">${isDefault ? 'Base' : 'Personalizada'}</span>
              </span>
            </div>
          </div>
          <div class="admin-cat-actions">
            <button class="btn-admin-action edit" onclick="Admin.startEdit('${id}')" title="Editar">✏️</button>
            ${!isDefault
              ? `<button class="btn-admin-action delete" onclick="Admin.confirmDelete('${id}')" title="Eliminar">🗑️</button>`
              : '<span class="admin-lock" title="Categoría base del sistema">🔒</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Inline edit ─────────────────────────────────────────
  function startEdit(id) {
    const cat  = CATEGORY_INFO[id];
    const item = document.getElementById(`admin-cat-${id}`);
    if (!cat || !item) return;

    item.innerHTML = `
      <div class="admin-cat-edit-form">
        <input type="text"  id="edit-name-${id}"  value="${cat.name}"  placeholder="Nombre"  class="admin-edit-input">
        <input type="text"  id="edit-icon-${id}"  value="${cat.icon}"  placeholder="Emoji"   class="admin-edit-icon"  maxlength="4">
        <input type="color" id="edit-color-${id}" value="${cat.color}"                        class="admin-edit-color" title="Color de categoría">
        <button class="btn-admin-save"   onclick="Admin.saveEdit('${id}')">✅ Guardar</button>
        <button class="btn-admin-cancel" onclick="Admin.renderPanel(window._adminProducts || [])">✕</button>
      </div>
    `;
    document.getElementById(`edit-name-${id}`)?.focus();
  }

  function saveEdit(id) {
    const name  = document.getElementById(`edit-name-${id}`)?.value  || '';
    const icon  = document.getElementById(`edit-icon-${id}`)?.value  || '';
    const color = document.getElementById(`edit-color-${id}`)?.value || '#0A84FF';
    try {
      updateCategory(id, name, icon, color);
      showToast(`✅ Categoría "${name}" actualizada`, 'success');
      renderPanel(window._adminProducts || []);
      if (typeof Products !== 'undefined') Products.refreshCategoryTabs?.();
    } catch (err) {
      showToast(`⚠️ ${err.message}`, 'error');
    }
  }

  function confirmDelete(id) {
    const products = window._adminProducts || [];
    try {
      const result = deleteCategory(id, products, false);
      if (result.needsConfirm) {
        const cat = CATEGORY_INFO[id];
        const ok  = confirm(
          `⚠️ La categoría "${cat?.name}" tiene ${result.count} producto(s) asociado(s).\n\n` +
          `Los productos quedarán sin categoría visible si eliminas esta categoría.\n\n` +
          `¿Deseas continuar de todas formas?`
        );
        if (ok) {
          deleteCategory(id, products, true);
          showToast(`🗑️ Categoría eliminada`, 'info');
          renderPanel(products);
          if (typeof Products !== 'undefined') Products.refreshCategoryTabs?.();
        }
      } else {
        showToast(`🗑️ Categoría eliminada`, 'info');
        renderPanel(products);
        if (typeof Products !== 'undefined') Products.refreshCategoryTabs?.();
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`, 'error');
    }
  }

  // ── Open / close ─────────────────────────────────────────
  function open(products) {
    window._adminProducts = products;
    renderPanel(products);

    // Render color palette
    const palette = document.getElementById('admin-color-palette');
    if (palette) {
      palette.innerHTML = COLOR_PALETTE.map(c =>
        `<button class="palette-dot" style="background:${c}" data-color="${c}" onclick="document.getElementById('new-cat-color').value='${c}';document.querySelectorAll('.palette-dot').forEach(d=>d.classList.remove('selected'));this.classList.add('selected')" title="${c}"></button>`
      ).join('');
    }

    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function close() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    document.getElementById('admin-btn')?.addEventListener('click', () => {
      open(window._allProducts || []);
    });

    document.getElementById('admin-modal-close')?.addEventListener('click', close);
    document.getElementById('admin-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });

    document.getElementById('btn-add-category')?.addEventListener('click', () => {
      const name  = document.getElementById('new-cat-name')?.value || '';
      const icon  = document.getElementById('new-cat-icon')?.value || '📦';
      const color = document.getElementById('new-cat-color')?.value || '#0A84FF';
      try {
        addCategory(name, icon, color);
        showToast(`✅ Categoría "${name}" creada`, 'success');
        if (document.getElementById('new-cat-name'))  document.getElementById('new-cat-name').value  = '';
        if (document.getElementById('new-cat-icon'))  document.getElementById('new-cat-icon').value  = '';
        renderPanel(window._adminProducts || []);
        if (typeof Products !== 'undefined') Products.refreshCategoryTabs?.();
      } catch (err) {
        showToast(`⚠️ ${err.message}`, 'error');
      }
    });

    document.getElementById('new-cat-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-add-category')?.click();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  return { init, open, close, startEdit, saveEdit, confirmDelete, renderPanel };
})();

/* ============================================================
   MEDISUPPLY — AUTH MODULE
   Auth uses localStorage to simulate registration and login.
   In production, replace with a real backend or Firebase Auth.
   ============================================================ */

const Auth = (() => {
  const USERS_KEY   = 'medisupply-users';
  const SESSION_KEY = 'medisupply-session';

  let successCallback = null; // called after successful login/register

  // ── Persistence helpers ───────────────────────────────────
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    updateHeaderUI();
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    updateHeaderUI();
  }

  // ── Public: Get current user ──────────────────────────────
  function getCurrentUser() { return getSession(); }
  function isLoggedIn()     { return getSession() !== null; }

  // ── Header UI ─────────────────────────────────────────────
  function updateHeaderUI() {
    const user   = getSession();
    const label  = document.getElementById('user-label');
    const btn    = document.getElementById('user-btn');

    if (label) {
      label.textContent = user
        ? `👋 ${user.name.split(' ')[0]}`
        : 'Iniciar sesión';
    }

    if (btn) {
      btn.title = user
        ? `${user.email} — Clic para cerrar sesión`
        : 'Iniciar sesión o crear cuenta';
    }
  }

  // ── Business logic ────────────────────────────────────────
  function register(name, email, password) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Ya existe una cuenta con este correo electrónico.');
    }
    const newUser = {
      id:        Date.now(),
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password,              // ⚠️ demo only — never store plain passwords in production
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    setSession({ id: newUser.id, name: newUser.name, email: newUser.email });
    return newUser;
  }

  function login(email, password) {
    const users = getUsers();
    const match = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
        && u.password === password
    );
    if (!match) throw new Error('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
    setSession({ id: match.id, name: match.name, email: match.email });
    return match;
  }

  function logout() {
    clearSession();
    showToast('👋 Sesión cerrada. ¡Hasta pronto!', 'info');
  }

  // ── Require auth flow ─────────────────────────────────────
  function requireAuth(onSuccess) {
    if (isLoggedIn()) {
      onSuccess?.();
      return;
    }
    successCallback = onSuccess;
    openModal();
  }

  // ── Modal open / close ────────────────────────────────────
  function openModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Default to login tab
    switchTab('login');
    setTimeout(() => document.getElementById('login-email')?.focus(), 200);
  }

  function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    successCallback = null;
    clearFormErrors();
  }

  // ── Tab switching ─────────────────────────────────────────
  function switchTab(tab) {
    const loginTab    = document.getElementById('tab-login');
    const regTab      = document.getElementById('tab-register');
    const loginForm   = document.getElementById('login-form');
    const regForm     = document.getElementById('register-form');

    const isLogin = tab === 'login';

    loginTab?.classList.toggle('active', isLogin);
    regTab?.classList.toggle('active', !isLogin);
    loginTab?.setAttribute('aria-selected', String(isLogin));
    regTab?.setAttribute('aria-selected', String(!isLogin));

    loginForm?.[isLogin ? 'removeAttribute' : 'setAttribute']('hidden', '');
    regForm?.[isLogin ? 'setAttribute' : 'removeAttribute']('hidden', '');

    clearFormErrors();
    setTimeout(() => {
      (isLogin
        ? document.getElementById('login-email')
        : document.getElementById('reg-name')
      )?.focus();
    }, 80);
  }

  /** Public alias used by inline onclick in HTML */
  function switchTabPublic(tab) { switchTab(tab); }

  // ── Form helpers ──────────────────────────────────────────
  function clearFormErrors() {
    ['login-error', 'register-error'].forEach(id => {
      const el = document.getElementById(id);
      el?.setAttribute('hidden', '');
      if (el) el.textContent = '';
    });
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute('hidden');
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    const labels = { 'btn-login': 'Iniciar Sesión', 'btn-register': 'Crear Cuenta Gratuita' };
    btn.innerHTML = loading
      ? '<span>⏳ Procesando…</span>'
      : `<span>${labels[btnId]}</span>`;
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    // Restore header state
    updateHeaderUI();

    /* ── User button (login / logout) ── */
    document.getElementById('user-btn')?.addEventListener('click', () => {
      if (isLoggedIn()) {
        logout();
      } else {
        openModal();
      }
    });

    /* ── Close modal ── */
    document.getElementById('auth-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('auth-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    /* ── Tab buttons ── */
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

    /* ── Show / hide password ── */
    document.querySelectorAll('.btn-show-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const showing = input.type === 'text';
        input.type   = showing ? 'password' : 'text';
        btn.textContent = showing ? '👁' : '🙈';
        btn.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
      });
    });

    /* ── Login form submit ── */
    document.getElementById('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      clearFormErrors();
      setLoading('btn-login', true);

      // Brief artificial delay for UX
      await new Promise(r => setTimeout(r, 550));

      try {
        login(email, password);
        const user = getSession();
        showToast(`🎉 ¡Bienvenido de vuelta, ${user.name.split(' ')[0]}!`, 'success');
        closeModal();
        const cb = successCallback;
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('login-error', err.message);
      } finally {
        setLoading('btn-login', false);
      }
    });

    /* ── Register form submit ── */
    document.getElementById('register-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;

      clearFormErrors();

      if (password !== confirm) {
        showError('register-error', '⚠️ Las contraseñas no coinciden. Por favor revísalas.');
        return;
      }
      if (password.length < 8) {
        showError('register-error', '⚠️ La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      setLoading('btn-register', true);
      await new Promise(r => setTimeout(r, 750));

      try {
        register(name, email, password);
        showToast(`🎉 ¡Cuenta creada! Bienvenido, ${name.split(' ')[0]}`, 'success');
        closeModal();
        const cb = successCallback;
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('register-error', err.message);
      } finally {
        setLoading('btn-register', false);
      }
    });

    /* ── Escape key ── */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ── Public surface ────────────────────────────────────────
  return {
    init,
    requireAuth,
    isLoggedIn,
    getCurrentUser,
    logout,
    openModal,
    closeModal,
    switchTabPublic,
  };
})();

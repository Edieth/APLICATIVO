/* ============================================================
   MEDISUPPLY — AUTH MODULE
   - Registro / Login con localStorage
   - Recuperación de contraseña (4 pasos)
   - Detección de admin (admin@medisupply.com / Admin2024)
   ============================================================ */

const Auth = (() => {
  const USERS_KEY      = 'medisupply-users';
  const SESSION_KEY    = 'medisupply-session';
  const ADMIN_EMAIL    = 'admin@medisupply.com';
  const ADMIN_PASSWORD = 'Admin2024';

  let successCallback = null;
  let recoveryCode    = null;
  let recoveryEmail   = null;

  // ── Persistence ────────────────────────────────────────
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

  // ── Public getters ─────────────────────────────────────
  function getCurrentUser() { return getSession(); }
  function isLoggedIn()     { return getSession() !== null; }

  // ── Header UI ──────────────────────────────────────────
  function updateHeaderUI() {
    const user     = getSession();
    const label    = document.getElementById('user-label');
    const btn      = document.getElementById('user-btn');
    const adminBtn = document.getElementById('admin-btn');

    if (label) {
      label.textContent = user ? `👋 ${user.name.split(' ')[0]}` : 'Iniciar sesión';
    }
    if (btn) {
      btn.title = user
        ? `${user.email} — Clic para cerrar sesión`
        : 'Iniciar sesión o crear cuenta';
    }
    if (adminBtn) {
      adminBtn.hidden = !(user?.isAdmin);
    }
  }

  // ── Auth logic ─────────────────────────────────────────
  function register(name, email, password) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }
    const newUser = {
      id:        Date.now(),
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    setSession({ id: newUser.id, name: newUser.name, email: newUser.email });
    return newUser;
  }

  function login(email, password) {
    // Cuenta especial de administrador
    if (email.toLowerCase().trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminSession = { id: 0, name: 'Administrador', email: ADMIN_EMAIL, isAdmin: true };
      setSession(adminSession);
      return adminSession;
    }
    const users = getUsers();
    const match = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
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

  // ── Require auth flow ──────────────────────────────────
  function requireAuth(onSuccess) {
    if (isLoggedIn()) { onSuccess?.(); return; }
    successCallback = onSuccess;
    openModal();
  }

  // ── Auth Modal ─────────────────────────────────────────
  function openModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
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

  function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin);
    document.getElementById('login-form')?.[isLogin ? 'removeAttribute' : 'setAttribute']('hidden', '');
    document.getElementById('register-form')?.[isLogin ? 'setAttribute' : 'removeAttribute']('hidden', '');
    clearFormErrors();
    setTimeout(() => {
      (isLogin ? document.getElementById('login-email') : document.getElementById('reg-name'))?.focus();
    }, 80);
  }

  function switchTabPublic(tab) { switchTab(tab); }

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
    btn.innerHTML = loading ? '<span>⏳ Procesando…</span>' : `<span>${labels[btnId] || 'Enviar'}</span>`;
  }

  // ── Password Recovery ──────────────────────────────────
  function openRecovery() {
    closeModal();
    const modal = document.getElementById('recovery-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showRecoveryStep(1);
    const emailInput = document.getElementById('recovery-email');
    if (emailInput) emailInput.value = '';
    setTimeout(() => emailInput?.focus(), 200);
  }

  function closeRecovery() {
    const modal = document.getElementById('recovery-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    recoveryCode  = null;
    recoveryEmail = null;
  }

  function showRecoveryStep(step) {
    const formVisibility = {
      'recovery-email-form': step === 1,
      'recovery-code-form': step === 2,
      'recovery-password-form': step === 3,
      'recovery-step-4': step === 4,
    };

    Object.entries(formVisibility).forEach(([id, visible]) => {
      document.getElementById(id)?.[visible ? 'removeAttribute' : 'setAttribute']('hidden', '');
    });

    [1, 2, 3, 4].forEach(n => {
      document.getElementById(`recovery-step-${n}`)?.[n === step ? 'removeAttribute' : 'setAttribute']('hidden', '');
    });
    // Update progress dots
    document.querySelectorAll('.rprogress-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i + 1 === step);
      dot.classList.toggle('done',   i + 1 < step);
    });
  }

  function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function sendRecoveryCode(email) {
    const norm  = email.toLowerCase().trim();
    const users = getUsers();
    const found = users.some(u => u.email === norm) || norm === ADMIN_EMAIL;
    if (!found) throw new Error('No encontramos ninguna cuenta con este correo electrónico.');
    recoveryCode  = generateCode();
    recoveryEmail = norm;
    return recoveryCode;
  }

  function verifyCode(input) {
    if (!recoveryCode) throw new Error('Sesión de recuperación expirada. Inicia de nuevo.');
    if (input.trim() !== recoveryCode) throw new Error('Código incorrecto. Verifica e intenta de nuevo.');
  }

  function changePassword(newPass, confirm) {
    if (newPass !== confirm) throw new Error('Las contraseñas no coinciden.');
    if (newPass.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    if (!recoveryEmail) throw new Error('Sesión expirada. Reinicia el proceso de recuperación.');
    if (recoveryEmail === ADMIN_EMAIL) {
      // Admin account is hardcoded — can't change in demo
      recoveryCode = recoveryEmail = null;
      return;
    }
    const users = getUsers();
    const user  = users.find(u => u.email === recoveryEmail);
    if (!user) throw new Error('Usuario no encontrado.');
    user.password = newPass;
    saveUsers(users);
    recoveryCode = recoveryEmail = null;
  }

  // ── Init ───────────────────────────────────────────────
  function init() {
    updateHeaderUI();

    /* User button */
    document.getElementById('user-btn')?.addEventListener('click', () => {
      isLoggedIn() ? logout() : openModal();
    });

    /* Auth modal close */
    document.getElementById('auth-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('auth-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    /* Tabs */
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

    /* Forgot password */
    document.getElementById('btn-forgot-password')?.addEventListener('click', openRecovery);

    /* Show/hide password buttons */
    document.querySelectorAll('.btn-show-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const showing   = input.type === 'text';
        input.type      = showing ? 'password' : 'text';
        btn.textContent = showing ? '👁' : '🙈';
      });
    });

    /* Login form */
    document.getElementById('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      clearFormErrors();
      setLoading('btn-login', true);
      await new Promise(r => setTimeout(r, 550));
      try {
        login(email, password);
        const user = getSession();
        showToast(user?.isAdmin ? '⚙️ Bienvenido, Administrador' : `🎉 ¡Bienvenido de vuelta, ${user.name.split(' ')[0]}!`, 'success');
        const cb = successCallback;
        closeModal();
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('login-error', err.message);
      } finally {
        setLoading('btn-login', false);
      }
    });

    /* Register form */
    document.getElementById('register-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;
      clearFormErrors();
      if (password !== confirm) { showError('register-error', '⚠️ Las contraseñas no coinciden.'); return; }
      if (password.length < 8) { showError('register-error', '⚠️ La contraseña debe tener al menos 8 caracteres.'); return; }
      setLoading('btn-register', true);
      await new Promise(r => setTimeout(r, 750));
      try {
        register(name, email, password);
        showToast(`🎉 ¡Cuenta creada! Bienvenido, ${name.split(' ')[0]}`, 'success');
        const cb = successCallback;
        closeModal();
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('register-error', err.message);
      } finally {
        setLoading('btn-register', false);
      }
    });

    /* Recovery modal */
    document.getElementById('recovery-modal-close')?.addEventListener('click', closeRecovery);
    document.getElementById('recovery-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeRecovery();
    });
    document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
      closeRecovery(); openModal();
    });

    /* Recovery step 1 — send code */
    document.getElementById('recovery-email-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('recovery-email')?.value.trim();
      const errEl = document.getElementById('recovery-email-error');
      errEl?.setAttribute('hidden', '');
      const btn = document.getElementById('btn-send-code');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando…'; }
      await new Promise(r => setTimeout(r, 900));
      try {
        const code = sendRecoveryCode(email);
        // Mostrar email en step 2
        const dispEl = document.getElementById('recovery-email-display');
        if (dispEl) dispEl.textContent = email;
        // Mostrar código (modo demo)
        const codeBox = document.getElementById('demo-code-box');
        if (codeBox) codeBox.textContent = code;
        showRecoveryStep(2);
        setTimeout(() => document.getElementById('recovery-code-input')?.focus(), 200);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.removeAttribute('hidden'); }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar código'; }
      }
    });

    /* Recovery step 2 — verify code */
    document.getElementById('recovery-code-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const code  = document.getElementById('recovery-code-input')?.value.trim();
      const errEl = document.getElementById('recovery-code-error');
      errEl?.setAttribute('hidden', '');
      await new Promise(r => setTimeout(r, 400));
      try {
        verifyCode(code);
        showRecoveryStep(3);
        setTimeout(() => document.getElementById('recovery-new-password')?.focus(), 200);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.removeAttribute('hidden'); }
      }
    });

    /* Recovery step 3 — new password */
    document.getElementById('recovery-password-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const newPass  = document.getElementById('recovery-new-password')?.value;
      const confPass = document.getElementById('recovery-confirm-password')?.value;
      const errEl    = document.getElementById('recovery-password-error');
      errEl?.setAttribute('hidden', '');
      await new Promise(r => setTimeout(r, 500));
      try {
        changePassword(newPass, confPass);
        showRecoveryStep(4);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.removeAttribute('hidden'); }
      }
    });

    /* Recovery step 4 — go to login */
    document.getElementById('btn-recovery-go-login')?.addEventListener('click', () => {
      closeRecovery();
      showToast('✅ Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
      openModal();
    });

    /* Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); closeRecovery(); }
    });
  }

  return { init, requireAuth, isLoggedIn, getCurrentUser, logout, openModal, closeModal, switchTabPublic };
})();

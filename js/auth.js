/* ============================================================
   MEDISUPPLY — AUTH MODULE
   - Registro / Login con Firebase Auth
   - Recuperación de contraseña con tokens seguros de Firebase
   - Perfil de usuario almacenado en Firestore
   ============================================================ */

const Auth = (() => {
  const ADMIN_EMAIL    = 'admin@medisupply.com';
  const ADMIN_PASSWORD = 'Admin2024';

  let successCallback = null;
  let currentUser = null;
  let pendingResetActionCode = null;
  let pendingResetEmail = null;
  let firebaseReady = false;
  let firebaseAuth = null;
  let firebaseDb = null;
  let authStateListeners = [];

  function initFirebase() {
    if (firebaseReady) return { auth: firebaseAuth, db: firebaseDb };

    if (!window.firebase?.apps?.length) {
      const firebaseConfig = {
        apiKey: 'AIzaSyBPo10S3oQ0yGewYsi-PBu4nezYbzG4vcI',
        authDomain: 'insumosmedicos-3079b.firebaseapp.com',
        projectId: 'insumosmedicos-3079b',
        storageBucket: 'insumosmedicos-3079b.firebasestorage.app',
        messagingSenderId: '907574552390',
        appId: '1:907574552390:web:f721cc992132156733a747'
      };
      window.firebase.initializeApp(firebaseConfig);
    }

    firebaseAuth = window.firebase.auth();
    firebaseDb = window.firebase.firestore();
    firebaseReady = true;

    return { auth: firebaseAuth, db: firebaseDb };
  }

  function getFirebaseAuth() { return initFirebase().auth; }
  function getFirestore() { return initFirebase().db; }

  async function loadUserProfile(firebaseUser) {
    if (!firebaseUser) {
      currentUser = null;
      return null;
    }

    const doc = await getFirestore().collection('users').doc(firebaseUser.uid).get();
    const stored = doc.exists ? doc.data() : {};
    const profile = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      name: stored.name || firebaseUser.displayName || 'Usuario',
      email: (stored.email || firebaseUser.email || '').toLowerCase().trim(),
      isAdmin: Boolean(stored.isAdmin),
      createdAt: stored.createdAt || firebaseUser.metadata?.creationTime || new Date().toISOString(),
    };
    currentUser = profile;
    return profile;
  }

  async function syncAuthState() {
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) {
      currentUser = null;
      updateHeaderUI();
      return null;
    }

    const profile = await loadUserProfile(firebaseUser);
    updateHeaderUI();
    return profile;
  }

  function getCurrentUser() { return currentUser; }
  function isLoggedIn() { return Boolean(currentUser); }

  function notifyAuthStateListeners(user) {
    authStateListeners.forEach(listener => {
      try { listener(user); } catch (err) { console.error('Auth listener error:', err); }
    });
  }

  function onAuthStateChanged(callback) {
    authStateListeners.push(callback);
    return () => {
      authStateListeners = authStateListeners.filter(listener => listener !== callback);
    };
  }

  function updateHeaderUI() {
    const user = getCurrentUser();
    const label = document.getElementById('user-label');
    const btn = document.getElementById('user-btn');
    const adminBtn = document.getElementById('admin-btn');

    if (label) {
      label.textContent = user ? `👋 ${String(user.name || 'Usuario').split(' ')[0]}` : 'Iniciar sesión';
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

  async function register(name, email, password) {
    const auth = getFirebaseAuth();
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    await credential.user.updateProfile({ displayName: name.trim() });

    const profile = {
      uid: credential.user.uid,
      id: credential.user.uid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      role: 'customer'
    };

    await getFirestore().collection('users').doc(credential.user.uid).set(profile, { merge: true });
    currentUser = profile;
    updateHeaderUI();
    return profile;
  }

  async function login(email, password) {
    const auth = getFirebaseAuth();
    const credential = await auth.signInWithEmailAndPassword(email, password);
    const profile = await loadUserProfile(credential.user);
    updateHeaderUI();
    return profile;
  }

  async function logout() {
    try {
      await getFirebaseAuth().signOut();
    } finally {
      currentUser = null;
      updateHeaderUI();
      showToast('👋 Sesión cerrada. ¡Hasta pronto!', 'info');
    }
  }

  function requireAuth(onSuccess) {
    if (isLoggedIn()) { onSuccess?.(); return; }
    successCallback = onSuccess;
    openModal();
  }

  function openModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchTab('login');
    setTimeout(() => document.getElementById('login-email')?.focus(), 200);
  }

  function openRegister() {
    openModal();
    switchTab('register');
  }

  function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    successCallback = null;
    clearFormErrors();
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin);
    document.getElementById('login-screen')?.[isLogin ? 'removeAttribute' : 'setAttribute']('hidden', '');
    document.getElementById('register-screen')?.[isLogin ? 'setAttribute' : 'removeAttribute']('hidden', '');
    clearFormErrors();
    setTimeout(() => {
      (isLogin ? document.getElementById('login-email') : document.getElementById('reg-name'))?.focus();
    }, 80);
  }

  function switchTabPublic(tab) { switchTab(tab); }

  function clearFormErrors() {
    ['login-error', 'register-error', 'recovery-email-error', 'recovery-code-error', 'recovery-password-error'].forEach(id => {
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

  function showToastMessage(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }

  function openRecovery() {
    closeModal();
    const modal = document.getElementById('recovery-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showRecoveryStep(pendingResetActionCode ? 3 : 1);
    const emailInput = document.getElementById('recovery-email');
    if (emailInput) {
      emailInput.value = pendingResetEmail || '';
    }
    setTimeout(() => emailInput?.focus(), 200);
  }

  function closeRecovery() {
    const modal = document.getElementById('recovery-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    pendingResetActionCode = null;
    pendingResetEmail = null;
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

    document.querySelectorAll('.rprogress-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i + 1 === step);
      dot.classList.toggle('done', i + 1 < step);
    });
  }

  async function sendRecoveryLink(email) {
    const auth = getFirebaseAuth();
    const normalizedEmail = email.toLowerCase().trim();
    const actionCodeSettings = {
      url: `${window.location.href.split('#')[0].split('?')[0]}?mode=resetPassword&email=${encodeURIComponent(normalizedEmail)}`,
      handleCodeInApp: false
    };

    await auth.sendPasswordResetEmail(normalizedEmail, actionCodeSettings);
    pendingResetEmail = normalizedEmail;
    return normalizedEmail;
  }

  async function confirmPasswordReset(newPass, confirm) {
    if (newPass !== confirm) throw new Error('Las contraseñas no coinciden.');
    if (newPass.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    if (!pendingResetActionCode) throw new Error('El enlace de recuperación ya no es válido. Solicita uno nuevo.');

    const auth = getFirebaseAuth();
    await auth.confirmPasswordReset(pendingResetActionCode, newPass);
    pendingResetActionCode = null;
    pendingResetEmail = null;
  }

  function handlePasswordResetLink() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const code = params.get('oobCode');

    if (mode !== 'resetPassword' || !code) return false;

    pendingResetActionCode = code;
    pendingResetEmail = params.get('email') || '';
    openRecovery();
    showRecoveryStep(3);

    const title = document.getElementById('recovery-modal-title');
    if (title) title.textContent = 'Establecer nueva contraseña';

    const help = document.getElementById('recovery-email-display');
    if (help) help.textContent = pendingResetEmail || 'tu correo';

    return true;
  }

  function init() {
    updateHeaderUI();
    initFirebase();
    getFirebaseAuth().onAuthStateChanged(async user => {
      if (user) {
        try {
          await loadUserProfile(user);
        } catch (error) {
          console.error('Firebase auth state error:', error);
          currentUser = null;
        }
      } else {
        currentUser = null;
      }
      updateHeaderUI();
      notifyAuthStateListeners(currentUser);
    });

    handlePasswordResetLink();

    document.getElementById('user-btn')?.addEventListener('click', () => {
      isLoggedIn() ? logout() : openModal();
    });

    document.getElementById('auth-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('auth-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('tab-login')?.addEventListener('click', e => {
      e.preventDefault();
      switchTab('login');
    });
    document.getElementById('tab-register')?.addEventListener('click', e => {
      e.preventDefault();
      switchTab('register');
    });

    document.getElementById('btn-forgot-password')?.addEventListener('click', openRecovery);

    document.querySelectorAll('.btn-show-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? '👁' : '🙈';
      });
    });

    document.getElementById('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      clearFormErrors();
      if (!email) { showError('login-error', 'Ingresa tu correo electrónico.'); return; }
      if (!validateEmail(email)) { showError('login-error', 'Ingresa un correo electrónico válido.'); return; }
      if (!password) { showError('login-error', 'Ingresa tu contraseña.'); return; }
      setLoading('btn-login', true);
      try {
        const user = await login(email, password);
        showToastMessage(user?.isAdmin ? '⚙️ Bienvenido, Administrador' : `🎉 ¡Bienvenido de vuelta, ${String(user?.name || 'Usuario').split(' ')[0]}!`, 'success');
        const cb = successCallback;
        closeModal();
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('login-error', err.message || 'No se pudo iniciar sesión.');
      } finally {
        setLoading('btn-login', false);
      }
    });

    document.getElementById('register-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;
      clearFormErrors();
      if (!name) { showError('register-error', 'Ingresa tu nombre completo.'); return; }
      if (!email) { showError('register-error', 'Ingresa tu correo electrónico.'); return; }
      if (!validateEmail(email)) { showError('register-error', 'Ingresa un correo electrónico válido.'); return; }
      if (password !== confirm) { showError('register-error', '⚠️ Las contraseñas no coinciden.'); return; }
      if (password.length < 8) { showError('register-error', '⚠️ La contraseña debe tener al menos 8 caracteres.'); return; }
      setLoading('btn-register', true);
      try {
        const user = await register(name, email, password);
        showToastMessage(`🎉 ¡Cuenta creada! Bienvenido, ${String(user?.name || name).split(' ')[0]}`, 'success');
        const cb = successCallback;
        closeModal();
        successCallback = null;
        cb?.();
      } catch (err) {
        showError('register-error', err.message || 'No se pudo crear la cuenta.');
      } finally {
        setLoading('btn-register', false);
      }
    });

    document.getElementById('recovery-modal-close')?.addEventListener('click', closeRecovery);
    document.getElementById('recovery-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeRecovery();
    });
    document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
      closeRecovery();
      openModal();
    });

    document.getElementById('recovery-email-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('recovery-email')?.value.trim();
      const errEl = document.getElementById('recovery-email-error');
      errEl?.setAttribute('hidden', '');
      const btn = document.getElementById('btn-send-code');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando…'; }
      try {
        await sendRecoveryLink(email);
        const dispEl = document.getElementById('recovery-email-display');
        if (dispEl) dispEl.textContent = email;
        showRecoveryStep(4);
        showToastMessage('📧 Revisa tu correo para abrir el enlace seguro de recuperación.', 'info');
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'No se pudo enviar el enlace de recuperación.'; errEl.removeAttribute('hidden'); }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar enlace'; }
      }
    });

    document.getElementById('recovery-password-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const newPass = document.getElementById('recovery-new-password')?.value;
      const confPass = document.getElementById('recovery-confirm-password')?.value;
      const errEl = document.getElementById('recovery-password-error');
      errEl?.setAttribute('hidden', '');
      try {
        await confirmPasswordReset(newPass, confPass);
        showRecoveryStep(4);
        showToastMessage('✅ Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'No se pudo cambiar la contraseña.'; errEl.removeAttribute('hidden'); }
      }
    });

    document.getElementById('btn-recovery-go-login')?.addEventListener('click', () => {
      closeRecovery();
      openModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); closeRecovery(); }
    });
  }

  return { init, requireAuth, isLoggedIn, getCurrentUser, logout, openModal, openRegister, closeModal, switchTabPublic, onAuthStateChanged };
})();

window.Auth = Auth;

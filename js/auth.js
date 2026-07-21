/* ============================================================
   MEDISUPPLY - AUTH MODULE
   Firebase Auth + Firestore user profile
   ============================================================ */

const Auth = (() => {
  const REDIRECT_KEY = 'medisupply-auth-redirect';
  const INTENT_KEY = 'medisupply-auth-intent';

  let currentUser = null;
  let authStateListeners = [];
  let initialized = false;

  function getAuth() {
    if (typeof window.getFirebaseAuth === 'function') return window.getFirebaseAuth();
    if (window.auth) return window.auth;
    throw new Error('Firebase Auth no esta disponible.');
  }

  function getDb() {
    if (typeof window.getFirestoreDb === 'function') return window.getFirestoreDb();
    if (window.db) return window.db;
    throw new Error('Firestore no esta disponible.');
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

  function isFirestorePermissionError(error) {
    return error?.code === 'permission-denied'
      || /Missing or insufficient permissions/i.test(error?.message || '');
  }

  function buildBasicProfile(firebaseUser, stored = {}) {
    return {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      name: stored.name || firebaseUser.displayName || 'Usuario',
      email: (stored.email || firebaseUser.email || '').toLowerCase().trim(),
      isAdmin: Boolean(stored.isAdmin),
      role: stored.role || 'customer',
      createdAt: stored.createdAt || firebaseUser.metadata?.creationTime || new Date().toISOString(),
    };
  }

  async function loadUserProfile(firebaseUser) {
    if (!firebaseUser) {
      currentUser = null;
      return null;
    }

    let profile;
    try {
      const snapshot = await getDb().collection('users').doc(firebaseUser.uid).get();
      const stored = snapshot.exists ? snapshot.data() : {};
      profile = buildBasicProfile(firebaseUser, stored);
    } catch (error) {
      if (!isFirestorePermissionError(error)) throw error;
      console.warn('No se pudo leer el perfil en Firestore. Se usara el usuario autenticado.', error);
      profile = buildBasicProfile(firebaseUser);
    }

    currentUser = profile;
    return profile;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validatePasswordPolicy(password) {
    if (String(password || '').length < 8) {
      return 'La contrasena debe tener al menos 8 caracteres.';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contrasena debe incluir al menos una letra minuscula.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contrasena debe incluir al menos una letra mayuscula.';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contrasena debe incluir al menos un numero.';
    }
    return '';
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.removeAttribute('hidden');
  }

  function clearError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  function clearFormErrors() {
    [
      'login-error',
      'register-error',
      'recovery-email-error',
      'recovery-password-error',
    ].forEach(clearError);
  }

  function setLoading(btnId, loading, defaultLabel) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Procesando...' : defaultLabel;
  }

  function showToastMessage(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }

  function updateHeaderUI() {
    const user = getCurrentUser();
    const label = document.getElementById('user-label');
    const btn = document.getElementById('user-btn');

    if (label) {
      label.textContent = user ? `Hola, ${String(user.name || 'Usuario').split(' ')[0]}` : 'Iniciar sesion';
    }
    if (btn) {
      btn.title = user ? `${user.email} - Clic para cerrar sesion` : 'Iniciar sesion';
    }
  }

  function buildRedirectUrl(defaultUrl = 'index.html') {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || sessionStorage.getItem(REDIRECT_KEY) || defaultUrl;
  }

  function goToAuthPage(page) {
    const current = `${window.location.pathname}${window.location.search}`;
    sessionStorage.setItem(REDIRECT_KEY, current || 'index.html');
    window.location.href = page;
  }

  function openModal() {
    goToAuthPage('login.html');
  }

  function openRegister() {
    goToAuthPage('register.html');
  }

  function closeModal() {
    clearFormErrors();
  }

  function switchTabPublic(tab) {
    window.location.href = tab === 'register' ? 'register.html' : 'login.html';
  }

  function requireAuth(onSuccess) {
    if (isLoggedIn()) {
      onSuccess?.();
      return;
    }
    sessionStorage.setItem(REDIRECT_KEY, 'index.html');
    window.location.href = 'login.html';
  }

  async function register(name, email, password) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const credential = await getAuth().createUserWithEmailAndPassword(normalizedEmail, password);
    await credential.user.updateProfile({ displayName: name.trim() });
    await credential.user.getIdToken(true);

    let profile = {
      uid: credential.user.uid,
      id: credential.user.uid,
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await getDb().collection('users').doc(credential.user.uid).set(profile, { merge: true });
    } catch (error) {
      if (!isFirestorePermissionError(error)) throw error;
      console.warn('La cuenta fue creada, pero Firestore rechazo guardar el perfil.', error);
      showToastMessage(
        'La cuenta fue creada. Falta publicar las reglas de Firestore para guardar el perfil.',
        'warning'
      );
      profile = buildBasicProfile(credential.user, profile);
    }

    currentUser = profile;
    updateHeaderUI();
    notifyAuthStateListeners(currentUser);
    return profile;
  }

  async function login(email, password) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const credential = await getAuth().signInWithEmailAndPassword(normalizedEmail, password);
    const profile = await loadUserProfile(credential.user);
    updateHeaderUI();
    notifyAuthStateListeners(currentUser);
    return profile;
  }

  async function logout() {
    try {
      await getAuth().signOut();
    } finally {
      currentUser = null;
      updateHeaderUI();
      notifyAuthStateListeners(null);
      showToastMessage('Sesion cerrada. Hasta pronto.', 'info');
    }
  }

  async function sendRecoveryLink(email) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!validateEmail(normalizedEmail)) {
      throw new Error('Ingresa un correo electronico valido.');
    }

    const baseUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}reset-password.html`;
    await getAuth().sendPasswordResetEmail(normalizedEmail, {
      url: baseUrl,
      handleCodeInApp: false,
    });
    return normalizedEmail;
  }

  async function verifyResetToken(code) {
    if (!code) throw new Error('El token de recuperacion no esta presente.');
    return getAuth().verifyPasswordResetCode(code);
  }

  async function confirmPasswordReset(code, newPass, confirm) {
    if (!code) throw new Error('El token de recuperacion no esta presente.');
    if (newPass !== confirm) throw new Error('Las contrasenas no coinciden.');
    const policyError = validatePasswordPolicy(newPass);
    if (policyError) throw new Error(policyError);
    await getAuth().confirmPasswordReset(code, newPass);
  }

  function bindPasswordButtons() {
    document.querySelectorAll('.btn-show-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? 'Mostrar' : 'Ocultar';
      });
    });
  }

  function bindLoginPage() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearFormErrors();

      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value || '';

      if (!validateEmail(email)) {
        showError('login-error', 'Ingresa un correo electronico valido.');
        return;
      }
      if (!password) {
        showError('login-error', 'Ingresa tu contrasena.');
        return;
      }

      setLoading('btn-login', true, 'Iniciar sesion');
      try {
        await login(email, password);
        const redirect = buildRedirectUrl('index.html');
        sessionStorage.removeItem(REDIRECT_KEY);
        window.location.href = redirect;
      } catch (err) {
        showError('login-error', err.message || 'No se pudo iniciar sesion.');
      } finally {
        setLoading('btn-login', false, 'Iniciar sesion');
      }
    });

    document.getElementById('btn-forgot-password')?.addEventListener('click', async () => {
      clearFormErrors();
      const email = document.getElementById('login-email')?.value.trim();
      const btn = document.getElementById('btn-forgot-password');
      if (btn) btn.disabled = true;
      try {
        const sentTo = await sendRecoveryLink(email);
        showToastMessage(`Revisa ${sentTo} para abrir el enlace seguro de recuperacion.`, 'info');
      } catch (err) {
        showError('login-error', err.message || 'No se pudo enviar el enlace de recuperacion.');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function bindRegisterPage() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearFormErrors();

      const name = document.getElementById('reg-name')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const password = document.getElementById('reg-password')?.value || '';
      const confirm = document.getElementById('reg-confirm')?.value || '';

      if (!name) {
        showError('register-error', 'Ingresa tu nombre completo.');
        return;
      }
      if (!validateEmail(email)) {
        showError('register-error', 'Ingresa un correo electronico valido.');
        return;
      }
      if (password !== confirm) {
        showError('register-error', 'Las contrasenas no coinciden.');
        return;
      }
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        showError('register-error', policyError);
        return;
      }

      setLoading('btn-register', true, 'Crear cuenta');
      try {
        await register(name, email, password);
        const redirect = buildRedirectUrl('index.html');
        sessionStorage.removeItem(REDIRECT_KEY);
        window.location.href = redirect;
      } catch (err) {
        showError('register-error', err.message || 'No se pudo crear la cuenta.');
      } finally {
        setLoading('btn-register', false, 'Crear cuenta');
      }
    });
  }

  async function bindResetPasswordPage() {
    const form = document.getElementById('recovery-password-form');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    const emailDisplay = document.getElementById('recovery-email-display');
    const submit = document.getElementById('btn-reset-password');

    try {
      const email = await verifyResetToken(code);
      if (emailDisplay) emailDisplay.textContent = email;
      if (submit) submit.disabled = false;
    } catch (err) {
      showError('recovery-password-error', 'El token es invalido o ha expirado. Solicita un nuevo enlace.');
      if (submit) submit.disabled = true;
      return;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearFormErrors();
      const newPass = document.getElementById('recovery-new-password')?.value || '';
      const confirm = document.getElementById('recovery-confirm-password')?.value || '';

      if (submit) submit.disabled = true;
      try {
        await confirmPasswordReset(code, newPass, confirm);
        showToastMessage('Contrasena actualizada. Ya puedes iniciar sesion.', 'success');
        window.location.href = 'login.html';
      } catch (err) {
        showError('recovery-password-error', err.message || 'No se pudo cambiar la contrasena.');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  function bindHeader() {
    document.getElementById('user-btn')?.addEventListener('click', () => {
      isLoggedIn() ? logout() : openModal();
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;

    getAuth().onAuthStateChanged(async firebaseUser => {
      try {
        currentUser = firebaseUser ? await loadUserProfile(firebaseUser) : null;
      } catch (error) {
        console.error('Firebase auth state error:', error);
        currentUser = null;
      }
      updateHeaderUI();
      notifyAuthStateListeners(currentUser);
    });

    updateHeaderUI();
    bindHeader();
    bindPasswordButtons();
    bindLoginPage();
    bindRegisterPage();
    bindResetPasswordPage();
  }

  return {
    init,
    requireAuth,
    isLoggedIn,
    getCurrentUser,
    logout,
    openModal,
    openRegister,
    closeModal,
    switchTabPublic,
    onAuthStateChanged,
    validatePasswordPolicy,
  };
})();

window.Auth = Auth;

/* ============================================================
   MEDISUPPLY - FIREBASE CONFIG
   Fuente unica de configuracion e inicializacion Firebase.
   ============================================================ */

const firebaseConfig = {
  apiKey: 'AIzaSyBPo10S3oQ0yGewYsi-PBu4nezYbzG4vcI',
  authDomain: 'insumosmedicos-3079b.firebaseapp.com',
  projectId: 'insumosmedicos-3079b',
  storageBucket: 'insumosmedicos-3079b.firebasestorage.app',
  messagingSenderId: '907574552390',
  appId: '1:907574552390:web:f721cc992132156733a747',
};

if (typeof firebase === 'undefined') {
  throw new Error('Firebase SDK no se cargo correctamente.');
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.firebaseApp = firebase.app();
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

window.getFirebaseAuth = function getFirebaseAuth() {
  return window.auth;
};

window.getFirestoreDb = function getFirestoreDb() {
  return window.db;
};

window.getFirebaseStorage = function getFirebaseStorage() {
  return window.storage;
};

console.info('Firebase inicializado correctamente.');

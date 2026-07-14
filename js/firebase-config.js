// js/firebase-config.js
// Firebase SDK Configuration (Compat version for non-module usage)

const firebaseConfig = {
  apiKey: "AIzaSyBPo10S3oQ0yGewYsi-PBu4nezYbzG4vcI",
  authDomain: "insumosmedicos-3079b.firebaseapp.com",
  projectId: "insumosmedicos-3079b",
  storageBucket: "insumosmedicos-3079b.firebasestorage.app",
  messagingSenderId: "907574552390",
  appId: "1:907574552390:web:f721cc992132156733a747"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  console.info("✅ Firebase SDK configurado.");
} else {
  console.error("❌ Firebase SDK no se cargó correctamente.");
}

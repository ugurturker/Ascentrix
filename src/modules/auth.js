// auth.js — Google Auth + state
import { auth, isFirebaseConfigured } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

let currentUser = null;
const listeners = new Set();

function notify() { listeners.forEach(fn => { try { fn(currentUser); } catch(_){} }); }

export function getCurrentUser() { return currentUser; }
export function isAuthenticated() { return Boolean(currentUser); }
export function onAuthChange(fn) {
  listeners.add(fn);
  try { fn(currentUser); } catch(_){}
  return () => listeners.delete(fn);
}

export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase yapılandırılmadı — .env doldur ve rebuild et');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutUser() {
  if (!isFirebaseConfigured || !auth) return;
  await signOut(auth);
}

// Firebase auth state -> local currentUser + notify
if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    notify();
    // Dispatch global event for legacy code
    try { window.dispatchEvent(new CustomEvent('ascentrix-auth', { detail: { user } })); } catch(_){}
  });
} else {
  // No-op: always null
}

// Expose for legacy HTML onclick
try {
  if (typeof window !== 'undefined') {
    window.AscentrixAuth = { signInWithGoogle, signOutUser, getCurrentUser, isAuthenticated, onAuthChange };
  }
} catch(_){}

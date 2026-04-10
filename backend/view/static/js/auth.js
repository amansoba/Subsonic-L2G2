/**
 * auth.js — Firebase Authentication helpers for Subsonic.
 *
 * Uses Firebase JS SDK (loaded via CDN in index.html).
 * Exports pure functions; no DOM manipulation.
 */

import { firebaseConfig } from './firebase-config.js';

/* global firebase */
// Firebase is loaded from CDN and available as a global.

// Initialise once — safe to call multiple times.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

/* ---------- Email / Password ---------- */

/**
 * Create a new user with email + password.
 * @returns {Promise<firebase.auth.UserCredential>}
 */
export async function registerWithEmail(email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

/**
 * Sign in an existing user with email + password.
 * @returns {Promise<firebase.auth.UserCredential>}
 */
export async function loginWithEmail(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

/* ---------- Google Sign-In ---------- */

/**
 * Sign in with a Google popup.
 * @returns {Promise<firebase.auth.UserCredential>}
 */
export async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

/* ---------- Session helpers ---------- */

/**
 * Sign out the current user.
 */
export async function logout() {
  return auth.signOut();
}

/**
 * Get the current user's Firebase ID token (JWT).
 * Returns ``null`` when no user is signed in.
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string|null>}
 */
export async function getIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

/**
 * Listen for auth-state changes (login / logout).
 * @param {(user: firebase.User | null) => void} callback
 * @returns {firebase.Unsubscribe}
 */
export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * Return the currently signed-in Firebase user (or null).
 */
export function getCurrentUser() {
  return auth.currentUser;
}

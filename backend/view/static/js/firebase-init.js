/**
 * Firebase initialization (non-module, uses compat SDK global).
 * Must be loaded AFTER the Firebase CDN scripts and BEFORE app.js.
 */
if (typeof firebase !== 'undefined') {
  firebase.initializeApp({
    apiKey:            "AIzaSyBktPZCHs2L1S8Yzer3Y0mbUT5fmPMW02k",
    authDomain:        "proyectosubsonic.firebaseapp.com",
    projectId:         "proyectosubsonic",
    storageBucket:     "proyectosubsonic.firebasestorage.app",
    messagingSenderId: "720408946633",
    appId:             "1:720408946633:web:a537c996b0e0cc0dbfaa18",
  });
}

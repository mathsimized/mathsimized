const firebaseConfig = {
  apiKey: "AIzaSyBwqJ5NLVjW4hyv50lMF9Z5-Sceklczc7M",
  authDomain: "mathsimized-e4ff0.firebaseapp.com",
  projectId: "mathsimized-e4ff0",
  storageBucket: "mathsimized-e4ff0.firebasestorage.app",
  messagingSenderId: "665303048442",
  appId: "1:665303048442:web:27a4e833cf0645e5582943",
  measurementId: "G-BCEZZMLBHC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

const ADMIN_EMAIL = 'mathsimized@gmail.com';

// Load EmailJS SDK
(function() {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload = initEmailJS;
  document.head.appendChild(s);
})();

const EMAILJS_PUBLIC_KEY = '';
const EMAILJS_SERVICE_ID = '';
const EMAILJS_WELCOME_TEMPLATE = '';
const EMAILJS_RESET_TEMPLATE = '';

function initEmailJS() {
  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
}

async function sendWelcomeEmail(email, username) {
  if (!EMAILJS_PUBLIC_KEY) return;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE, {
      to_email: email,
      username: username,
      site_url: window.location.origin
    });
  } catch (e) {
    console.error('Welcome email failed:', e);
  }
}

// Auth state
let currentUser = null;
let currentUsername = null;

auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        currentUsername = doc.data().username;
      } else {
        // Fallback: old accounts have random doc IDs, look up by email
        const snap = await db.collection('users').where('email', '==', user.email).get();
        currentUsername = snap.empty ? null : snap.docs[0].data().username;
      }
    } catch (e) {
      currentUsername = null;
    }
    currentUser = {
      uid: user.uid,
      email: user.email,
      isAdmin: user.email === ADMIN_EMAIL
    };
  } else {
    currentUser = null;
    currentUsername = null;
  }
  updateNavbarUI();
  window.dispatchEvent(new CustomEvent('authStateChanged', {
    detail: { user: currentUser, username: currentUsername }
  }));
});

document.addEventListener('click', (e) => {
  const dropdown = e.target.closest('.dropdown > a');
  if (dropdown && window.innerWidth <= 768) {
    const parent = dropdown.parentElement;
    parent.classList.toggle('open');
    e.preventDefault();
  }
});

function updateNavbarUI() {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  if (currentUser) {
    const displayName = currentUsername || currentUser.email;
    const isAdmin = currentUser.email === ADMIN_EMAIL;
    let adminBtn = '';
    if (isAdmin) {
      adminBtn = `<a href="./admin.html" class="btn btn-sm btn-accent">Admin</a>`;
    }
    navAuth.innerHTML = `
      ${adminBtn}
      <a href="./dashboard.html" class="btn btn-sm btn-primary" style="margin:0 6px;">${escapeHtml(displayName)}</a>
      <button class="btn btn-sm btn-outline" onclick="logoutUser()">Logout</button>
    `;
  } else {
    navAuth.innerHTML = `
      <a href="./login.html" class="btn btn-sm btn-outline">Login</a>
      <a href="./signup.html" class="btn btn-sm btn-primary">Sign Up</a>
    `;
  }
}

async function signupUser(email, password, username) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  const cred = await auth.createUserWithEmailAndPassword(normalizedEmail, password);
  const uid = cred.user.uid;

  await db.collection('users').doc(uid).set({
    uid,
    username: normalizedUsername,
    email: normalizedEmail,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  try {
    await cred.user.sendEmailVerification();
  } catch (e) {
    console.error('Failed to send verification email:', e);
  }

  sendWelcomeEmail(normalizedEmail, normalizedUsername);
  return uid;
}

async function loginUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  await auth.signInWithEmailAndPassword(normalizedEmail, password);
}

async function logoutUser() {
  await auth.signOut();
  window.location.href = './';
}

async function checkUsernameAvailability(username) {
  const normalized = username.toLowerCase().trim();
  if (!normalized) return { available: false, error: 'Username is required' };
  if (normalized.length < 3) return { available: false, error: 'Username must be at least 3 characters' };
  if (!/^[a-z0-9_]+$/.test(normalized)) return { available: false, error: 'Only lowercase letters, numbers, and underscores' };
  try {
    const snapshot = await db.collection('users').where('username', '==', normalized).get();
    return { available: snapshot.empty, error: snapshot.empty ? null : 'Username already taken' };
  } catch (e) {
    return { available: false, error: 'Error checking username' };
  }
}

async function checkEmailExists(email) {
  const normalized = email.toLowerCase().trim();
  try {
    const snapshot = await db.collection('users').where('email', '==', normalized).get();
    return !snapshot.empty;
  } catch {
    return false;
  }
}

function requireAdmin(redirectTo = './') {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Password Reset (Firebase Auth) ───
async function requestPasswordReset(email) {
  await auth.sendPasswordResetEmail(email);
}

async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  if (user.emailVerified) throw new Error('Email already verified');
  await user.sendEmailVerification();
}

// ─── Score Functions ───
async function saveGameScore(userId, username, gameId, gameName, score) {
  const docId = `${userId}_${gameId}`;
  const scoreRef = db.collection('scores').doc(docId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(scoreRef);
    const existingBest = doc.exists ? (doc.data().bestScore || 0) : 0;

    if (score > existingBest) {
      tx.set(scoreRef, {
        userId,
        gameId,
        gameName: gameName || gameId,
        bestScore: score,
        lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  });

  await updateLeaderboardTotal(userId, username);
}

async function updateLeaderboardTotal(userId, username) {
  const scoresSnap = await db.collection('scores').where('userId', '==', userId).get();
  let totalScore = 0;
  scoresSnap.forEach(doc => { totalScore += doc.data().bestScore || 0; });

  await db.collection('leaderboard').doc(userId).set({
    userId,
    username: username || 'Unknown',
    totalScore,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function rebuildLeaderboard() {
  const scoresSnap = await db.collection('scores').get();
  const userTotals = {};
  scoresSnap.forEach(doc => {
    const d = doc.data();
    const uid = d.userId;
    if (!userTotals[uid]) userTotals[uid] = { userId: uid, username: d.username || uid, totalScore: 0, lastUpdated: null };
    userTotals[uid].totalScore += d.bestScore || 0;
    if (d.lastPlayed && (!userTotals[uid].lastUpdated || d.lastPlayed > userTotals[uid].lastUpdated)) {
      userTotals[uid].lastUpdated = d.lastPlayed;
    }
  });
  const batch = db.batch();
  for (const uid in userTotals) {
    const ref = db.collection('leaderboard').doc(uid);
    batch.set(ref, {
      userId: uid,
      username: userTotals[uid].username,
      totalScore: userTotals[uid].totalScore,
      lastUpdated: userTotals[uid].lastUpdated || firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  await batch.commit();
  return Object.keys(userTotals).length;
}

async function getUserTotalScore(userId) {
  try {
    const doc = await db.collection('leaderboard').doc(userId).get();
    if (doc.exists) return doc.data().totalScore || 0;
    // Fallback: compute from scores if leaderboard doc missing
    const scores = await getUserScores(userId);
    return scores.reduce((sum, s) => sum + (s.bestScore || 0), 0);
  } catch {
    return 0;
  }
}

async function getUserScores(userId) {
  try {
    const snap = await db.collection('scores').where('userId', '==', userId).get();
    const scores = [];
    snap.forEach(doc => scores.push(doc.data()));
    return scores;
  } catch {
    return [];
  }
}

// ─── PostMessage handler for game scores ───
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'MATHBLITZ_SCORE') {
    const { score, highScore, game: gameName } = event.data;
    const user = auth.currentUser;
    if (user && currentUsername) {
      const finalScore = score || highScore || 0;
      await saveGameScore(user.uid, currentUsername, 'mathblitz', gameName || 'Math Blitz', finalScore);
    }
  }
});

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// Export globals
if (typeof firebase !== 'undefined') {
  window.db = db;
  window.storage = storage;
  window.auth = auth;
  window.currentUserRef = () => currentUser;
  window.currentUsernameRef = () => currentUsername;
  window.checkUsernameAvailability = checkUsernameAvailability;
  window.checkEmailExists = checkEmailExists;
  window.signupUser = signupUser;
  window.loginUser = loginUser;
  window.logoutUser = logoutUser;
  window.formatDate = formatDate;
  window.formatFileSize = formatFileSize;
  window.escapeHtml = escapeHtml;
  window.requireAdmin = requireAdmin;
  window.requestPasswordReset = requestPasswordReset;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.resendVerificationEmail = resendVerificationEmail;
  window.saveGameScore = saveGameScore;
  window.updateLeaderboardTotal = updateLeaderboardTotal;
  window.getUserTotalScore = getUserTotalScore;
  window.getUserScores = getUserScores;
  window.rebuildLeaderboard = rebuildLeaderboard;
}

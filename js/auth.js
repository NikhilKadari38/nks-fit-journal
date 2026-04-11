// ============================================
// NK's Fit Journal — auth.js
// Custom username/password auth via Firestore
// Admin: nikhil (hardcoded, cannot be deleted)
// ============================================

const ADMIN_USERNAME = 'nikhil';

const Auth = (() => {

  // ── Password hashing (SHA-256 + salt) ──
  const hashPassword = async (password, salt) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password + 'nkfitjournal2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateSalt = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
  const generateToken = () => Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Date.now().toString(36);

  // ── Password validation ──
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
    if (!/[0-9]/.test(password)) errors.push('At least 1 number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('At least 1 special character (!@#$%^&* etc.)');
    return errors;
  };

  // ── Username validation ──
  const validateUsername = (username) => {
    const errors = [];
    if (username.length < 3) errors.push('At least 3 characters');
    if (username.length > 20) errors.push('Maximum 20 characters');
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) errors.push('Must start with a letter, only letters/numbers/underscore allowed');
    return errors;
  };

  // ── Session management ──
  const SESSION_KEY = 'nkj_auth_session';
  const SESSION_HOURS = 72; // 3 days

  const setSession = (username, token) => {
    const session = {
      username,
      token,
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const getSession = () => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!session) return null;
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch { return null; }
  };

  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  // ── Get current user ──
  const getCurrentUser = () => {
    const session = getSession();
    return session ? session.username : null;
  };

  const isAdmin = () => getCurrentUser() === ADMIN_USERNAME;

  // ── Auth guard — call on every protected page ──
  const requireAuth = () => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    // Async verify user still exists in Firebase (handles deleted accounts)
    verifyUserExists(user);
    return user;
  };

  // ── Verify user still exists in Firebase — force logout if deleted ──
  const verifyUserExists = async (username) => {
    try {
      const doc = await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(username.toLowerCase())
        .get();
      if (!doc.exists) {
        // User was deleted by admin — clear session and redirect
        clearSession();
        window.location.href = 'login.html?reason=deleted';
      }
    } catch (e) {
      // Network error — don't force logout, fail silently
      console.warn('Could not verify user session:', e);
    }
  };

  // ── Register new user ──
  const register = async (username, password, displayName) => {
    // Validate
    const usernameErrors = validateUsername(username);
    if (usernameErrors.length > 0) return { success: false, error: usernameErrors[0] };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) return { success: false, error: passwordErrors.join(', ') };

    const usernameLower = username.toLowerCase();

    try {
      // Check if username already taken
      const existing = await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(usernameLower).get();

      if (existing.exists) return { success: false, error: 'Username already taken. Choose another.' };

      // Hash password
      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const token = generateToken();

      // Save to Firestore
      await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(usernameLower).set({
          username: usernameLower,
          displayName: displayName || username,
          passwordHash: hash,
          salt,
          role: usernameLower === ADMIN_USERNAME ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          sessionToken: token
        });

      // Initialize default profile in user data
      await firebase.firestore()
        .collection('userData').doc(usernameLower)
        .collection('meta').doc('profile').set({
          name: displayName || username,
          username: usernameLower,
          createdAt: new Date().toISOString()
        });

      setSession(usernameLower, token);
      return { success: true, username: usernameLower };

    } catch (e) {
      console.error(e);
      return { success: false, error: 'Registration failed. Please check your internet connection.' };
    }
  };

  // ── Login ──
  const login = async (username, password) => {
    const usernameLower = username.toLowerCase().trim();
    if (!usernameLower) return { success: false, error: 'Please enter your username.' };
    if (!password) return { success: false, error: 'Please enter your password.' };

    try {
      const doc = await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(usernameLower).get();

      if (!doc.exists) return { success: false, error: 'Username not found. Please check or register.' };

      const data = doc.data();
      const hash = await hashPassword(password, data.salt);

      if (hash !== data.passwordHash) return { success: false, error: 'Incorrect password. Please try again.' };

      // Generate new session token
      const token = generateToken();
      await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(usernameLower)
        .update({ sessionToken: token, lastLogin: new Date().toISOString() });

      setSession(usernameLower, token);
      return { success: true, username: usernameLower };

    } catch (e) {
      console.error(e);
      return { success: false, error: 'Login failed. Please check your internet connection.' };
    }
  };

  // ── Logout ──
  const logout = () => {
    clearSession();
    // Clear local data cache too
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('nkj_'));
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  };

  // ── Admin: Get all users ──
  const getAllUsers = async () => {
    if (!isAdmin()) return [];
    try {
      const snap = await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').get();
      return snap.docs.map(doc => ({
        username: doc.data().username,
        displayName: doc.data().displayName,
        role: doc.data().role,
        createdAt: doc.data().createdAt,
        lastLogin: doc.data().lastLogin || '—'
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // ── Admin: Delete a user ──
  const deleteUser = async (username) => {
    if (!isAdmin()) return { success: false, error: 'Not authorized.' };
    if (username === ADMIN_USERNAME) return { success: false, error: 'Cannot delete admin account.' };

    try {
      const usernameLower = username.toLowerCase();

      // Delete auth record
      await firebase.firestore()
        .collection('auth').doc('users')
        .collection('accounts').doc(usernameLower).delete();

      // Delete all user data subcollections
      const collections = ['meta', 'foodlogs', 'weights', 'water'];
      for (const col of collections) {
        const snap = await firebase.firestore()
          .collection('userData').doc(usernameLower)
          .collection(col).get();
        const batch = firebase.firestore().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        if (snap.docs.length > 0) await batch.commit();
      }

      // Delete user document
      await firebase.firestore()
        .collection('userData').doc(usernameLower).delete();

      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Failed to delete user.' };
    }
  };

  return {
    register, login, logout,
    getCurrentUser, getSession, isAdmin, requireAuth,
    validatePassword, validateUsername,
    getAllUsers, deleteUser,
    ADMIN_USERNAME
  };
})();

window.Auth = Auth;

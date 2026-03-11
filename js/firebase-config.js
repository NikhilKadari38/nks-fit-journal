// ============================================
// NK's Fit Journal — firebase-config.js
// Firebase + Firestore fully wired
// Data strategy: Write to localStorage instantly (fast UI)
//                + sync to Firestore silently (cloud backup)
//                + on page load, pull latest from Firestore
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDTSc_gkA0kmx3T4n6IPBOsRC054v-6bWk",
  authDomain: "nk-s-fit-journal.firebaseapp.com",
  projectId: "nk-s-fit-journal",
  storageBucket: "nk-s-fit-journal.firebasestorage.app",
  messagingSenderId: "19421776291",
  appId: "1:19421776291:web:e1430c8cee3254a935f216"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Single user ID (expand for multi-user later)
const USER_ID = 'nikhil';
const userRef = () => db.collection('users').doc(USER_ID);

// ── Local cache prefix ──
const PREFIX = 'nkj_';

const local = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); }
    catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove: (key) => localStorage.removeItem(PREFIX + key),
  keys: (prefix) => Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX + (prefix || '')))
    .map(k => k.replace(PREFIX, ''))
};

// ── Firestore helpers ──
const cloud = {
  // Save to Firestore silently (don't block UI)
  set: async (collection, docId, data) => {
    try {
      await userRef().collection(collection).doc(docId).set(data, { merge: true });
    } catch (e) {
      console.warn('Cloud sync failed (offline?):', e.message);
    }
  },
  get: async (collection, docId) => {
    try {
      const doc = await userRef().collection(collection).doc(docId).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.warn('Cloud read failed:', e.message);
      return null;
    }
  },
  getAll: async (collection) => {
    try {
      const snap = await userRef().collection(collection).get();
      const result = {};
      snap.forEach(doc => result[doc.id] = doc.data());
      return result;
    } catch (e) {
      console.warn('Cloud getAll failed:', e.message);
      return {};
    }
  },
  delete: async (collection, docId) => {
    try {
      await userRef().collection(collection).doc(docId).delete();
    } catch (e) {
      console.warn('Cloud delete failed:', e.message);
    }
  }
};

// ── Full Firestore → localStorage sync on page load ──
const syncFromCloud = async () => {
  try {
    console.log('🔄 Syncing from Firebase...');

    // Profile
    const profile = await cloud.get('meta', 'profile');
    if (profile) local.set('profile', profile);

    // Settings
    const settings = await cloud.get('meta', 'settings');
    if (settings) local.set('settings', settings);

    // Custom foods
    const customFoods = await cloud.get('meta', 'customFoods');
    if (customFoods?.items) local.set('custom_foods', customFoods.items);

    // Food logs (all dates)
    const logs = await cloud.getAll('foodlogs');
    Object.entries(logs).forEach(([date, data]) => {
      if (data?.entries) local.set('foodlog_' + date, data.entries);
    });

    // Weights
    const weights = await cloud.getAll('weights');
    Object.entries(weights).forEach(([date, data]) => {
      local.set('weight_' + date, data);
    });

    // Water
    const water = await cloud.getAll('water');
    Object.entries(water).forEach(([date, data]) => {
      local.set('water_' + date, data);
    });

    console.log('✅ Firebase sync complete');
    return true;
  } catch (e) {
    console.warn('Sync from cloud failed, using local data:', e.message);
    return false;
  }
};

// ── NKStorage — write-through (local first + cloud backup) ──
const NKStorage = {

  // Profile
  getProfile: () => local.get('profile'),
  setProfile: (data) => {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    local.set('profile', payload);
    cloud.set('meta', 'profile', payload); // async, non-blocking
  },

  // Food Log
  getFoodLog: (date) => local.get('foodlog_' + date) || [],
  setFoodLog: (date, entries) => {
    local.set('foodlog_' + date, entries);
    cloud.set('foodlogs', date, { entries, updatedAt: new Date().toISOString() });
  },
  addFoodEntry: (date, entry) => {
    const entries = NKStorage.getFoodLog(date);
    const newEntry = { ...entry, id: Date.now().toString(), addedAt: new Date().toISOString() };
    entries.push(newEntry);
    NKStorage.setFoodLog(date, entries);
    return newEntry;
  },
  deleteFoodEntry: (date, entryId) => {
    const entries = NKStorage.getFoodLog(date).filter(e => e.id !== entryId);
    NKStorage.setFoodLog(date, entries);
  },
  getAllLogDates: () => local.keys('foodlog_')
    .filter(k => k.startsWith('foodlog_'))
    .map(k => k.replace('foodlog_', ''))
    .sort((a, b) => b.localeCompare(a)),

  // Weight
  getWeight: (date) => local.get('weight_' + date),
  setWeight: (date, kg) => {
    const payload = { kg, loggedAt: new Date().toISOString() };
    local.set('weight_' + date, payload);
    cloud.set('weights', date, payload);
  },
  getAllWeights: () => local.keys('weight_')
    .filter(k => k.startsWith('weight_'))
    .map(k => {
      const date = k.replace('weight_', '');
      const data = local.get(k);
      return { date, kg: data?.kg };
    })
    .filter(w => w.kg)
    .sort((a, b) => a.date.localeCompare(b.date)),

  // Water
  getWater: (date) => local.get('water_' + date) || { ml: 0 },
  setWater: (date, ml) => {
    const payload = { ml, updatedAt: new Date().toISOString() };
    local.set('water_' + date, payload);
    cloud.set('water', date, payload);
  },

  // Custom Foods
  getCustomFoods: () => local.get('custom_foods') || [],
  addCustomFood: (food) => {
    const foods = NKStorage.getCustomFoods();
    const newFood = { ...food, id: 'custom_' + Date.now(), isCustom: true };
    foods.push(newFood);
    local.set('custom_foods', foods);
    cloud.set('meta', 'customFoods', { items: foods, updatedAt: new Date().toISOString() });
    return newFood;
  },
  deleteCustomFood: (id) => {
    const foods = NKStorage.getCustomFoods().filter(f => f.id !== id);
    local.set('custom_foods', foods);
    cloud.set('meta', 'customFoods', { items: foods, updatedAt: new Date().toISOString() });
  },

  // Settings
  getSettings: () => local.get('settings') || { theme: 'light', workoutDays: [] },
  setSettings: (data) => {
    local.set('settings', data);
    cloud.set('meta', 'settings', data);
  },
  updateSettings: (patch) => {
    const current = NKStorage.getSettings();
    NKStorage.setSettings({ ...current, ...patch });
  },

  // Workout day toggle
  isWorkoutDay: (date) => (NKStorage.getSettings().workoutDays || []).includes(date),
  toggleWorkoutDay: (date) => {
    const settings = NKStorage.getSettings();
    const days = settings.workoutDays || [];
    const idx = days.indexOf(date);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(date);
    NKStorage.updateSettings({ workoutDays: days });
    return idx < 0;
  }
};

// Expose globally
window.NKStorage = NKStorage;
window.syncFromCloud = syncFromCloud;

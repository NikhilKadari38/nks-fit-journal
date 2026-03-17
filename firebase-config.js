// ============================================
// NK's Fit Journal — firebase-config.js
// Multi-user Firestore storage
// Each user's data stored under userData/{username}/
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDTSc_gkA0kmx3T4n6IPBOsRC054v-6bWk",
  authDomain: "nk-s-fit-journal.firebaseapp.com",
  projectId: "nk-s-fit-journal",
  storageBucket: "nk-s-fit-journal.firebasestorage.app",
  messagingSenderId: "19421776291",
  appId: "1:19421776291:web:e1430c8cee3254a935f216"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get current user's Firestore root
const userRef = () => {
  const username = Auth.getCurrentUser();
  if (!username) return null;
  return db.collection('userData').doc(username);
};

// Local cache prefix (per user)
const getPrefix = () => {
  const username = Auth.getCurrentUser();
  return username ? `nkj_${username}_` : 'nkj_guest_';
};

const local = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(getPrefix() + key)); }
    catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(getPrefix() + key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove: (key) => localStorage.removeItem(getPrefix() + key),
  keys: (prefix) => Object.keys(localStorage)
    .filter(k => k.startsWith(getPrefix() + (prefix || '')))
    .map(k => k.replace(getPrefix(), ''))
};

// Firestore helpers
const cloud = {
  set: async (collection, docId, data) => {
    try {
      const ref = userRef();
      if (!ref) return;
      await ref.collection(collection).doc(docId).set(data, { merge: true });
    } catch (e) { console.warn('Cloud sync failed:', e.message); }
  },
  get: async (collection, docId) => {
    try {
      const ref = userRef();
      if (!ref) return null;
      const doc = await ref.collection(collection).doc(docId).get();
      return doc.exists ? doc.data() : null;
    } catch (e) { console.warn('Cloud read failed:', e.message); return null; }
  },
  getAll: async (collection) => {
    try {
      const ref = userRef();
      if (!ref) return {};
      const snap = await ref.collection(collection).get();
      const result = {};
      snap.forEach(doc => result[doc.id] = doc.data());
      return result;
    } catch (e) { console.warn('Cloud getAll failed:', e.message); return {}; }
  },
  delete: async (collection, docId) => {
    try {
      const ref = userRef();
      if (!ref) return;
      await ref.collection(collection).doc(docId).delete();
    } catch (e) { console.warn('Cloud delete failed:', e.message); }
  }
};

// Sync from Firebase to localStorage on page load
const syncFromCloud = async () => {
  try {
    const profile = await cloud.get('meta', 'profile');
    if (profile) local.set('profile', profile);

    const settings = await cloud.get('meta', 'settings');
    if (settings) local.set('settings', settings);

    const customFoods = await cloud.get('meta', 'customFoods');
    if (customFoods?.items) local.set('custom_foods', customFoods.items);

    const logs = await cloud.getAll('foodlogs');
    Object.entries(logs).forEach(([date, data]) => {
      if (data?.entries) local.set('foodlog_' + date, data.entries);
    });

    const weights = await cloud.getAll('weights');
    Object.entries(weights).forEach(([date, data]) => {
      local.set('weight_' + date, data);
    });

    const water = await cloud.getAll('water');
    Object.entries(water).forEach(([date, data]) => {
      local.set('water_' + date, data);
    });

    return true;
  } catch (e) {
    console.warn('Sync failed, using local data:', e.message);
    return false;
  }
};

const NKStorage = {
  getProfile: () => local.get('profile'),
  setProfile: (data) => {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    local.set('profile', payload);
    cloud.set('meta', 'profile', payload);
  },

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

  getWater: (date) => local.get('water_' + date) || { ml: 0 },
  setWater: (date, ml) => {
    const payload = { ml, updatedAt: new Date().toISOString() };
    local.set('water_' + date, payload);
    cloud.set('water', date, payload);
  },

  getCustomFoods: () => local.get('custom_foods') || [],
  addCustomFood: (food) => {
    const foods = NKStorage.getCustomFoods();
    const newFood = { ...food, id: 'custom_' + Date.now(), isCustom: true };
    foods.push(newFood);
    local.set('custom_foods', foods);
    cloud.set('meta', 'customFoods', { items: foods, updatedAt: new Date().toISOString() });
    return newFood;
  },
  saveCustomFoods: (foods) => {
    const username = Auth.getCurrentUser();
    if (!username) return;
    local.set('customFoods', foods);
    // Sync each to Firebase
    foods.forEach(food => {
      cloud.set('foodlogs', 'custom_' + food.id, food).catch(() => {});
    });
  },
  deleteCustomFood: (id) => {
    const foods = NKStorage.getCustomFoods().filter(f => f.id !== id);
    local.set('custom_foods', foods);
    cloud.set('meta', 'customFoods', { items: foods, updatedAt: new Date().toISOString() });
  },

  getSettings: () => local.get('settings') || { theme: 'light', workoutDays: [] },
  setSettings: (data) => {
    local.set('settings', data);
    cloud.set('meta', 'settings', data);
  },
  updateSettings: (patch) => {
    NKStorage.setSettings({ ...NKStorage.getSettings(), ...patch });
  },
  // Day type: 'rest' | 'moderate' | 'full'
  getDayType: (date) => {
    const settings = NKStorage.getSettings();
    return (settings.dayTypes || {})[date] || 'rest';
  },
  setDayType: (date, type) => {
    const settings = NKStorage.getSettings();
    const dayTypes = settings.dayTypes || {};
    dayTypes[date] = type;
    NKStorage.updateSettings({ dayTypes: dayTypes });
    return type;
  },
  cycleDayType: (date) => {
    const current = NKStorage.getDayType(date);
    const next = current === 'rest' ? 'moderate' : current === 'moderate' ? 'full' : 'rest';
    return NKStorage.setDayType(date, next);
  },
  // Keep backward compat
  isWorkoutDay: (date) => NKStorage.getDayType(date) !== 'rest',
  toggleWorkoutDay: (date) => NKStorage.cycleDayType(date) !== 'rest'
};

window.NKStorage = NKStorage;

// Enhanced syncFromCloud — also syncs food overrides
const _origSync = syncFromCloud;
window.syncFromCloud = async () => {
  await _origSync();
  // Load global foods from Firebase (with cache)
  if (window.FoodDB) {
    await FoodDB.load();
    await FoodDB.syncOverridesFromCloud();
  }
};

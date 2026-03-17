// ============================================
// NK's Fit Journal — fooddb.js
// Global Food Database Manager
// Replaces fooddata.js — loads from Firebase
// ============================================

const FoodDB = (() => {
  const CACHE_KEY   = 'nkj_globalFoods_cache';
  const CACHE_TS    = 'nkj_globalFoods_ts';
  const CACHE_TTL   = 24 * 60 * 60 * 1000; // 24 hours

  let _globalFoods = [];  // loaded from Firebase
  let _loaded = false;
  let _loadPromise = null;

  // ── Load global foods (Firebase + cache) ──
  const load = () => {
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise(async (resolve) => {
      try {
        // Try cache first
        const ts = parseInt(localStorage.getItem(CACHE_TS) || '0');
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && (Date.now() - ts) < CACHE_TTL) {
          _globalFoods = JSON.parse(cached);
          _loaded = true;
          resolve(_globalFoods);
          // Refresh in background
          _refreshFromFirebase();
          return;
        }
        // No cache — load from Firebase
        await _refreshFromFirebase();
        resolve(_globalFoods);
      } catch (e) {
        console.warn('FoodDB load error:', e);
        // Try cache as fallback
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) _globalFoods = JSON.parse(cached);
        _loaded = true;
        resolve(_globalFoods);
      }
    });
    return _loadPromise;
  };

  const _refreshFromFirebase = async () => {
    try {
      const snap = await firebase.firestore()
        .collection('globalFoods')
        .orderBy('category')
        .get();
      _globalFoods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      _loaded = true;
      localStorage.setItem(CACHE_KEY, JSON.stringify(_globalFoods));
      localStorage.setItem(CACHE_TS, Date.now().toString());
    } catch (e) {
      console.warn('Firebase food refresh error:', e);
    }
  };

  // ── Force refresh cache ──
  const refresh = async () => {
    _loadPromise = null;
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS);
    await load();
  };

  // ── Get user overrides from their account ──
  const _getUserOverrides = () => {
    try {
      const username = window.Auth ? Auth.getCurrentUser() : null;
      if (!username) return {};
      const key = 'nkj_' + username + '_foodOverrides';
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch { return {}; }
  };

  const _saveUserOverride = (foodId, per100) => {
    const username = window.Auth ? Auth.getCurrentUser() : null;
    if (!username) return;
    const key = 'nkj_' + username + '_foodOverrides';
    const overrides = _getUserOverrides();
    overrides[foodId] = per100;
    localStorage.setItem(key, JSON.stringify(overrides));
    // Sync to Firebase
    firebase.firestore()
      .collection('userData').doc(username)
      .collection('foodOverrides').doc(foodId)
      .set({ per100, updatedAt: new Date().toISOString() })
      .catch(e => console.warn('Override sync error:', e));
  };

  const _deleteUserOverride = (foodId) => {
    const username = window.Auth ? Auth.getCurrentUser() : null;
    if (!username) return;
    const key = 'nkj_' + username + '_foodOverrides';
    const overrides = _getUserOverrides();
    delete overrides[foodId];
    localStorage.setItem(key, JSON.stringify(overrides));
    // Remove from Firebase
    firebase.firestore()
      .collection('userData').doc(username)
      .collection('foodOverrides').doc(foodId)
      .delete()
      .catch(e => console.warn('Override delete error:', e));
  };

  // Load overrides from Firebase into localStorage on init
  const _syncOverridesFromCloud = async () => {
    const username = window.Auth ? Auth.getCurrentUser() : null;
    if (!username) return;
    try {
      const snap = await firebase.firestore()
        .collection('userData').doc(username)
        .collection('foodOverrides').get();
      const overrides = {};
      snap.docs.forEach(d => { overrides[d.id] = d.data().per100; });
      const key = 'nkj_' + username + '_foodOverrides';
      localStorage.setItem(key, JSON.stringify(overrides));
    } catch (e) { console.warn('Override sync from cloud error:', e); }
  };

  // ── Get all foods (global + overrides + custom) ──
  const getAll = () => {
    const overrides = _getUserOverrides();
    const customs = window.NKStorage ? NKStorage.getCustomFoods() : [];
    // Apply user overrides to global foods
    const globals = _globalFoods.map(food => {
      if (overrides[food.id]) {
        return { ...food, per100: overrides[food.id], _overridden: true };
      }
      return food;
    });
    return [...globals, ...customs];
  };

  const getGlobal = () => _globalFoods;

  const getById = (id) => getAll().find(f => f.id === id);

  const search = (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return getAll();
    return getAll().filter(f =>
      f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  };

  const searchFilter = (query, type) => {
    let results = search(query);
    if (type && type !== 'all') results = results.filter(f => f.type === type);
    return results;
  };

  const calcMacros = (food, qty) => {
    const ratio = qty / 100;
    return {
      calories: Math.round(food.per100.calories * ratio * 10) / 10,
      protein:  Math.round(food.per100.protein  * ratio * 10) / 10,
      carbs:    Math.round(food.per100.carbs    * ratio * 10) / 10,
      fat:      Math.round(food.per100.fat      * ratio * 10) / 10,
    };
  };

  // ── User overrides API ──
  const setOverride = (foodId, per100) => _saveUserOverride(foodId, per100);
  const resetOverride = (foodId) => _deleteUserOverride(foodId);
  const hasOverride = (foodId) => !!_getUserOverrides()[foodId];
  const getOriginal = (foodId) => _globalFoods.find(f => f.id === foodId);

  // ── Admin: push all foods to Firebase (migration) ──
  const adminMigrateAll = async (foods) => {
    const batch_size = 400;
    let count = 0;
    for (let i = 0; i < foods.length; i += batch_size) {
      const batch = firebase.firestore().batch();
      foods.slice(i, i + batch_size).forEach(food => {
        const ref = firebase.firestore().collection('globalFoods').doc(food.id);
        const { id, ...data } = food;
        batch.set(ref, data);
      });
      await batch.commit();
      count += Math.min(batch_size, foods.length - i);
    }
    await refresh();
    return count;
  };

  // ── Admin: CSV export ──
  const adminExportCSV = () => {
    const header = 'id,name,category,type,unit,calories,protein,carbs,fat,defaultQty';
    const rows = _globalFoods.map(f =>
      [f.id, '"' + f.name + '"', '"' + f.category + '"', f.type, f.unit,
       f.per100.calories, f.per100.protein, f.per100.carbs, f.per100.fat,
       f.defaultQty || 100].join(',')
    );
    return header + '\n' + rows.join('\n');
  };

  // ── Admin: CSV import ──
  const adminImportCSV = async (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const foods = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || lines[i].split(',');
      const clean = vals.map(v => v.replace(/^"|"$/g, '').trim());
      if (clean.length < 9) continue;
      foods.push({
        id:         clean[0],
        name:       clean[1],
        category:   clean[2],
        type:       clean[3],
        unit:       clean[4],
        per100: {
          calories: parseFloat(clean[5]) || 0,
          protein:  parseFloat(clean[6]) || 0,
          carbs:    parseFloat(clean[7]) || 0,
          fat:      parseFloat(clean[8]) || 0,
        },
        defaultQty: parseInt(clean[9]) || 100,
      });
    }
    if (!foods.length) throw new Error('No valid foods found in CSV');
    await adminMigrateAll(foods);
    return foods.length;
  };

  return {
    load, refresh, getAll, getGlobal, getById,
    search, searchFilter, calcMacros,
    setOverride, resetOverride, hasOverride, getOriginal,
    adminMigrateAll, adminExportCSV, adminImportCSV,
    syncOverridesFromCloud: _syncOverridesFromCloud,
  };
})();

window.FoodDB = FoodDB;

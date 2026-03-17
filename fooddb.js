// ============================================
// NK's Fit Journal — fooddb.js
// Global Food Database Manager
// Replaces fooddata.js — loads from Firebase
// ============================================

// Built-in foods — used for migration to Firebase
const BUILTIN_FOODS = [
  // ── EARLY MORNING / SEEDS ──
  { id:'chia-seeds', name:'Soaked Chia Seeds', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:483, protein:16.7, carbs:41.7, fat:30.8 }, defaultQty:12 },
  { id:'almonds', name:'Soaked Almonds', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:579, protein:21.2, carbs:21.6, fat:49.9 }, defaultQty:14 },
  { id:'flaxseeds', name:'Flaxseeds (ground)', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:534, protein:18.3, carbs:28.9, fat:42.2 }, defaultQty:10 },
  { id:'pumpkin-seeds', name:'Pumpkin Seeds', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:559, protein:30.2, carbs:10.7, fat:49.1 }, defaultQty:10 },
  { id:'sunflower-seeds', name:'Sunflower Seeds', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:584, protein:20.8, carbs:20.0, fat:51.5 }, defaultQty:10 },
  { id:'walnuts', name:'Walnuts', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:654, protein:15.2, carbs:13.7, fat:65.2 }, defaultQty:14 },
  { id:'cashews', name:'Cashews', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:553, protein:18.2, carbs:30.2, fat:43.8 }, defaultQty:14 },
  { id:'peanuts', name:'Peanuts (roasted)', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:585, protein:23.7, carbs:21.5, fat:49.7 }, defaultQty:30 },
  { id:'peanut-butter', name:'Peanut Butter', category:'Seeds & Nuts', type:'veg', unit:'g',
    per100:{ calories:588, protein:25.1, carbs:19.6, fat:50.4 }, defaultQty:16 },

  // ── JUICES / DRINKS ──
  { id:'orange-juice', name:'Orange Juice (fresh)', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:45, protein:0.7, carbs:10.4, fat:0.2 }, defaultQty:200 },
  { id:'abc-juice', name:'ABC Juice with Lemon', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:38, protein:0.6, carbs:8.5, fat:0.2 }, defaultQty:200 },
  { id:'cold-coffee', name:'Cold Coffee (Bru 3 sachets)', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:58, protein:1.3, carbs:10.2, fat:1.5 }, defaultQty:200 },
  { id:'coke', name:'Coca-Cola (Regular)', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:42, protein:0.0, carbs:10.6, fat:0.0 }, defaultQty:330 },
  { id:'coke-zero', name:'Coca-Cola Zero Sugar', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:0, protein:0.0, carbs:0.0, fat:0.0 }, defaultQty:330 },
  { id:'sprite', name:'Sprite', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:39, protein:0.0, carbs:9.9, fat:0.0 }, defaultQty:330 },
  { id:'lemon-water', name:'Lemon Water', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:4, protein:0.1, carbs:1.0, fat:0.0 }, defaultQty:250 },
  { id:'coconut-water', name:'Coconut Water', category:'Juices & Drinks', type:'veg', unit:'ml',
    per100:{ calories:19, protein:0.7, carbs:3.7, fat:0.2 }, defaultQty:250 },
  { id:'skimmed-milk', name:'Skimmed Milk', category:'Dairy', type:'veg', unit:'ml',
    per100:{ calories:35, protein:3.4, carbs:4.9, fat:0.1 }, defaultQty:200 },
  { id:'full-fat-milk', name:'Full Fat Milk', category:'Dairy', type:'veg', unit:'ml',
    per100:{ calories:61, protein:3.2, carbs:4.8, fat:3.3 }, defaultQty:200 },

  // ── DAIRY & EGGS ──
  { id:'paneer', name:'Paneer', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:265, protein:18.3, carbs:3.6, fat:20.4 }, defaultQty:150 },
  { id:'curd-0fat', name:'Curd (0% Fat)', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:35, protein:5.0, carbs:4.0, fat:0.0 }, defaultQty:100 },
  { id:'curd-fullfat', name:'Curd (Full Fat ~5% protein)', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:70, protein:3.5, carbs:5.5, fat:3.5 }, defaultQty:200 },
  { id:'greek-yogurt', name:'Greek Yogurt / Hung Curd', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:97, protein:10.0, carbs:3.6, fat:5.0 }, defaultQty:100 },
  { id:'cottage-cheese', name:'Cottage Cheese (low fat)', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:72, protein:12.5, carbs:3.1, fat:1.5 }, defaultQty:100 },
  { id:'cheese-slice', name:'Cheese Slice', category:'Dairy', type:'veg', unit:'g',
    per100:{ calories:315, protein:19.8, carbs:3.7, fat:24.9 }, defaultQty:25 },
  { id:'whole-egg', name:'Whole Egg', category:'Eggs', type:'veg', unit:'g',
    per100:{ calories:155, protein:12.6, carbs:1.1, fat:10.6 }, defaultQty:50 },
  { id:'egg-white', name:'Egg White', category:'Eggs', type:'veg', unit:'g',
    per100:{ calories:52, protein:10.9, carbs:0.7, fat:0.2 }, defaultQty:33 },

  // ── BREAD & BAKERY ──
  { id:'bread-white', name:'Bread Slices (White)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:265, protein:8.9, carbs:49.4, fat:3.2 }, defaultQty:60 },
  { id:'bread-multigrain', name:'Multigrain Bread', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:250, protein:10.0, carbs:44.7, fat:4.2 }, defaultQty:60 },
  { id:'roti', name:'Roti (Wheat)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:300, protein:8.8, carbs:55.0, fat:6.3 }, defaultQty:40 },

  // ── RICE & GRAINS ──
  { id:'white-rice', name:'Cooked White Rice', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:130, protein:2.7, carbs:28.2, fat:0.3 }, defaultQty:180 },
  { id:'sona-masoori-rice', name:'Sona Masoori Rice (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:130, protein:2.5, carbs:28.0, fat:0.3 }, defaultQty:180 },
  { id:'basmati-rice', name:'Basmati Rice (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:121, protein:3.5, carbs:25.2, fat:0.4 }, defaultQty:180 },
  { id:'brown-rice', name:'Brown Rice (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:111, protein:2.6, carbs:23.0, fat:0.9 }, defaultQty:180 },
  { id:'quinoa', name:'Quinoa (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:120, protein:4.4, carbs:21.3, fat:1.9 }, defaultQty:180 },
  { id:'oats', name:'Oats (rolled, dry)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:371, protein:13.2, carbs:55.7, fat:7.2 }, defaultQty:40 },
  { id:'poha', name:'Poha (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:120, protein:2.0, carbs:25.3, fat:1.3 }, defaultQty:150 },
  { id:'upma', name:'Upma (rava)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:127, protein:3.0, carbs:20.0, fat:4.0 }, defaultQty:150 },
  { id:'dalia', name:'Wheat Dalia (cooked)', category:'Grains & Bakery', type:'veg', unit:'g',
    per100:{ calories:93, protein:3.3, carbs:17.3, fat:1.0 }, defaultQty:150 },
  { id:'curry-rice', name:'Curry with Rice', category:'Mixed Meals', type:'veg', unit:'g',
    per100:{ calories:117, protein:2.6, carbs:20.0, fat:2.6 }, defaultQty:350 },

  // ── DALS ──
  { id:'red-gram-dal', name:'Red Gram Dal (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:116, protein:7.2, carbs:19.9, fat:0.4 }, defaultQty:100 },
  { id:'toor-dal', name:'Toor Dal (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:116, protein:6.8, carbs:20.2, fat:0.4 }, defaultQty:100 },
  { id:'moong-dal', name:'Moong Dal (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:91, protein:7.0, carbs:13.7, fat:0.4 }, defaultQty:100 },
  { id:'chana-dal', name:'Senaga Pappu / Chana Dal (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:164, protein:8.7, carbs:27.3, fat:2.7 }, defaultQty:100 },
  { id:'masoor-dal', name:'Masoor Dal (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:116, protein:9.0, carbs:20.1, fat:0.4 }, defaultQty:100 },

  // ── LEGUMES ──
  { id:'rajma', name:'Rajma / Kidney Beans (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:127, protein:8.7, carbs:22.8, fat:0.5 }, defaultQty:100 },
  { id:'chickpeas', name:'Chickpeas / Chole (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:164, protein:8.9, carbs:27.4, fat:2.6 }, defaultQty:100 },
  { id:'black-chana', name:'Black Chana (cooked)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:164, protein:9.0, carbs:27.4, fat:2.6 }, defaultQty:100 },
  { id:'sprouts', name:'Moong Sprouts (raw)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:30, protein:3.0, carbs:5.9, fat:0.2 }, defaultQty:100 },
  { id:'edamame', name:'Edamame', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:121, protein:11.9, carbs:8.9, fat:5.2 }, defaultQty:100 },
  { id:'tofu-firm', name:'Tofu (firm)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:76, protein:8.0, carbs:1.9, fat:4.8 }, defaultQty:100 },
  { id:'soya-chunks', name:'Soya Chunks (dry)', category:'Dals & Legumes', type:'veg', unit:'g',
    per100:{ calories:345, protein:52.4, carbs:33.0, fat:0.5 }, defaultQty:30 },

  // ── VEGETABLES ──
  { id:'broccoli', name:'Broccoli (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:35, protein:2.8, carbs:6.6, fat:0.4 }, defaultQty:100 },
  { id:'spinach', name:'Spinach / Palak (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:23, protein:2.9, carbs:3.6, fat:0.4 }, defaultQty:100 },
  { id:'sweet-potato', name:'Sweet Potato (boiled)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:90, protein:2.0, carbs:20.7, fat:0.1 }, defaultQty:100 },
  { id:'carrot', name:'Carrot (raw)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:41, protein:0.9, carbs:9.6, fat:0.2 }, defaultQty:100 },
  { id:'cucumber', name:'Cucumber', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:16, protein:0.7, carbs:3.6, fat:0.1 }, defaultQty:100 },
  { id:'tomato', name:'Tomato', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:18, protein:0.9, carbs:3.9, fat:0.2 }, defaultQty:100 },
  { id:'onion', name:'Onion', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:40, protein:1.1, carbs:9.3, fat:0.1 }, defaultQty:100 },
  { id:'capsicum', name:'Capsicum / Bell Pepper', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:31, protein:1.0, carbs:6.0, fat:0.3 }, defaultQty:100 },
  { id:'mushroom', name:'Mushroom', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:22, protein:3.1, carbs:3.3, fat:0.3 }, defaultQty:100 },
  { id:'beans-sauted', name:'Beans Sautéed', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:50, protein:2.8, carbs:9.0, fat:0.3 }, defaultQty:100 },
  { id:'potato-boiled', name:'Potato (boiled)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:87, protein:1.9, carbs:20.1, fat:0.1 }, defaultQty:150 },
  { id:'potato-roasted', name:'Potato (roasted)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:149, protein:3.0, carbs:33.0, fat:0.2 }, defaultQty:150 },
  { id:'cauliflower', name:'Cauliflower (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:25, protein:1.9, carbs:5.0, fat:0.3 }, defaultQty:100 },
  { id:'cabbage', name:'Cabbage (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:23, protein:1.3, carbs:5.2, fat:0.1 }, defaultQty:100 },
  { id:'peas', name:'Green Peas (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:84, protein:5.4, carbs:15.6, fat:0.4 }, defaultQty:100 },
  { id:'corn', name:'Sweet Corn (boiled)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:96, protein:3.4, carbs:21.0, fat:1.5 }, defaultQty:100 },
  { id:'ladyfinger', name:'Ladyfinger / Okra (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:33, protein:2.0, carbs:7.0, fat:0.2 }, defaultQty:100 },
  { id:'bitter-gourd', name:'Bitter Gourd / Karela (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:25, protein:1.0, carbs:5.3, fat:0.2 }, defaultQty:100 },
  { id:'bottle-gourd', name:'Bottle Gourd / Lauki (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:15, protein:0.6, carbs:3.4, fat:0.1 }, defaultQty:150 },
  { id:'drumstick', name:'Drumstick / Moringa (cooked)', category:'Vegetables', type:'veg', unit:'g',
    per100:{ calories:37, protein:2.1, carbs:8.5, fat:0.2 }, defaultQty:100 },

  // ── FRUITS ──
  { id:'banana', name:'Banana', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:89, protein:1.1, carbs:22.8, fat:0.3 }, defaultQty:120 },
  { id:'apple', name:'Apple', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:52, protein:0.3, carbs:13.8, fat:0.2 }, defaultQty:150 },
  { id:'watermelon', name:'Watermelon', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:30, protein:0.6, carbs:7.6, fat:0.2 }, defaultQty:150 },
  { id:'papaya', name:'Papaya', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:43, protein:0.5, carbs:10.8, fat:0.3 }, defaultQty:140 },
  { id:'pomegranate', name:'Pomegranate', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:83, protein:1.7, carbs:18.7, fat:1.2 }, defaultQty:100 },
  { id:'mango', name:'Mango', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:60, protein:0.8, carbs:14.9, fat:0.4 }, defaultQty:100 },
  { id:'guava', name:'Guava', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:68, protein:2.6, carbs:14.3, fat:1.0 }, defaultQty:100 },
  { id:'kiwi', name:'Kiwi', category:'Fruits', type:'veg', unit:'g',
    per100:{ calories:61, protein:1.1, carbs:14.7, fat:0.5 }, defaultQty:75 },

  // ── SUPPLEMENTS ──
  { id:'whey-protein', name:'Whey Protein (1 scoop)', category:'Supplements', type:'veg', unit:'g',
    per100:{ calories:400, protein:78.0, carbs:8.0, fat:5.0 }, defaultQty:30 },
  { id:'protein-bar', name:'Protein Bar (12-14g protein)', category:'Supplements', type:'veg', unit:'g',
    per100:{ calories:367, protein:21.7, carbs:43.3, fat:11.7 }, defaultQty:60 },

  // ── NON-VEG ──
  { id:'chicken-breast', name:'Chicken Breast (boiled)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:165, protein:31.0, carbs:0.0, fat:3.6 }, defaultQty:100 },
  { id:'chicken-thigh', name:'Chicken Thigh (cooked)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:177, protein:24.0, carbs:0.0, fat:8.9 }, defaultQty:100 },
  { id:'boiled-egg', name:'Boiled Egg', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:155, protein:12.6, carbs:1.1, fat:10.6 }, defaultQty:50 },
  { id:'egg-omelette', name:'Egg Omelette (2 eggs)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:154, protein:11.0, carbs:0.9, fat:11.4 }, defaultQty:110 },
  { id:'tuna', name:'Tuna (canned)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:116, protein:25.5, carbs:0.0, fat:1.0 }, defaultQty:100 },
  { id:'salmon', name:'Salmon (cooked)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:208, protein:20.4, carbs:0.0, fat:13.4 }, defaultQty:100 },
  { id:'prawns', name:'Prawns (boiled)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:99, protein:20.9, carbs:0.9, fat:1.1 }, defaultQty:100 },
  { id:'mutton', name:'Mutton (cooked)', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:234, protein:25.6, carbs:0.0, fat:14.3 }, defaultQty:100 },
  { id:'fish-curry', name:'Fish Curry', category:'Non-Veg', type:'nonveg', unit:'g',
    per100:{ calories:120, protein:14.0, carbs:4.0, fat:5.5 }, defaultQty:150 }
];
window.FOOD_DATABASE = BUILTIN_FOODS;

const FoodDB = (() => {
  // Always start with built-in foods so app works instantly
  let _globalFoods = [...BUILTIN_FOODS];
  let _loaded = false;
  let _loadPromise = null;

  // ── Load global foods from Firebase ──
  const load = () => {
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise(async (resolve) => {
      try {
        const snap = await firebase.firestore()
          .collection('globalFoods')
          .get();
        if (snap.docs.length > 0) {
          _globalFoods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        // If Firebase empty — fall back to built-ins (before migration)
        if (_globalFoods.length === 0) {
          _globalFoods = [...BUILTIN_FOODS];
        }
        _loaded = true;
        resolve(_globalFoods);
      } catch (e) {
        console.warn('FoodDB Firebase load error:', e);
        // On error use built-ins
        _globalFoods = [...BUILTIN_FOODS];
        _loaded = true;
        resolve(_globalFoods);
      }
    });
    return _loadPromise;
  };

  // ── Force re-fetch ──
  const refresh = async () => {
    _loadPromise = null;
    _globalFoods = [...BUILTIN_FOODS];
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

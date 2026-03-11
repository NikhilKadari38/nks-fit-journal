// ============================================
// NK's Fit Journal — fooddata.js
// Complete Food Database (70+ items, per 100g)
// ============================================

const FOOD_DATABASE = [
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
  { id:'tofu', name:'Tofu (firm)', category:'Dals & Legumes', type:'veg', unit:'g',
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

// Utility functions
const FoodDB = {
  getAll: () => [...FOOD_DATABASE, ...window.NKStorage.getCustomFoods()],
  getVeg: () => FoodDB.getAll().filter(f => f.type === 'veg'),
  getNonVeg: () => FoodDB.getAll().filter(f => f.type === 'nonveg'),
  search: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return FoodDB.getAll();
    return FoodDB.getAll().filter(f =>
      f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  },
  filter: (type) => {
    if (type === 'all') return FoodDB.getAll();
    if (type === 'veg') return FoodDB.getVeg();
    if (type === 'nonveg') return FoodDB.getNonVeg();
    return FoodDB.getAll();
  },
  searchFilter: (query, type) => {
    let results = FoodDB.search(query);
    if (type && type !== 'all') results = results.filter(f => f.type === type);
    return results;
  },
  getById: (id) => FoodDB.getAll().find(f => f.id === id),
  getCategories: () => [...new Set(FoodDB.getAll().map(f => f.category))],
  calcMacros: (food, qty) => {
    const ratio = qty / 100;
    return {
      calories: Math.round(food.per100.calories * ratio * 10) / 10,
      protein: Math.round(food.per100.protein * ratio * 10) / 10,
      carbs: Math.round(food.per100.carbs * ratio * 10) / 10,
      fat: Math.round(food.per100.fat * ratio * 10) / 10,
    };
  }
};

window.FOOD_DATABASE = FOOD_DATABASE;
window.FoodDB = FoodDB;

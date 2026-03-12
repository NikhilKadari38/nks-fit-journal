// ============================================
// NK's Fit Journal — database.js
// ============================================

const FoodDatabase = (() => {
  let currentFilter = 'all', searchQuery = '';

  const init = () => {
    renderStats();
    renderFoods();
    bindSearch();
    bindFilters();
    bindAddCustom();
  };

  // ── Stats ──
  const renderStats = () => {
    const all = FoodDB.getAll();
    const el = (id) => document.getElementById(id);
    if (el('db-total'))  el('db-total').textContent  = all.length;
    if (el('db-veg'))    el('db-veg').textContent    = all.filter(f => f.type === 'veg').length;
    if (el('db-nonveg')) el('db-nonveg').textContent = all.filter(f => f.type === 'nonveg').length;
    if (el('db-custom')) el('db-custom').textContent = NKStorage.getCustomFoods().length;
    syncStatCardActive();
  };

  const syncStatCardActive = () => {
    document.querySelectorAll('.stat-filter-card').forEach(card => {
      card.classList.toggle('active-filter', card.dataset.statFilter === currentFilter);
    });
    document.querySelectorAll('[data-db-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dbFilter === currentFilter);
    });
  };

  const applyFilter = (filter) => {
    currentFilter = filter;
    renderFoods();
    syncStatCardActive();
    const grid = document.getElementById('foods-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Render food cards ──
  const foodCardHTML = (food) => {
    let html = '<div class="food-db-card card card-sm" data-food-id="' + food.id + '" style="cursor:pointer;transition:all 0.2s">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span class="' + (food.type === 'nonveg' ? 'nonveg-dot' : 'veg-dot') + '"></span>';
    html += '<span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase">' + (food.type === 'nonveg' ? 'Non-Veg' : 'Veg') + '</span>';
    html += '</div>';
    if (food.isCustom) html += '<span class="pill" style="font-size:0.65rem;padding:2px 8px;background:rgba(0,122,204,0.1);color:var(--accent-primary)">Custom</span>';
    html += '</div>';
    html += '<div style="font-weight:600;font-size:0.92rem;margin-bottom:8px;color:var(--text-primary)">' + food.name + '</div>';
    html += '<div style="font-family:var(--heading-font);font-size:1.5rem;font-weight:700;color:var(--accent-primary);line-height:1;margin-bottom:4px">' + food.per100.calories + '</div>';
    html += '<div style="font-size:0.72rem;color:var(--text-muted)">kcal / 100' + food.unit + '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">';
    html += '<div style="text-align:center"><div style="font-weight:700;font-size:0.85rem;color:#3B82F6">' + food.per100.protein + 'g</div><div style="font-size:0.62rem;color:var(--text-muted)">Protein</div></div>';
    html += '<div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)"><div style="font-weight:700;font-size:0.85rem;color:#A78BFA">' + food.per100.carbs + 'g</div><div style="font-size:0.62rem;color:var(--text-muted)">Carbs</div></div>';
    html += '<div style="text-align:center"><div style="font-weight:700;font-size:0.85rem;color:#FB923C">' + food.per100.fat + 'g</div><div style="font-size:0.62rem;color:var(--text-muted)">Fat</div></div>';
    html += '</div>';
    if (food.isCustom) html += '<button class="btn btn-danger btn-sm w-full delete-custom" data-id="' + food.id + '" style="margin-top:10px">🗑️ Delete</button>';
    html += '</div>';
    return html;
  };

  const renderFoods = () => {
    const foods = FoodDB.searchFilter(searchQuery, currentFilter);
    const container = document.getElementById('foods-grid');
    if (!container) return;

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' items';

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">🔍</span><div class="empty-state-title">No foods found</div><div class="empty-state-desc">Try a different search or add a custom food item</div></div>';
      return;
    }

    const grouped = {};
    foods.forEach(function(f) {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    });

    let html = '';
    Object.keys(grouped).forEach(function(cat) {
      const items = grouped[cat];
      html += '<div class="db-category-section" style="grid-column:1/-1;margin-bottom:8px">';
      html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:8px">';
      html += '<span>' + cat + '</span><span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">' + items.length + '</span></div>';
      html += '<div class="grid-3" style="gap:12px">';
      items.forEach(function(food) { html += foodCardHTML(food); });
      html += '</div></div>';
    });
    container.innerHTML = html;
    bindCardEvents(container);
  };

  const renderFoodsCustomOnly = () => {
    const foods = NKStorage.getCustomFoods();
    const container = document.getElementById('foods-grid');
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' custom items';
    if (!container) return;

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">✏️</span><div class="empty-state-title">No custom foods yet</div><div class="empty-state-desc">Click "Add Custom Food" to add your own items</div></div>';
      return;
    }

    let html = '<div class="db-category-section" style="grid-column:1/-1;margin-bottom:8px">';
    html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent-primary);margin-bottom:12px;display:flex;align-items:center;gap:8px">';
    html += '<span>My Custom Foods</span><span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">' + foods.length + '</span></div>';
    html += '<div class="grid-3" style="gap:12px">';
    foods.forEach(function(food) { html += foodCardHTML(food); });
    html += '</div></div>';
    container.innerHTML = html;
    bindCardEvents(container);
  };

  const bindCardEvents = (container) => {
    container.querySelectorAll('.food-db-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.delete-custom')) return;
        const food = FoodDB.getById(card.dataset.foodId);
        if (food) openQuickLog(food);
      });
    });
    container.querySelectorAll('.delete-custom').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete this custom food?')) {
          NKStorage.deleteCustomFood(btn.dataset.id);
          renderStats();
          renderFoodsCustomOnly();
          Toast.info('Custom food deleted');
        }
      });
    });
  };

  // ── Quick Log Modal (uses existing modal IDs in database.html) ──
  const openQuickLog = (food) => {
    window._qlFood = food;
    const nameEl = document.getElementById('ql-food-name');
    const qtyEl  = document.getElementById('ql-qty');
    const unitEl = document.getElementById('ql-unit');

    if (nameEl) nameEl.textContent = food.name;
    if (unitEl) unitEl.textContent = food.unit;

    const updateMacros = function() {
      const qty = parseFloat(qtyEl ? qtyEl.value : 0) || 0;
      const m = FoodDB.calcMacros(food, qty);
      const el = (id) => document.getElementById(id);
      if (el('ql-calories')) el('ql-calories').textContent = Math.round(m.calories);
      if (el('ql-protein'))  el('ql-protein').textContent  = Utils.round1(m.protein);
      if (el('ql-carbs'))    el('ql-carbs').textContent    = Utils.round1(m.carbs);
      if (el('ql-fat'))      el('ql-fat').textContent      = Utils.round1(m.fat);
    };

    if (qtyEl) {
      qtyEl.value = food.defaultQty || 100;
      qtyEl.oninput = updateMacros;
      updateMacros();
    }
    Modal.open('quick-log-modal');
  };

  // ── Search ──
  const bindSearch = () => {
    const searchEl = document.getElementById('db-search');
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        searchQuery = searchEl.value;
        renderFoods();
      });
    }
  };

  // ── Filters ──
  const bindFilters = () => {
    document.querySelectorAll('[data-db-filter]').forEach(function(btn) {
      btn.addEventListener('click', function() { applyFilter(btn.dataset.dbFilter); });
    });
    document.querySelectorAll('.stat-filter-card').forEach(function(card) {
      card.addEventListener('click', function() {
        const filter = card.dataset.statFilter;
        if (filter === 'custom') {
          currentFilter = 'custom';
          renderFoodsCustomOnly();
          syncStatCardActive();
          const grid = document.getElementById('foods-grid');
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          applyFilter(filter);
        }
      });
    });
  };

  // ── Add Custom Food ──
  const bindAddCustom = () => {
    // Open modal button
    const openBtn = document.getElementById('add-custom-btn');
    if (openBtn) openBtn.addEventListener('click', function() { Modal.open('add-custom-modal'); });

    // Quick log confirm
    const qlBtn = document.getElementById('ql-log-btn');
    if (qlBtn) qlBtn.addEventListener('click', function() {
      const food = window._qlFood;
      if (!food) return;
      const qty = parseFloat(document.getElementById('ql-qty')?.value) || 0;
      if (qty <= 0) { Toast.error('Enter a valid quantity'); return; }
      const macros = FoodDB.calcMacros(food, qty);
      const entry = { foodId: food.id, name: food.name, qty: qty, unit: food.unit, type: food.type,
        calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat };
      NKStorage.addFoodEntry(Utils.today(), entry);
      Modal.close('quick-log-modal');
      Toast.success('✅ ' + food.name + ' logged for today!');
      window._qlFood = null;
    });

    // Save custom food
    const saveBtn = document.getElementById('save-custom-btn');
    if (saveBtn) saveBtn.addEventListener('click', function() {
      const name = document.getElementById('c-name')?.value?.trim();
      const calories = parseFloat(document.getElementById('c-calories')?.value);
      const protein  = parseFloat(document.getElementById('c-protein')?.value)  || 0;
      const carbs    = parseFloat(document.getElementById('c-carbs')?.value)    || 0;
      const fat      = parseFloat(document.getElementById('c-fat')?.value)      || 0;
      const type     = document.getElementById('c-type')?.value     || 'veg';
      const unit     = document.getElementById('c-unit')?.value     || 'g';
      const category = document.getElementById('c-category')?.value || 'Custom';

      if (!name) { Toast.error('Please enter a food name'); return; }
      if (isNaN(calories) || calories < 0) { Toast.error('Enter valid calories'); return; }

      NKStorage.addCustomFood({ name: name, type: type, unit: unit, category: category,
        per100: { calories: calories, protein: protein, carbs: carbs, fat: fat }, defaultQty: 100 });
      Modal.close('add-custom-modal');
      ['c-name','c-calories','c-protein','c-carbs','c-fat'].forEach(function(id) {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderStats();
      renderFoods();
      Toast.success('✅ "' + name + '" added to database!');
    });
  };

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', async function() {
  BGAnim.init('database');
  await syncFromCloud();
  FoodDatabase.init();
});

// ============================================
// NK's Fit Journal — database.js
// Food Database: Firebase-backed, user overrides
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

  // ── Food Row HTML ──
  const foodRowHTML = (food) => {
    const isCustom = !!food.isCustom;
    const isOverridden = !!food._overridden;
    return '<div class="food-db-row" data-food-id="' + food.id + '">'
      + '<div class="food-row-dot"><span class="' + (food.type === 'nonveg' ? 'nonveg-dot' : 'veg-dot') + '"></span></div>'
      + '<div class="food-row-name">' + food.name
        + (isCustom ? ' <span class="food-row-badge">Custom</span>' : '')
        + (isOverridden ? ' <span class="food-row-badge" style="background:rgba(245,158,11,0.15);color:#F59E0B">Edited</span>' : '')
      + '</div>'
      + '<div class="food-row-cal">' + food.per100.calories + '<span> kcal</span></div>'
      + '<div class="food-row-macro" style="color:#3B82F6">' + food.per100.protein + 'g<span>P</span></div>'
      + '<div class="food-row-macro" style="color:#A78BFA">' + food.per100.carbs + 'g<span>C</span></div>'
      + '<div class="food-row-macro" style="color:#FB923C">' + food.per100.fat + 'g<span>F</span></div>'
      + '<div class="food-row-unit">per 100' + food.unit + '</div>'
      + '<button class="food-row-menu-btn" data-id="' + food.id + '" data-custom="' + isCustom + '" title="Options">⋮</button>'
      + '</div>';
  };

  // ── Render Foods ──
  const renderFoods = () => {
    const foods = FoodDB.searchFilter(searchQuery, currentFilter);
    const container = document.getElementById('foods-grid');
    if (!container) return;

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' items';

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🔍</span><div class="empty-state-title">No foods found</div><div class="empty-state-desc">Try a different search or add a custom food item</div></div>';
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
      html += '<div class="db-category-section" style="margin-bottom:20px">';
      html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:8px">';
      html += '<span>' + cat + '</span><span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">' + items.length + '</span></div>';
      html += '<div class="food-db-table">';
      html += '<div class="food-db-table-header"><div></div><div>Food Name</div><div>Calories</div><div>Protein</div><div>Carbs</div><div>Fat</div><div>Per</div><div></div></div>';
      items.forEach(function(food) { html += foodRowHTML(food); });
      html += '</div></div>';
    });
    container.innerHTML = html;
    bindRowEvents(container);
  };

  const renderFoodsCustomOnly = () => {
    const foods = NKStorage.getCustomFoods();
    const container = document.getElementById('foods-grid');
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' custom items';
    if (!container) return;

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">✏️</span><div class="empty-state-title">No custom foods yet</div><div class="empty-state-desc">Click "Add Custom Food" to create your own</div></div>';
      return;
    }

    let html = '<div class="db-category-section" style="margin-bottom:20px">';
    html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent-primary);margin-bottom:8px">My Custom Foods</div>';
    html += '<div class="food-db-table">';
    html += '<div class="food-db-table-header"><div></div><div>Food Name</div><div>Calories</div><div>Protein</div><div>Carbs</div><div>Fat</div><div>Per</div><div></div></div>';
    foods.forEach(function(food) { html += foodRowHTML(food); });
    html += '</div></div>';
    container.innerHTML = html;
    bindRowEvents(container);
  };

  // ── Row Events ──
  const bindRowEvents = (container) => {
    // Click row to quick log
    container.querySelectorAll('.food-db-row').forEach(function(row) {
      row.addEventListener('click', function(e) {
        if (e.target.closest('.food-row-menu-btn')) return;
        const food = FoodDB.getById(row.dataset.foodId);
        if (food) openQuickLog(food);
      });
    });

    // Three dots menu
    container.querySelectorAll('.food-row-menu-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openDotMenu(btn.dataset.id, btn.dataset.custom === 'true', btn);
      });
    });
  };

  // ── Three Dots Menu ──
  let _activeMenu = null;
  const openDotMenu = (foodId, isCustom, btnEl) => {
    // Remove existing menu
    if (_activeMenu) { _activeMenu.remove(); _activeMenu = null; }

    const menu = document.createElement('div');
    menu.className = 'dot-menu';
    menu.style.cssText = 'position:fixed;z-index:9999;background:var(--bg-modal);border:1px solid var(--border-color);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.15);min-width:160px;overflow:hidden;';

    const items = isCustom
      ? [
          { label: '✏️ Edit values', action: () => openEditModal(foodId, true) },
          { label: '🗑️ Delete', action: () => deleteCustomFood(foodId), danger: true },
        ]
      : [
          { label: '✏️ Edit values', action: () => openEditModal(foodId, false) },
          { label: '↩️ Reset to defaults', action: () => resetFoodOverride(foodId) },
        ];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.style.cssText = 'display:block;width:100%;padding:11px 16px;text-align:left;background:none;border:none;cursor:pointer;font-size:0.85rem;color:' + (item.danger ? 'var(--error)' : 'var(--text-primary)') + ';transition:background 0.15s;';
      btn.textContent = item.label;
      btn.onmouseenter = () => { btn.style.background = 'var(--bg-secondary)'; };
      btn.onmouseleave = () => { btn.style.background = 'none'; };
      btn.onclick = () => { menu.remove(); _activeMenu = null; item.action(); };
      menu.appendChild(btn);
    });

    // Position near button
    const rect = btnEl.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    _activeMenu = menu;

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function handler() {
        menu.remove(); _activeMenu = null;
        document.removeEventListener('click', handler);
      }, { once: true });
    }, 10);
  };

  // ── Edit Modal ──
  const openEditModal = (foodId, isCustom) => {
    const food = FoodDB.getById(foodId);
    if (!food) return;

    const existing = document.getElementById('edit-food-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-food-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal">'
      + '<div class="modal-header"><h3 class="modal-title">✏️ Edit: ' + food.name + '</h3>'
      + '<button class="modal-close" onclick="document.getElementById(\'edit-food-modal\').remove()">✕</button></div>'
      + '<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Values per 100' + food.unit + '. Changes apply only to you.</p>'
      + '<div class="input-row">'
      + '<div class="form-group"><label class="form-label">Calories (kcal)</label><input type="number" id="ef-calories" class="form-input" value="' + food.per100.calories + '" min="0" step="0.1"/></div>'
      + '<div class="form-group"><label class="form-label">Protein (g)</label><input type="number" id="ef-protein" class="form-input" value="' + food.per100.protein + '" min="0" step="0.1"/></div>'
      + '</div>'
      + '<div class="input-row">'
      + '<div class="form-group"><label class="form-label">Carbs (g)</label><input type="number" id="ef-carbs" class="form-input" value="' + food.per100.carbs + '" min="0" step="0.1"/></div>'
      + '<div class="form-group"><label class="form-label">Fat (g)</label><input type="number" id="ef-fat" class="form-input" value="' + food.per100.fat + '" min="0" step="0.1"/></div>'
      + '</div>'
      + '<div style="display:flex;gap:10px;margin-top:8px">'
      + '<button class="btn btn-secondary w-full" onclick="document.getElementById(\'edit-food-modal\').remove()">Cancel</button>'
      + '<button class="btn btn-primary w-full" id="ef-save-btn">💾 Save</button>'
      + '</div></div>';

    document.body.appendChild(modal);

    document.getElementById('ef-save-btn').onclick = () => {
      const per100 = {
        calories: parseFloat(document.getElementById('ef-calories').value) || 0,
        protein:  parseFloat(document.getElementById('ef-protein').value)  || 0,
        carbs:    parseFloat(document.getElementById('ef-carbs').value)    || 0,
        fat:      parseFloat(document.getElementById('ef-fat').value)      || 0,
      };
      if (isCustom) {
        // Update custom food
        const customs = NKStorage.getCustomFoods();
        const idx = customs.findIndex(f => f.id === foodId);
        if (idx >= 0) { customs[idx].per100 = per100; NKStorage.saveCustomFoods(customs); }
      } else {
        FoodDB.setOverride(foodId, per100);
      }
      modal.remove();
      renderStats();
      renderFoods();
      Toast.success('✅ ' + food.name + ' updated!');
    };
  };

  const resetFoodOverride = (foodId) => {
    const food = FoodDB.getOriginal(foodId);
    if (!food) return;
    FoodDB.resetOverride(foodId);
    renderStats();
    renderFoods();
    Toast.success('↩️ Reset to default values');
  };

  const deleteCustomFood = (foodId) => {
    if (!confirm('Delete this custom food?')) return;
    NKStorage.deleteCustomFood(foodId);
    renderStats();
    renderFoods();
    Toast.info('Custom food deleted');
  };

  // ── Quick Log Modal ──
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
    if (qtyEl) { qtyEl.value = food.defaultQty || 100; qtyEl.oninput = updateMacros; updateMacros(); }
    Modal.open('quick-log-modal');
  };

  // ── Search ──
  const bindSearch = () => {
    const searchEl = document.getElementById('db-search');
    if (searchEl) searchEl.addEventListener('input', function() { searchQuery = searchEl.value; renderFoods(); });
  };

  // ── Filters ──
  const bindFilters = () => {
    document.querySelectorAll('[data-db-filter]').forEach(function(btn) {
      btn.addEventListener('click', function() { applyFilter(btn.dataset.dbFilter); });
    });
    document.querySelectorAll('.stat-filter-card').forEach(function(card) {
      card.addEventListener('click', function() {
        if (card.dataset.statFilter === 'custom') {
          currentFilter = 'custom';
          renderFoodsCustomOnly();
          syncStatCardActive();
        } else {
          applyFilter(card.dataset.statFilter);
        }
      });
    });
  };

  // ── Add Custom Food ──
  const bindAddCustom = () => {
    const openBtn = document.getElementById('add-custom-btn');
    if (openBtn) openBtn.addEventListener('click', function() { Modal.open('add-custom-modal'); });

    const qlBtn = document.getElementById('ql-log-btn');
    if (qlBtn) qlBtn.addEventListener('click', function() {
      const food = window._qlFood;
      if (!food) return;
      const qty = parseFloat(document.getElementById('ql-qty')?.value) || 0;
      if (qty <= 0) { Toast.error('Enter a valid quantity'); return; }
      const macros = FoodDB.calcMacros(food, qty);
      const entry = { foodId: food.id, name: food.name, qty, unit: food.unit, type: food.type, ...macros };
      NKStorage.addFoodEntry(Utils.today(), entry);
      Modal.close('quick-log-modal');
      Toast.success('✅ ' + food.name + ' logged for today!');
      window._qlFood = null;
    });

    const saveBtn = document.getElementById('save-custom-btn');
    if (saveBtn) saveBtn.addEventListener('click', function() {
      const name     = document.getElementById('c-name')?.value?.trim();
      const calories = parseFloat(document.getElementById('c-calories')?.value);
      const protein  = parseFloat(document.getElementById('c-protein')?.value)  || 0;
      const carbs    = parseFloat(document.getElementById('c-carbs')?.value)    || 0;
      const fat      = parseFloat(document.getElementById('c-fat')?.value)      || 0;
      const type     = document.getElementById('c-type')?.value     || 'veg';
      const unit     = document.getElementById('c-unit')?.value     || 'g';
      const category = document.getElementById('c-category')?.value || 'Custom';
      if (!name) { Toast.error('Please enter a food name'); return; }
      if (isNaN(calories) || calories < 0) { Toast.error('Enter valid calories'); return; }
      NKStorage.addCustomFood({ name, type, unit, category, per100: { calories, protein, carbs, fat }, defaultQty: 100 });
      Modal.close('add-custom-modal');
      ['c-name','c-calories','c-protein','c-carbs','c-fat'].forEach(function(id) {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderStats(); renderFoods();
      Toast.success('✅ "' + name + '" added to database!');
    });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async function() {
  BGAnim.init('database');
  // Show loading state in grid while fetching
  const grid = document.getElementById('foods-grid');
  if (grid) grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:2rem;margin-bottom:12px">⏳</div><div>Loading food database...</div></div>';

  await syncFromCloud(); // this calls FoodDB.load() + syncOverridesFromCloud()

  // Init after foods are loaded
  FoodDatabase.init();
  SideFigures.init();

  // Reveal content
  const loader = document.getElementById('page-loader');
  const pageContent = document.getElementById('page-content');
  if (loader) { loader.classList.add('hidden'); setTimeout(function() { loader.style.display='none'; }, 350); }
  if (pageContent) { requestAnimationFrame(function() { pageContent.classList.add('ready'); }); }
});

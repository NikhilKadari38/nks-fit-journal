// ============================================
// NK's Fit Journal — database.js
// Food Database: Browse, search, filter, add custom foods
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

  const renderStats = () => {
    const all = FoodDB.getAll();
    const statEl = document.getElementById('db-total');
    const vegEl = document.getElementById('db-veg');
    const nonvegEl = document.getElementById('db-nonveg');
    const customEl = document.getElementById('db-custom');
    if (statEl) statEl.textContent = all.length;
    if (vegEl) vegEl.textContent = all.filter(f => f.type === 'veg').length;
    if (nonvegEl) nonvegEl.textContent = all.filter(f => f.type === 'nonveg').length;
    if (customEl) customEl.textContent = NKStorage.getCustomFoods().length;
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

  const foodCardHTML = (food) => {
    return '<div class="food-db-card card card-sm" data-food-id="' + food.id + '" style="cursor:pointer;transition:all 0.2s">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<span class="' + (food.type === 'nonveg' ? 'nonveg-dot' : 'veg-dot') + '"></span>'
      + '<span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase">' + (food.type === 'nonveg' ? 'Non-Veg' : 'Veg') + '</span>'
      + '</div>'
      + (food.isCustom ? '<span class="pill" style="font-size:0.65rem;padding:2px 8px;background:rgba(0,122,204,0.1);color:var(--accent-primary)">Custom</span>' : '')
      + '</div>'
      + '<div style="font-weight:600;font-size:0.92rem;margin-bottom:8px;color:var(--text-primary)">' + food.name + '</div>'
      + '<div style="font-family:var(--heading-font);font-size:1.5rem;font-weight:700;color:var(--accent-primary);line-height:1;margin-bottom:4px">' + food.per100.calories + '</div>'
      + '<div style="font-size:0.72rem;color:var(--text-muted)">kcal / 100' + food.unit + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">'
      + '<div style="text-align:center"><div style="font-weight:700;font-size:0.85rem;color:#3B82F6">' + food.per100.protein + 'g</div><div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Protein</div></div>'
      + '<div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)"><div style="font-weight:700;font-size:0.85rem;color:#A78BFA">' + food.per100.carbs + 'g</div><div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Carbs</div></div>'
      + '<div style="text-align:center"><div style="font-weight:700;font-size:0.85rem;color:#FB923C">' + food.per100.fat + 'g</div><div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Fat</div></div>'
      + '</div>'
      + (food.isCustom ? '<button class="btn btn-danger btn-sm w-full delete-custom" data-id="' + food.id + '" style="margin-top:10px">🗑️ Delete</button>' : '')
      + '</div>';
  };

  const renderFoods = () => {
    const foods = FoodDB.searchFilter(searchQuery, currentFilter);
    const container = document.getElementById('foods-grid');
    if (!container) return;

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' items';

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1">'
        + '<span class="empty-state-icon">🔍</span>'
        + '<div class="empty-state-title">No foods found</div>'
        + '<div class="empty-state-desc">Try a different search or add a custom food item</div>'
        + '</div>';
      return;
    }

    // Group by category
    const grouped = {};
    foods.forEach(f => {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    });

    let html = '';
    Object.entries(grouped).forEach(function(entry) {
      const cat = entry[0];
      const items = entry[1];
      html += '<div class="db-category-section" style="grid-column:1/-1;margin-bottom:8px">';
      html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:8px">';
      html += '<span>' + cat + '</span>';
      html += '<span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">' + items.length + '</span>';
      html += '</div>';
      html += '<div class="grid-3" style="gap:12px">';
      items.forEach(food => { html += foodCardHTML(food); });
      html += '</div></div>';
    });
    container.innerHTML = html;

    bindFoodCardEvents(container);
  };

  const renderFoodsCustomOnly = () => {
    const foods = NKStorage.getCustomFoods();
    const container = document.getElementById('foods-grid');
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = foods.length + ' custom items';
    if (!container) return;

    if (foods.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1">'
        + '<span class="empty-state-icon">✏️</span>'
        + '<div class="empty-state-title">No custom foods yet</div>'
        + '<div class="empty-state-desc">Click "Add Custom Food" to add your own items</div>'
        + '</div>';
      return;
    }

    let html = '<div class="db-category-section" style="grid-column:1/-1;margin-bottom:8px">';
    html += '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent-primary);margin-bottom:12px;display:flex;align-items:center;gap:8px">';
    html += '<span>✏️ My Custom Foods</span>';
    html += '<span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">' + foods.length + '</span>';
    html += '</div><div class="grid-3" style="gap:12px">';
    foods.forEach(food => { html += foodCardHTML(food); });
    html += '</div></div>';
    container.innerHTML = html;

    bindFoodCardEvents(container);
  };

  const bindFoodCardEvents = (container) => {
    container.querySelectorAll('.food-db-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.delete-custom')) return;
        const food = FoodDB.getById(card.dataset.foodId);
        if (food) openQuickLog(food);
      });
    });
    container.querySelectorAll('.delete-custom').forEach(btn => {
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

  const openQuickLog = (food) => {
    const nameEl = document.getElementById('modal-food-name');
    const qtyEl = document.getElementById('modal-qty');
    const unitEl = document.getElementById('modal-unit');
    const previewEl = document.getElementById('modal-preview');
    if (nameEl) nameEl.textContent = food.name;
    if (unitEl) unitEl.textContent = food.unit;
    if (qtyEl) {
      qtyEl.value = food.defaultQty || 100;
      const update = () => {
        const qty = parseFloat(qtyEl.value) || 0;
        const m = FoodDB.calcMacros(food, qty);
        if (previewEl) {
          previewEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">'
            + [['Calories','calories','kcal','var(--accent-primary)'],['Protein','protein','g','#3B82F6'],['Carbs','carbs','g','#A78BFA'],['Fat','fat','g','#FB923C']].map(function(item) {
              const val = item[1] === 'calories' ? Math.round(m[item[1]]) : Utils.round1(m[item[1]]);
              return '<div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:10px">'
                + '<div style="font-size:1.1rem;font-weight:700;color:' + item[3] + ';font-family:var(--heading-font)">' + val + '</div>'
                + '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">' + item[0] + ' ' + item[2] + '</div>'
                + '</div>';
            }).join('')
            + '</div>';
        }
      };
      qtyEl.removeEventListener('input', qtyEl._updateHandler);
      qtyEl._updateHandler = update;
      qtyEl.addEventListener('input', update);
      update();
    }
    window._quickLogFood = food;
    Modal.open('add-food-modal');
  };

  const bindSearch = () => {
    const searchEl = document.getElementById('db-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQuery = searchEl.value;
        renderFoods();
      });
    }
  };

  const bindFilters = () => {
    // Filter tab buttons
    document.querySelectorAll('[data-db-filter]').forEach(btn => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.dbFilter));
    });
    // Stat card filter buttons
    document.querySelectorAll('.stat-filter-card').forEach(card => {
      card.addEventListener('click', () => {
        const filter = card.dataset.statFilter;
        if (filter === 'custom') {
          currentFilter = 'custom';
          searchQuery = '';
          const searchEl = document.getElementById('db-search');
          if (searchEl) searchEl.value = '';
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

  const bindAddCustom = () => {
    const openBtn = document.getElementById('open-add-custom');
    if (openBtn) openBtn.addEventListener('click', () => Modal.open('add-custom-modal'));

    // Quick log confirm button
    const logBtn = document.getElementById('add-food-btn');
    if (logBtn) logBtn.addEventListener('click', () => {
      const food = window._quickLogFood;
      if (!food) return;
      const qty = parseFloat(document.getElementById('modal-qty')?.value) || 0;
      if (qty <= 0) { Toast.error('Enter a valid quantity'); return; }
      const macros = FoodDB.calcMacros(food, qty);
      const entry = { foodId: food.id, name: food.name, qty, unit: food.unit, type: food.type, ...macros };
      const today = Utils.today();
      NKStorage.addFoodEntry(today, entry);
      Modal.close('add-food-modal');
      Toast.success('✅ ' + food.name + ' logged for today!');
      window._quickLogFood = null;
    });

    // Save custom food
    const saveBtn = document.getElementById('save-custom-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const name = document.getElementById('c-name')?.value?.trim();
      const calories = parseFloat(document.getElementById('c-calories')?.value);
      const protein = parseFloat(document.getElementById('c-protein')?.value) || 0;
      const carbs = parseFloat(document.getElementById('c-carbs')?.value) || 0;
      const fat = parseFloat(document.getElementById('c-fat')?.value) || 0;
      const type = document.getElementById('c-type')?.value || 'veg';
      const unit = document.getElementById('c-unit')?.value || 'g';
      const category = document.getElementById('c-category')?.value || 'Custom';

      if (!name) { Toast.error('Please enter a food name'); return; }
      if (isNaN(calories) || calories < 0) { Toast.error('Enter valid calories'); return; }

      NKStorage.addCustomFood({ name, type, unit, category, per100: { calories, protein, carbs, fat }, defaultQty: 100 });
      Modal.close('add-custom-modal');
      ['c-name','c-calories','c-protein','c-carbs','c-fat'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderStats();
      renderFoods();
      Toast.success('✅ "' + name + '" added to database!');
    });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('database');
  await syncFromCloud();
  FoodDatabase.init();
});

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
    if (vegEl) vegEl.textContent = all.filter(f=>f.type==='veg').length;
    if (nonvegEl) nonvegEl.textContent = all.filter(f=>f.type==='nonveg').length;
    if (customEl) customEl.textContent = NKStorage.getCustomFoods().length;
  };

  const renderFoods = () => {
    const foods = FoodDB.searchFilter(searchQuery, currentFilter);
    const container = document.getElementById('foods-grid');
    if (!container) return;

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${foods.length} items`;

    if (foods.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="empty-state-icon">🔍</span>
        <div class="empty-state-title">No foods found</div>
        <div class="empty-state-desc">Try a different search or add a custom food item</div>
      </div>`;
      return;
    }

    // Group by category
    const grouped = {};
    foods.forEach(f => {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    });

    container.innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div class="db-category-section" style="grid-column:1/-1; margin-bottom:8px">
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span>${cat}</span>
          <span style="background:var(--border-color);padding:2px 8px;border-radius:999px;font-size:0.7rem">${items.length}</span>
        </div>
        <div class="grid-3" style="gap:12px">
          ${items.map(food => `
            <div class="food-db-card card card-sm" data-food-id="${food.id}" style="cursor:pointer;transition:all 0.2s">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="${food.type==='nonveg'?'nonveg-dot':'veg-dot'}"></span>
                  <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase">${food.type==='nonveg'?'Non-Veg':'Veg'}</span>
                </div>
                ${food.isCustom?'<span class="pill" style="font-size:0.65rem;padding:2px 8px;background:rgba(0,122,204,0.1);color:var(--accent-primary)">Custom</span>':''}
              </div>
              <div style="font-weight:600;font-size:0.92rem;margin-bottom:8px;color:var(--text-primary)">${food.name}</div>
              <div style="font-family:var(--heading-font);font-size:1.5rem;font-weight:700;color:var(--accent-primary);line-height:1;margin-bottom:4px">${food.per100.calories}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">kcal / 100${food.unit}</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">
                <div style="text-align:center">
                  <div style="font-weight:700;font-size:0.85rem;color:#3B82F6">${food.per100.protein}g</div>
                  <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Protein</div>
                </div>
                <div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)">
                  <div style="font-weight:700;font-size:0.85rem;color:#A78BFA">${food.per100.carbs}g</div>
                  <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Carbs</div>
                </div>
                <div style="text-align:center">
                  <div style="font-weight:700;font-size:0.85rem;color:#FB923C">${food.per100.fat}g</div>
                  <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Fat</div>
                </div>
              </div>
              ${food.isCustom?`<button class="btn btn-danger btn-sm w-full mt-8 delete-custom" data-id="${food.id}" style="margin-top:10px">Delete</button>`:''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Click to quick-log
    container.querySelectorAll('.food-db-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-custom')) return;
        const food = FoodDB.getById(card.dataset.foodId);
        if (food) openQuickLog(food);
      });
    });

    // Delete custom
    container.querySelectorAll('.delete-custom').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this custom food?')) {
          NKStorage.deleteCustomFood(btn.dataset.id);
          renderStats(); renderFoods();
          Toast.info('Custom food deleted');
        }
      });
    });
  };

  const openQuickLog = (food) => {
    const modal = document.getElementById('quick-log-modal');
    document.getElementById('ql-food-name').textContent = food.name;
    const qtyEl = document.getElementById('ql-qty');
    const unitEl = document.getElementById('ql-unit');
    if (unitEl) unitEl.textContent = food.unit;
    if (qtyEl) {
      qtyEl.value = food.defaultQty || 100;
      const updatePreview = () => {
        const qty = parseFloat(qtyEl.value) || 0;
        const m = FoodDB.calcMacros(food, qty);
        ['calories','protein','carbs','fat'].forEach(k => {
          const el = document.getElementById('ql-' + k);
          if (el) el.textContent = k==='calories' ? Math.round(m[k]) : Utils.round1(m[k]);
        });
      };
      qtyEl.addEventListener('input', updatePreview);
      updatePreview();
    }
    const logBtn = document.getElementById('ql-log-btn');
    if (logBtn) {
      logBtn.onclick = () => {
        const qty = parseFloat(qtyEl?.value) || 0;
        if (qty <= 0) { Toast.error('Enter a valid quantity'); return; }
        const macros = FoodDB.calcMacros(food, qty);
        NKStorage.addFoodEntry(Utils.today(), { foodId:food.id, name:food.name, qty, unit:food.unit, type:food.type, ...macros });
        Modal.close('quick-log-modal');
        Toast.success(`✅ ${food.name} logged for today!`);
      };
    }
    Modal.open('quick-log-modal');
  };

  const bindSearch = () => {
    const el = document.getElementById('db-search');
    if (el) el.addEventListener('input', () => { searchQuery = el.value; renderFoods(); });
  };

  const bindFilters = () => {
    document.querySelectorAll('[data-db-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.dbFilter;
        document.querySelectorAll('[data-db-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFoods();
      });
    });
  };

  const bindAddCustom = () => {
    const btn = document.getElementById('add-custom-btn');
    if (btn) btn.addEventListener('click', () => Modal.open('add-custom-modal'));

    const saveBtn = document.getElementById('save-custom-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const name = document.getElementById('c-name')?.value?.trim();
      const type = document.getElementById('c-type')?.value;
      const unit = document.getElementById('c-unit')?.value || 'g';
      const calories = parseFloat(document.getElementById('c-calories')?.value);
      const protein = parseFloat(document.getElementById('c-protein')?.value);
      const carbs = parseFloat(document.getElementById('c-carbs')?.value);
      const fat = parseFloat(document.getElementById('c-fat')?.value);

      if (!name) { Toast.error('Enter a food name'); return; }
      if (isNaN(calories) || calories < 0) { Toast.error('Enter valid calories'); return; }
      if (isNaN(protein) || isNaN(carbs) || isNaN(fat)) { Toast.error('Enter all macro values'); return; }

      const category = document.getElementById('c-category')?.value || 'Custom';
      NKStorage.addCustomFood({ name, type, unit, category, per100:{ calories, protein, carbs, fat }, defaultQty:100 });
      Modal.close('add-custom-modal');
      // Reset form
      ['c-name','c-calories','c-protein','c-carbs','c-fat'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderStats(); renderFoods();
      Toast.success(`✅ "${name}" added to database!`);
    });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('database');
  await syncFromCloud();
  FoodDatabase.init();
});

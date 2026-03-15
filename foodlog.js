// ============================================
// NK's Fit Journal — foodlog.js
// Food Log: Add, view, delete food entries
// ============================================

const FoodLog = (() => {
  let activeDate, selectedFood = null, searchResults = [], currentFilter = 'all';

  const init = () => {
    activeDate = Utils.today();
    renderDateNav();
    renderLog();
    bindSearch();
    bindAddFoodModal();
    bindDateNav();
  };

  // ── Date Navigation ──
  const renderDateNav = () => {
    const today = Utils.today();
    const dateEl = document.getElementById('log-date');
    const dayLabel = document.getElementById('log-day-label');
    const nextBtn = document.getElementById('date-next');
    const pickerEl = document.getElementById('date-picker');

    if (dateEl) dateEl.textContent = Utils.formatDate(activeDate);
    if (pickerEl) pickerEl.value = activeDate;
    if (nextBtn) nextBtn.disabled = (activeDate >= today);

    // Day label
    if (dayLabel) {
      if (activeDate === today) {
        dayLabel.textContent = 'today';
      } else {
        const diff = Math.round((new Date(today) - new Date(activeDate)) / 86400000);
        dayLabel.textContent = diff === 1 ? 'yesterday' : `on ${Utils.formatDate(activeDate)}`;
      }
    }

    // Past day banner
    const existing = document.getElementById('past-day-banner');
    if (existing) existing.remove();
    if (activeDate < today) {
      const banner = document.createElement('div');
      banner.id = 'past-day-banner';
      banner.className = 'past-day-banner';
      banner.innerHTML = `📖 <span>Viewing past log — <strong>${Utils.formatDate(activeDate)}</strong>. Adding food will log it to this date.</span>`;
      const totalsStrip = document.querySelector('.totals-strip');
      if (totalsStrip) totalsStrip.parentNode.insertBefore(banner, totalsStrip);
    }
  };

  const bindDateNav = () => {
    const today = Utils.today();

    document.getElementById('date-prev')?.addEventListener('click', () => {
      const d = new Date(activeDate + 'T12:00:00'); // noon to avoid DST edge cases
      d.setDate(d.getDate() - 1);
      activeDate = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      renderDateNav();
      renderLog();
    });

    document.getElementById('date-next')?.addEventListener('click', () => {
      if (activeDate >= today) return;
      const d = new Date(activeDate + 'T12:00:00'); // noon to avoid DST edge cases
      d.setDate(d.getDate() + 1);
      activeDate = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      renderDateNav();
      renderLog();
    });

    // Clicking the date chip opens the date picker
    document.querySelector('.date-chip-clickable')?.addEventListener('click', () => {
      const picker = document.getElementById('date-picker');
      if (picker) picker.showPicker?.() || picker.click();
    });

    // Set max date on picker to today in user's timezone
    const pickerInput = document.getElementById('date-picker');
    if (pickerInput) pickerInput.max = today;

    document.getElementById('date-picker')?.addEventListener('change', (e) => {
      if (!e.target.value) return;
      if (e.target.value > today) { Toast.info("Can't log future dates!"); return; }
      activeDate = e.target.value;
      renderDateNav();
      renderLog();
    });
  };

  // ── Render Log ──
  const renderLog = () => {
    const entries = NKStorage.getFoodLog(activeDate);
    const container = document.getElementById('food-log-entries');
    const totals = entries.reduce((a, e) => {
      a.calories += e.calories || 0; a.protein += e.protein || 0;
      a.carbs += e.carbs || 0; a.fat += e.fat || 0; return a;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    // Totals
    ['calories','protein','carbs','fat'].forEach(m => {
      const el = document.getElementById(`log-total-${m}`);
      if (el) el.textContent = m === 'calories' ? Math.round(totals[m]) + ' kcal' : Utils.round1(totals[m]) + 'g';
    });

    // Entry count
    const countEl = document.getElementById('log-count');
    if (countEl) countEl.textContent = entries.length + ' item' + (entries.length !== 1 ? 's' : '');

    if (!container) return;

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <span class="empty-state-icon">🥗</span>
        <div class="empty-state-title">Nothing logged</div>
        <div class="empty-state-desc">${activeDate === Utils.today() ? 'Click "+ Add Food" to start logging your meals' : 'No food was logged on this day'}</div>
      </div>`;
      return;
    }

    container.innerHTML = entries.slice().reverse().map(entry => `
      <div class="log-entry anim-fade-in" data-id="${entry.id}">
        <span class="${entry.type==='nonveg'?'nonveg-dot':'veg-dot'}"></span>
        <div style="flex:1; min-width:0">
          <div class="log-entry-name">${entry.name}</div>
          <div class="log-entry-qty">${entry.qty}${entry.unit}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">
            P:<span class="macro-protein">${Utils.round1(entry.protein)}g</span>
            C:<span class="macro-carbs">${Utils.round1(entry.carbs)}g</span>
            F:<span class="macro-fat">${Utils.round1(entry.fat)}g</span>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0">
          <div class="log-entry-cal">${Math.round(entry.calories)}<span> kcal</span></div>
          <div class="log-entry-time">${Utils.formatTime(entry.addedAt)}</div>
        </div>
        <button class="log-entry-delete" data-delete="${entry.id}" title="Remove">✕</button>
      </div>
    `).join('');

    // Delete handlers
    container.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        NKStorage.deleteFoodEntry(activeDate, btn.dataset.delete);
        Toast.info('Entry removed');
        renderLog();
      });
    });
  };

  // ── Search ──
  const bindSearch = () => {
    const searchEl = document.getElementById('food-search');
    const resultsEl = document.getElementById('search-results');
    if (!searchEl) return;

    const render = () => {
      const q = searchEl.value;
      searchResults = FoodDB.searchFilter(q, currentFilter);
      if (!resultsEl) return;

      if (searchResults.length === 0) {
        resultsEl.innerHTML = `<div class="empty-state" style="padding:32px"><span class="empty-state-icon" style="font-size:2rem">🔍</span><div class="empty-state-title">No results</div></div>`;
        return;
      }

      resultsEl.innerHTML = searchResults.map(food => `
        <div class="food-item-card anim-fade-in" data-food-id="${food.id}" style="cursor:pointer">
          <span class="${food.type==='nonveg'?'nonveg-dot':'veg-dot'}"></span>
          <div style="flex:1; min-width:0">
            <div class="food-item-name">${food.name}</div>
            <div class="food-item-macros">P:${food.per100.protein}g · C:${food.per100.carbs}g · F:${food.per100.fat}g <span style="color:var(--text-muted)">per 100${food.unit}</span></div>
          </div>
          <div class="food-item-cal">${food.per100.calories}<span>kcal/100${food.unit}</span></div>
        </div>
      `).join('');

      resultsEl.querySelectorAll('[data-food-id]').forEach(card => {
        card.addEventListener('click', () => {
          const food = FoodDB.getById(card.dataset.foodId);
          if (food) openAddModal(food);
        });
      });
    };

    searchEl.addEventListener('input', render);

    document.querySelectorAll('[data-filter]').forEach(tab => {
      tab.addEventListener('click', () => {
        currentFilter = tab.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        render();
      });
    });

    render();
  };

  // ── Add Food Modal ──
  const openAddModal = (food) => {
    selectedFood = food;
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
        const macros = FoodDB.calcMacros(food, qty);
        if (previewEl) previewEl.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">
            ${[['Calories','calories','kcal','var(--accent-primary)'],['Protein','protein','g','#3B82F6'],['Carbs','carbs','g','#A78BFA'],['Fat','fat','g','#FB923C']].map(([l,k,u,c]) => `
              <div style="text-align:center;padding:10px;background:var(--bg-secondary);border-radius:10px">
                <div style="font-size:1.1rem;font-weight:700;color:${c};font-family:var(--heading-font)">${k==='calories'?Math.round(macros[k]):Utils.round1(macros[k])}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${l} ${u}</div>
              </div>
            `).join('')}
          </div>`;
      };
      qtyEl.addEventListener('input', update);
      update();
    }
    Modal.open('add-food-modal');
  };

  const bindAddFoodModal = () => {
    const addBtn = document.getElementById('add-food-btn');
    if (addBtn) addBtn.addEventListener('click', () => {
      if (!selectedFood) return;
      const qty = parseFloat(document.getElementById('modal-qty')?.value) || 0;
      if (qty <= 0) { Toast.error('Enter a valid quantity'); return; }
      const macros = FoodDB.calcMacros(selectedFood, qty);
      const entry = {
        foodId: selectedFood.id,
        name: selectedFood.name,
        qty, unit: selectedFood.unit,
        type: selectedFood.type,
        ...macros
      };
      NKStorage.addFoodEntry(activeDate, entry);
      Modal.close('add-food-modal');
      renderLog();
      Toast.success(`✅ ${selectedFood.name} added!`);
      selectedFood = null;
    });

    const openBtn = document.getElementById('open-add-food');
    if (openBtn) openBtn.addEventListener('click', () => {
      document.getElementById('food-search')?.focus();
    });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('foodlog');
  await syncFromCloud();
  FoodLog.init();
  SideFigures.init();

  // Reveal content smoothly
  const loader = document.getElementById('page-loader');
  const pageContent = document.getElementById('page-content');
  if (loader) { loader.classList.add('hidden'); setTimeout(function() { loader.style.display='none'; }, 350); }
  if (pageContent) { requestAnimationFrame(function() { pageContent.classList.add('ready'); }); }
});
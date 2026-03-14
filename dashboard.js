// ============================================
// NK's Fit Journal — dashboard.js
// Dashboard: Today summary, water, workout toggle, goal
// ============================================

const Dashboard = (() => {
  const PROFILE = { startWeight: 76, goalWeight: 65, caloriesRest: 1462, caloriesWorkout: 2034, waterGoalMl: 3000 };
  let today, isWorkout, todayLog, waterMl;

  const init = () => {
    today = Utils.today();
    todayLog = NKStorage.getFoodLog(today);
    isWorkout = NKStorage.isWorkoutDay(today);
    waterMl = NKStorage.getWater(today).ml || 0;

    renderDate();
    renderWorkoutToggle();
    renderSummary();
    renderGoalProgress();
    renderWater();
    renderFoodLog();
    renderWeightInput();
  };

  const renderDate = () => {
    const el = document.getElementById('today-date');
    if (el) el.textContent = Utils.formatDate(today);
    const dayEl = document.getElementById('today-day');
    if (dayEl) dayEl.textContent = Utils.getDayOfWeek(today);
  };

  const renderWorkoutToggle = () => {
    const btn = document.getElementById('workout-toggle-btn');
    const label = document.getElementById('workout-toggle-label');
    const goalType2 = (NKStorage.getProfile() || {}).goalType || 'lose';
    const calLabel = document.getElementById('cal-goal-label');
    if (!btn) return;
    btn.className = `toggle-btn ${isWorkout ? 'active' : ''}`;
    if (label) label.textContent = isWorkout ? '🏋️ Workout Day' : '😴 Rest Day';
    if (calLabel) calLabel.textContent = isWorkout ? '2,034' : '1,462';
    btn.addEventListener('click', () => {
      isWorkout = NKStorage.toggleWorkoutDay(today);
      renderWorkoutToggle();
      renderSummary();
    });
  };

  const getTotals = () => {
    return todayLog.reduce((acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein += entry.protein || 0;
      acc.carbs += entry.carbs || 0;
      acc.fat += entry.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const renderSummary = () => {
    const totals = getTotals();
    const goal = isWorkout ? PROFILE.caloriesWorkout : PROFILE.caloriesRest;
    const goalType3 = (NKStorage.getProfile() || {}).goalType || 'lose';
    const remaining = Math.abs(goal - totals.calories);
    const eaten = Utils.round1(totals.calories);

    // Calories eaten
    const eatenEl = document.getElementById('cal-eaten');
    if (eatenEl) eatenEl.textContent = Math.round(eaten);

    // Remaining
    const remEl = document.getElementById('cal-remaining');
    if (remEl) {
      remEl.textContent = Math.round(remaining);
      remEl.style.color = remaining <= 0 ? 'var(--error)' : '';
    }

    // Calorie ring
    MacroUI.drawRing('macro-canvas', eaten, goal, totals.protein, totals.carbs, totals.fat);

    // Macro bars
    const macroGoals = { protein: 136, carbs: isWorkout ? 246 : 138, fat: isWorkout ? 56 : 41 };
    ['protein','carbs','fat'].forEach(m => {
      const bar = document.getElementById(`bar-${m}`);
      const val = document.getElementById(`val-${m}`);
      const pct = Math.min((totals[m] / macroGoals[m]) * 100, 100);
      if (bar) bar.style.width = pct + '%';
      if (val) val.textContent = Utils.round1(totals[m]) + 'g / ' + macroGoals[m] + 'g';
    });

    // Macro display values
    document.querySelectorAll('[data-macro]').forEach(el => {
      const m = el.dataset.macro;
      if (totals[m] !== undefined) el.textContent = Utils.round1(totals[m]) + 'g';
    });
  };

  const renderGoalProgress = () => {
    const profile = NKStorage.getProfile() || {};
    const startWeight = profile.weight || PROFILE.startWeight;
    const goalWeight = profile.goalWeight || PROFILE.goalWeight;
    const goalType = profile.goalType || (startWeight > goalWeight ? 'lose' : startWeight < goalWeight ? 'gain' : 'maintain');

    // Get latest logged weight if available
    const allWeights = NKStorage.getAllWeights();
    const currentWeight = allWeights.length > 0
      ? allWeights[allWeights.length - 1].weight
      : startWeight;

    const totalDiff = Math.abs(startWeight - goalWeight);
    const changed = Utils.round1(Math.abs(startWeight - currentWeight));

    // Progress % — how much of the gap has been closed
    let pct = 0;
    if (totalDiff > 0) {
      if (goalType === 'lose') {
        pct = Utils.clamp(Math.round(((startWeight - currentWeight) / totalDiff) * 100), 0, 100);
      } else if (goalType === 'gain') {
        pct = Utils.clamp(Math.round(((currentWeight - startWeight) / totalDiff) * 100), 0, 100);
      } else {
        pct = 100; // maintain = already there
      }
    }

    const bar = document.getElementById('goal-bar');
    const pctEl = document.getElementById('goal-pct');
    const currWtEl = document.getElementById('current-weight');
    const changedEl = document.getElementById('weight-changed');
    const targetEl = document.getElementById('goal-target-weight');
    const labelEl = document.getElementById('goal-progress-label');

    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '% complete';
    if (currWtEl) currWtEl.textContent = currentWeight + ' kg';
    if (targetEl) targetEl.textContent = goalWeight + ' kg';
    if (changedEl) {
      if (goalType === 'lose') changedEl.textContent = changed + ' kg lost';
      else if (goalType === 'gain') changedEl.textContent = changed + ' kg gained';
      else changedEl.textContent = '⚖️ Maintaining';
    }
    if (labelEl) {
      if (goalType === 'lose') labelEl.textContent = '📉 Weight Loss Progress';
      else if (goalType === 'gain') labelEl.textContent = '📈 Weight Gain Progress';
      else labelEl.textContent = '⚖️ Weight Maintenance';
    }
  };

  const renderWater = () => {
    const pct = waterMl / PROFILE.waterGoalMl;
    WaterGlass.draw('water-glass-svg', pct);
    const mlEl = document.getElementById('water-ml');
    const targetEl = document.getElementById('water-target');
    if (mlEl) mlEl.textContent = waterMl + ' ml';
    if (targetEl) targetEl.textContent = 'Goal: ' + PROFILE.waterGoalMl + ' ml';

    // Add water buttons
    document.querySelectorAll('[data-water-add]').forEach(btn => {
      btn.onclick = () => {
        const add = parseInt(btn.dataset.waterAdd);
        waterMl = Math.min(waterMl + add, PROFILE.waterGoalMl);
        NKStorage.setWater(today, waterMl);
        renderWater();
        if (waterMl >= PROFILE.waterGoalMl) Toast.success('🎉 Water goal achieved!');
      };
    });

    const resetBtn = document.getElementById('water-reset');
    if (resetBtn) resetBtn.onclick = () => {
      waterMl = 0; NKStorage.setWater(today, 0); renderWater();
    };
  };

  const renderFoodLog = () => {
    todayLog = NKStorage.getFoodLog(today);
    const container = document.getElementById('today-log-list');
    if (!container) return;

    if (todayLog.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <span class="empty-state-icon">🍽️</span>
        <div class="empty-state-title">No food logged yet today</div>
        <div class="empty-state-desc">Head to <a href="foodlog.html">Food Log</a> to add meals</div>
      </div>`;
      return;
    }

    container.innerHTML = todayLog.slice(-5).reverse().map(entry => `
      <div class="log-entry anim-fade-in">
        <span class="${entry.type === 'nonveg' ? 'nonveg-dot' : 'veg-dot'}"></span>
        <div style="flex:1">
          <div class="log-entry-name">${entry.name}</div>
          <div class="log-entry-qty">${entry.qty}${entry.unit} · P:${entry.protein}g C:${entry.carbs}g F:${entry.fat}g</div>
        </div>
        <div>
          <div class="log-entry-cal">${Math.round(entry.calories)} <span>kcal</span></div>
          <div class="log-entry-time">${Utils.formatTime(entry.addedAt)}</div>
        </div>
      </div>
    `).join('');
  };

  const renderWeightInput = () => {
    const saved = NKStorage.getWeight(today);
    const input = document.getElementById('weight-input');
    const btn = document.getElementById('weight-save-btn');
    if (input && saved) input.value = saved.kg;
    if (btn) btn.onclick = () => {
      const val = parseFloat(input?.value);
      if (!val || val < 20 || val > 300) { Toast.error('Please enter a valid weight (20–300 kg)'); return; }
      const profile = NKStorage.getProfile() || {};
      profile.weight = val;
      NKStorage.setProfile(profile);
      NKStorage.setWeight(today, val);
      renderGoalProgress();
      Toast.success('✅ Weight saved: ' + val + ' kg');
    };
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('dashboard');
  await syncFromCloud();
  Dashboard.init();
});

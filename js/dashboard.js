// ============================================
// NK's Fit Journal — dashboard.js
// Dashboard: Today summary, water, workout toggle, goal
// ============================================

const Dashboard = (() => {
  // Fallback defaults — only used if user hasn't set up profile yet
  const DEFAULTS = {
    weight: 70, goalWeight: 65, goalType: 'lose',
    caloriesRest: 1800, caloriesModerate: 2200, caloriesWorkout: 2500,
    waterGoalMl: 3000,
    // Macros calculated dynamically from calorie targets — no hardcoded values
  };

  let today, dayType, todayLog, waterMl;

  // Always read fresh from profile — never use stale hardcoded values
  const getP = () => {
    const p = NKStorage.getProfile() || {};
    return {
      weight:         p.weight         || DEFAULTS.weight,
      goalWeight:     p.goalWeight     || DEFAULTS.goalWeight,
      // Always derive goalType from weights — never rely on stored value
      goalType: (p.weight && p.goalWeight)
        ? (p.weight < p.goalWeight ? 'gain' : p.weight > p.goalWeight ? 'lose' : 'maintain')
        : DEFAULTS.goalType,
      caloriesRest:     p.caloriesRest     || DEFAULTS.caloriesRest,
      caloriesModerate: p.caloriesModerate || DEFAULTS.caloriesModerate,
      caloriesWorkout:  p.caloriesWorkout  || DEFAULTS.caloriesWorkout,
      waterGoal:      p.waterGoal      || DEFAULTS.waterGoalMl,
    };
  };

  // Calculate macros from calories + goal type — no dependency on profile.js
  // Macro splits: lose = 35/25/40 (P/F/C), gain = 25/25/50 (P/F/C), maintain = 30/25/45
  const calcMacros = (calories, goalType) => {
    const splits = goalType === 'gain'
      ? { protein: 0.25, fat: 0.25, carbs: 0.50 }
      : goalType === 'lose'
      ? { protein: 0.35, fat: 0.25, carbs: 0.40 }
      : { protein: 0.30, fat: 0.25, carbs: 0.45 };
    return {
      protein: Math.round((calories * splits.protein) / 4),
      carbs:   Math.round((calories * splits.carbs)   / 4),
      fat:     Math.round((calories * splits.fat)     / 9),
    };
  };

  const init = () => {
    today = Utils.today();
    todayLog = NKStorage.getFoodLog(today);
    dayType = NKStorage.getDayType(today);
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

  const getDayCalories = (p) => {
    if (dayType === 'full')     return p.caloriesWorkout;
    if (dayType === 'moderate') return p.caloriesModerate;
    return p.caloriesRest;
  };

  const renderWorkoutToggle = () => {
    const p = getP();
    // Update active state on pill buttons
    document.querySelectorAll('.day-type-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.day === dayType);
    });
    // Update icon
    const icon = document.getElementById('day-type-icon');
    if (icon) {
      icon.textContent = dayType === 'full' ? '🏋️' : dayType === 'moderate' ? '🏃' : '😴';
    }
    // Update calorie goal label
    const calLabel = document.getElementById('cal-goal-label');
    if (calLabel) calLabel.textContent = getDayCalories(p).toLocaleString();

    // Bind click on each pill button
    document.querySelectorAll('.day-type-btn').forEach(function(btn) {
      btn.onclick = function() {
        dayType = NKStorage.setDayType(today, btn.dataset.day);
        renderWorkoutToggle();
        renderSummary();
      };
    });
  };

  const getTotals = () => {
    return todayLog.reduce(function(acc, entry) {
      acc.calories += entry.calories || 0;
      acc.protein  += entry.protein  || 0;
      acc.carbs    += entry.carbs    || 0;
      acc.fat      += entry.fat      || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const renderSummary = () => {
    const p = getP();
    const totals = getTotals();
    const goal = getDayCalories(p);
    const eaten = Utils.round1(totals.calories);
    const diff = Math.round(Math.abs(goal - totals.calories));
    const over = totals.calories > goal;

    // Calories eaten
    const eatenEl = document.getElementById('cal-eaten');
    if (eatenEl) eatenEl.textContent = Math.round(eaten);

    // Calorie goal label
    const calLabel = document.getElementById('cal-goal-label');
    if (calLabel) calLabel.textContent = goal.toLocaleString();

    // Remaining / needed label — changes based on goal type
    const remEl = document.getElementById('cal-remaining');
    const ringGoalEl = document.querySelector('.ring-goal');
    if (remEl) {
      remEl.textContent = diff;
      if (p.goalType === 'gain') {
        // For gain: going over is GOOD (green), under is normal
        remEl.style.color = over ? 'var(--success)' : '';
      } else {
        // For lose/maintain: going over is BAD (red)
        remEl.style.color = over ? 'var(--error)' : '';
      }
    }

    // Update the label text next to remaining
    if (ringGoalEl) {
      let remLabel = '';
      if (p.goalType === 'gain') {
        remLabel = over ? 'Over target: ' : 'Still to eat: ';
      } else {
        remLabel = over ? 'Over by: ' : 'Remaining: ';
      }
      ringGoalEl.innerHTML = 'Goal: <span id="cal-goal-label">' + goal.toLocaleString() + '</span> kcal &nbsp;|&nbsp; '
        + remLabel + '<span id="cal-remaining" style="color:' + (p.goalType === 'gain' ? (over ? 'var(--success)' : '') : (over ? 'var(--error)' : '')) + '">' + diff + '</span> kcal';
    }

    // Calorie ring
    MacroUI.drawRing('macro-canvas', eaten, goal, totals.protein, totals.carbs, totals.fat);

    // Macro bars — always calculate fresh from calorie goal + goal type
    const goalType = (p.weight && p.goalWeight)
      ? (p.weight < p.goalWeight ? 'gain' : p.weight > p.goalWeight ? 'lose' : 'maintain')
      : 'lose';
    const macroGoals = calcMacros(goal, goalType);
    ['protein', 'carbs', 'fat'].forEach(function(m) {
      const bar = document.getElementById('bar-' + m);
      const val = document.getElementById('val-' + m);
      const pct = Math.min((totals[m] / macroGoals[m]) * 100, 100);
      if (bar) bar.style.width = pct + '%';
      if (val) val.textContent = Utils.round1(totals[m]) + 'g / ' + macroGoals[m] + 'g';
    });

    // Macro display values
    document.querySelectorAll('[data-macro]').forEach(function(el) {
      const m = el.dataset.macro;
      if (totals[m] !== undefined) el.textContent = Utils.round1(totals[m]) + 'g';
    });
  };

  const renderGoalProgress = () => {
    const p = getP();
    const goalType = (p.weight && p.goalWeight)
      ? (p.weight < p.goalWeight ? 'gain' : p.weight > p.goalWeight ? 'lose' : 'maintain')
      : 'lose';

    // Get latest logged weight
    const allWeights = NKStorage.getAllWeights();
    const currentWeight = allWeights.length > 0
      ? allWeights[allWeights.length - 1].weight
      : p.weight;
    const startWeight = p.weight;
    const goalWeight  = p.goalWeight;

    const totalDiff = Math.abs(startWeight - goalWeight);
    const changed = Utils.round1(Math.abs(currentWeight - startWeight));

    let pct = 0;
    if (totalDiff > 0) {
      if (goalType === 'lose') {
        pct = Utils.clamp(Math.round(((startWeight - currentWeight) / totalDiff) * 100), 0, 100);
      } else if (goalType === 'gain') {
        pct = Utils.clamp(Math.round(((currentWeight - startWeight) / totalDiff) * 100), 0, 100);
      } else {
        pct = 100;
      }
    }

    const bar      = document.getElementById('goal-bar');
    const pctEl    = document.getElementById('goal-pct');
    const currWtEl = document.getElementById('current-weight');
    const changedEl= document.getElementById('weight-changed');
    const targetEl = document.getElementById('goal-target-weight');
    const labelEl  = document.getElementById('goal-progress-label');

    if (bar)      bar.style.width = pct + '%';
    if (pctEl)    pctEl.textContent = pct + '% complete';
    if (currWtEl) currWtEl.textContent = currentWeight + ' kg';
    if (targetEl) targetEl.textContent = goalWeight + ' kg';

    if (changedEl) {
      if      (goalType === 'lose')     changedEl.textContent = changed + ' kg lost';
      else if (goalType === 'gain')     changedEl.textContent = changed + ' kg gained';
      else                              changedEl.textContent = '⚖️ Maintaining';
    }
    if (labelEl) {
      if      (goalType === 'lose')     labelEl.textContent = '📉 Weight Loss Progress';
      else if (goalType === 'gain')     labelEl.textContent = '📈 Weight Gain Progress';
      else                              labelEl.textContent = '⚖️ Weight Maintenance';
    }
  };

  const renderWater = () => {
    const p = getP();
    const waterGoal = p.waterGoal;
    const pct = waterMl / waterGoal;
    WaterGlass.draw('water-glass-svg', pct);

    const mlEl     = document.getElementById('water-ml');
    const targetEl = document.getElementById('water-target');
    if (mlEl)     mlEl.textContent    = waterMl + ' ml';
    if (targetEl) targetEl.textContent = 'Goal: ' + waterGoal + ' ml';

    document.querySelectorAll('[data-water-add]').forEach(function(btn) {
      btn.onclick = function() {
        const add = parseInt(btn.dataset.waterAdd);
        waterMl = Math.min(waterMl + add, waterGoal);
        NKStorage.setWater(today, waterMl);
        renderWater();
        if (waterMl >= waterGoal) Toast.success('🎉 Water goal achieved!');
      };
    });

    const resetBtn = document.getElementById('water-reset');
    if (resetBtn) resetBtn.onclick = function() {
      waterMl = 0; NKStorage.setWater(today, 0); renderWater();
    };
  };

  const renderFoodLog = () => {
    todayLog = NKStorage.getFoodLog(today);
    const container = document.getElementById('today-log-list');
    if (!container) return;

    if (todayLog.length === 0) {
      container.innerHTML = '<div class="empty-state">'
        + '<span class="empty-state-icon">🍽️</span>'
        + '<div class="empty-state-title">No food logged yet today</div>'
        + '<div class="empty-state-desc">Head to <a href="foodlog.html">Food Log</a> to add meals</div>'
        + '</div>';
      return;
    }

    container.innerHTML = todayLog.slice(-5).reverse().map(function(entry) {
      return '<div class="log-entry anim-fade-in">'
        + '<span class="' + (entry.type === 'nonveg' ? 'nonveg-dot' : 'veg-dot') + '"></span>'
        + '<div style="flex:1">'
        + '<div class="log-entry-name">' + entry.name + '</div>'
        + '<div class="log-entry-qty">' + entry.qty + entry.unit + ' · P:' + entry.protein + 'g C:' + entry.carbs + 'g F:' + entry.fat + 'g</div>'
        + '</div>'
        + '<div>'
        + '<div class="log-entry-cal">' + Math.round(entry.calories) + ' <span>kcal</span></div>'
        + '<div class="log-entry-time">' + Utils.formatTime(entry.addedAt) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  };

  const renderWeightInput = () => {
    const saved = NKStorage.getWeight(today);
    const input = document.getElementById('weight-input');
    const btn   = document.getElementById('weight-save-btn');
    if (input && saved) input.value = saved.kg;
    if (btn) btn.onclick = function() {
      const val = parseFloat(input ? input.value : 0);
      if (!val || val < 20 || val > 300) { Toast.error('Please enter a valid weight (20–300 kg)'); return; }

      // Save daily weight log
      NKStorage.setWeight(today, val);

      // Recalculate BMR + calorie targets and save to profile
      const result = window.FitnessCalc ? window.FitnessCalc.recalcAndSave(val) : null;

      if (result) {
        const goalLabel = result.goalType === 'gain' ? '📈 Weight Gain' : result.goalType === 'lose' ? '📉 Weight Loss' : '⚖️ Maintain';
        const m = result.macros;
        Toast.success('✅ Weight saved! BMR: ' + result.bmr + ' kcal · ' + goalLabel
          + ' · P:' + m.protein + 'g C:' + m.carbs + 'g F:' + m.fat + 'g');
      } else {
        // FitnessCalc not available (profile.js not loaded) — just save weight
        const profile = NKStorage.getProfile() || {};
        profile.weight = val;
        NKStorage.setProfile(profile);
        Toast.success('✅ Weight saved: ' + val + ' kg');
      }

      // Refresh dashboard display
      renderGoalProgress();
      renderWorkoutToggle();
      renderSummary();
    };
  };

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', async function() {
  BGAnim.init('dashboard');
  await syncFromCloud();
  Dashboard.init();
  SideFigures.init();

  // Reveal content smoothly after all values are populated
  const loader = document.getElementById('page-loader');
  const content = document.getElementById('dashboard-content');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(function() { loader.style.display = 'none'; }, 350);
  }
  if (content) {
    requestAnimationFrame(function() {
      content.classList.add('ready');
    });
  }
});

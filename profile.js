// ============================================
// NK's Fit Journal — profile.js
// Profile: User stats, goals, dietary prefs
// ============================================

const ProfilePage = (() => {
  const DEFAULTS = {
    name: '', dob: '',
    weight: null, height: null, goalWeight: null,
    goalType: null,
    dietaryPref: 'veg', caloriesRest: null, caloriesModerate: null, caloriesWorkout: null, calAdjustment: 500,
    waterGoal: 3000, activityLevel: 'moderate'
  };

  // Auto-calculate 3 calorie targets from BMR + adjustment
  const calcCaloriesFromBMR = (bmr, adjustment, goalType) => {
    const sign = (goalType === 'gain') ? 1 : -1;
    return {
      rest:     Math.round(bmr * 1.2     + sign * adjustment),
      moderate: Math.round(bmr * 1.55    + sign * adjustment),
      full:     Math.round(bmr * 1.725   + sign * adjustment),
    };
  };

  const applyAutoCalc = () => {
    const weight = parseFloat(document.getElementById('p-weight')?.value);
    const height = parseFloat(document.getElementById('p-height')?.value);
    const dob    = document.getElementById('p-dob')?.value;
    const adj    = parseFloat(document.getElementById('p-cal-adjustment')?.value) || 500;
    const goalW  = parseFloat(document.getElementById('p-goal-weight')?.value);
    const currW  = weight;

    if (!weight || !height || !dob) return;

    const age = calcAge(dob);
    const bmr = calcBMR(weight, height, age);
    const goalType = (currW && goalW) ? (currW < goalW ? 'gain' : 'lose') : 'lose';
    const targets = calcCaloriesFromBMR(bmr, adj, goalType);

    const restEl = document.getElementById('p-calories-rest');
    const modEl  = document.getElementById('p-calories-moderate');
    const fullEl = document.getElementById('p-calories-workout');
    if (restEl) restEl.value = targets.rest;
    if (modEl)  modEl.value  = targets.moderate;
    if (fullEl) fullEl.value = targets.full;

    // Update adjustment label
    const adjLabel = document.getElementById('cal-adjust-label');
    if (adjLabel) adjLabel.textContent = goalType === 'gain'
      ? '📈 Daily Calorie Surplus'
      : '📉 Daily Calorie Deficit';

    // Show macro preview for all 3 day types
    const macroPreviewEl = document.getElementById('macro-preview');
    if (macroPreviewEl && window.FitnessCalc) {
      const split = goalType === 'gain' ? '25/25/50' : goalType === 'lose' ? '35/25/40' : '30/25/45';
      const mr = FitnessCalc.calcMacros(targets.rest,     goalType);
      const mm = FitnessCalc.calcMacros(targets.moderate, goalType);
      const mf = FitnessCalc.calcMacros(targets.full,     goalType);
      macroPreviewEl.innerHTML =
        '<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;font-size:0.78rem">'
        + '<div style="font-weight:600;color:var(--text-muted);margin-bottom:2px">📊 Macro targets (' + split + '% P/C/F)</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>😴 Rest</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mr.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mr.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mr.fat + 'g F</span></span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>🏃 Moderate</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mm.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mm.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mm.fat + 'g F</span></span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>🏋️ Full Workout</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mf.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mf.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mf.fat + 'g F</span></span>'
        + '</div>'
        + '</div>';
    }
  };

  const init = () => {
    loadProfile();
    bindSave();
    renderStats();
  };

  const calcAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calcBMI = (weight, height) => Utils.round1(weight / ((height/100) ** 2));

  const calcBMR = (weight, height, age) => Math.round(10*weight + 6.25*height - 5*age + 5);

  const loadProfile = () => {
    // Set initials immediately from username while Firebase loads
    const avatarEl = document.getElementById('avatar-initials');
    if (avatarEl) {
      const savedProfile = NKStorage.getProfile();
      if (savedProfile?.name) {
        const parts = savedProfile.name.trim().split(' ').filter(Boolean);
        avatarEl.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
      } else {
        // Fallback: use first 2 chars of username
        const username = Auth.getCurrentUser() || 'NK';
        avatarEl.textContent = username.substring(0, 2).toUpperCase();
      }
    }
    const saved = NKStorage.getProfile() || {};
    // Only apply DEFAULTS for non-personal fields — never pre-fill weight/height/name for new users
    const profile = {
      name:             saved.name             || '',
      dob:              saved.dob              || '',
      weight:           saved.weight           || null,
      height:           saved.height           || null,
      goalWeight:       saved.goalWeight       || null,
      goalType:         saved.goalType         || null,
      dietaryPref:      saved.dietaryPref      || 'veg',
      caloriesRest:     saved.caloriesRest     || null,
      caloriesModerate: saved.caloriesModerate || null,
      caloriesWorkout:  saved.caloriesWorkout  || null,
      calAdjustment:    saved.calAdjustment    || 500,
      waterGoal:        saved.waterGoal        || 3000,
      activityLevel:    saved.activityLevel    || 'moderate',
    };
    const fields = ['name','dob','weight','height','goal-weight','goal-type','dietary-pref','calories-rest','calories-moderate','calories-workout','water-goal','cal-adjustment'];
    fields.forEach(f => {
      const el = document.getElementById('p-' + f);
      const key = f.replace(/-./g, m => m[1].toUpperCase());
      if (el && profile[key] !== undefined) el.value = profile[key];
    });
    // Always sync the dropdown to match the actual weights
    const goalTypeEl = document.getElementById('p-goal-type');
    if (goalTypeEl) {
      if (profile.weight < profile.goalWeight) goalTypeEl.value = 'gain';
      else if (profile.weight > profile.goalWeight) goalTypeEl.value = 'lose';
      else goalTypeEl.value = 'maintain';
    }
    // Load cal adjustment field manually since it uses different key format
    const adjEl = document.getElementById('p-cal-adjustment');
    if (adjEl && profile.calAdjustment) adjEl.value = profile.calAdjustment;
    const modEl = document.getElementById('p-calories-moderate');
    if (modEl && profile.caloriesModerate) modEl.value = profile.caloriesModerate;
    // Update label
    const goalTypeDetected = (profile.weight && profile.goalWeight)
      ? (profile.weight < profile.goalWeight ? 'gain' : 'lose') : 'lose';
    const adjLabel = document.getElementById('cal-adjust-label');
    if (adjLabel) adjLabel.textContent = goalTypeDetected === 'gain'
      ? '📈 Daily Calorie Surplus' : '📉 Daily Calorie Deficit';
    renderProfileDisplay(profile);
  };

  const renderProfileDisplay = (profile) => {
    const age = calcAge(profile.dob || DEFAULTS.dob);
    const bmi = calcBMI(profile.weight, profile.height);
    const bmr = calcBMR(profile.weight, profile.height, age);
    // Always derive from weights — stored value may be stale/wrong
    const goalType = (profile.weight < profile.goalWeight) ? 'gain' : (profile.weight > profile.goalWeight) ? 'lose' : 'maintain';
    const toGoal = Utils.round1(Math.abs(profile.weight - profile.goalWeight));

    // Update avatar initials dynamically
    const avatarEl = document.getElementById('avatar-initials');
    if (avatarEl) {
      const parts = (profile.name || Auth.getCurrentUser() || 'NK').trim().split(' ').filter(Boolean);
      const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'NK';
      avatarEl.textContent = initials;
    }

    const fields = {
      'display-name': profile.name,
      'display-age': age + ' years',
      'display-weight': profile.weight + ' kg',
      'display-height': profile.height + ' cm',
      'display-bmi': bmi,
      'display-bmr': bmr + ' kcal',
      'display-goal': profile.goalWeight + ' kg',
      'display-to-goal': toGoal === 0 ? '🎉 Goal reached!' :
        goalType === 'lose' ? toGoal + ' kg to lose' :
        goalType === 'gain' ? toGoal + ' kg to gain' :
        '⚖️ Maintaining',
      'display-diet': profile.dietaryPref === 'veg' ? '🌱 Vegetarian' : profile.dietaryPref === 'nonveg' ? '🍗 Non-Vegetarian' : '🌿 Vegan',
      'display-cal-rest':     (profile.caloriesRest     || '--') + ' kcal',
      'display-cal-moderate': (profile.caloriesModerate || '--') + ' kcal',
      'display-cal-workout':  (profile.caloriesWorkout  || '--') + ' kcal',
      'display-water': (profile.waterGoal / 1000).toFixed(1) + ' L/day',
    };

    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // BMI color
    const bmiEl = document.getElementById('display-bmi');
    if (bmiEl) {
      bmiEl.style.color = bmi < 18.5 ? 'var(--info)' : bmi < 25 ? 'var(--success)' : bmi < 30 ? 'var(--warning)' : 'var(--error)';
    }

    // To Goal label
    const toGoalLabelEl = document.getElementById('to-goal-label');
    if (toGoalLabelEl) {
      toGoalLabelEl.textContent = goalType === 'lose' ? 'To Lose' : goalType === 'gain' ? 'To Gain' : 'Goal';
    }

    // BMI label
    const bmiLabel = document.getElementById('bmi-label');
    if (bmiLabel) {
      const labels = [[18.5,'Underweight'],[25,'Normal'],[30,'Overweight'],[Infinity,'Obese']];
      bmiLabel.textContent = labels.find(([max]) => bmi < max)?.[1] || 'Obese';
    }
  };

  const bindSave = () => {
    // Auto-recalc when weight/height/dob/adjustment changes
    ['p-weight','p-height','p-dob','p-goal-weight','p-cal-adjustment'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', applyAutoCalc);
    });
    // Recalc button
    const recalcBtn = document.getElementById('recalc-calories-btn');
    if (recalcBtn) recalcBtn.addEventListener('click', applyAutoCalc);

    const btn = document.getElementById('save-profile-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const profile = {
        name: document.getElementById('p-name')?.value?.trim() || '',
        dob: document.getElementById('p-dob')?.value || '',
        weight: parseFloat(document.getElementById('p-weight')?.value) || null,
        height: parseFloat(document.getElementById('p-height')?.value) || null,
        goalWeight: parseFloat(document.getElementById('p-goal-weight')?.value) || null,
        goalType: document.getElementById('p-goal-type')?.value || DEFAULTS.goalType,
        dietaryPref: document.getElementById('p-dietary-pref')?.value || DEFAULTS.dietaryPref,
        caloriesRest:     parseInt(document.getElementById('p-calories-rest')?.value)     || null,
        caloriesModerate: parseInt(document.getElementById('p-calories-moderate')?.value) || null,
        calAdjustment:    parseInt(document.getElementById('p-cal-adjustment')?.value)    || DEFAULTS.calAdjustment,
        caloriesWorkout: parseInt(document.getElementById('p-calories-workout')?.value) || null,
        waterGoal: parseInt(document.getElementById('p-water-goal')?.value) || DEFAULTS.waterGoal,
      };

      if (!profile.name) { Toast.error('Please enter your name'); return; }
      if (profile.weight < 20 || profile.weight > 300) { Toast.error('Enter a valid weight'); return; }
      if (profile.height < 100 || profile.height > 250) { Toast.error('Enter a valid height (cm)'); return; }

      NKStorage.setProfile(profile);
    // Always sync the dropdown to match the actual weights
    const goalTypeEl = document.getElementById('p-goal-type');
    if (goalTypeEl) {
      if (profile.weight < profile.goalWeight) goalTypeEl.value = 'gain';
      else if (profile.weight > profile.goalWeight) goalTypeEl.value = 'lose';
      else goalTypeEl.value = 'maintain';
    }
    // Load cal adjustment field manually since it uses different key format
    const adjEl = document.getElementById('p-cal-adjustment');
    if (adjEl && profile.calAdjustment) adjEl.value = profile.calAdjustment;
    const modEl = document.getElementById('p-calories-moderate');
    if (modEl && profile.caloriesModerate) modEl.value = profile.caloriesModerate;
    // Update label
    const goalTypeDetected = (profile.weight && profile.goalWeight)
      ? (profile.weight < profile.goalWeight ? 'gain' : 'lose') : 'lose';
    const adjLabel = document.getElementById('cal-adjust-label');
    if (adjLabel) adjLabel.textContent = goalTypeDetected === 'gain'
      ? '📈 Daily Calorie Surplus' : '📉 Daily Calorie Deficit';
    renderProfileDisplay(profile);
      renderStats();
      Toast.success('✅ Profile saved successfully!');
    });
  };

  const renderStats = () => {
    const allDates = NKStorage.getAllLogDates();
    const allWeights = NKStorage.getAllWeights();
    const totalDays = allDates.length;
    const totalEntries = allDates.reduce((s,d) => s + NKStorage.getFoodLog(d).length, 0);

    const el = id => document.getElementById(id);
    if (el('stats-days-logged')) el('stats-days-logged').textContent = totalDays;
    if (el('stats-food-entries')) el('stats-food-entries').textContent = totalEntries;
    if (el('stats-weights-logged')) el('stats-weights-logged').textContent = allWeights.length;

    // Joined date
    const joinEl = el('stats-joined');
    if (joinEl) {
      const settings = NKStorage.getSettings();
      if (!settings.joinedDate) { NKStorage.updateSettings({ joinedDate: Utils.today() }); }
      joinEl.textContent = Utils.formatDateShort(NKStorage.getSettings().joinedDate || Utils.today());
    }

    // Clear data button
    const clearBtn = el('clear-data-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('⚠️ This will delete ALL your food logs, weight history, and water data. Your profile settings will be kept.\n\nAre you absolutely sure?')) {
        // Clear only logs/weight/water, keep profile and settings
        const keys = Object.keys(localStorage).filter(k =>
          k.startsWith('nkj_foodlog_') || k.startsWith('nkj_weight_') || k.startsWith('nkj_water_')
        );
        keys.forEach(k => localStorage.removeItem(k));
        Toast.success('Data cleared. Fresh start! 💪');
        renderStats();
      }
    });
  };

  return { init };
})();


// ── Admin Panel ──
const AdminPanel = (() => {
  const loadUsers = async () => {
    const list = document.getElementById('users-list');
    if (!list) return;
    list.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">Loading...</div>';
    const users = await Auth.getAllUsers();
    if (!users.length) { list.innerHTML = '<div style="color:var(--text-muted)">No users found.</div>'; return; }
    list.innerHTML = users.map(u => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--bg-secondary);border-radius:12px;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-weight:600;font-size:0.95rem">${u.displayName} <span style="color:var(--text-muted);font-weight:400;font-size:0.82rem">@${u.username}</span>
            ${u.role === 'admin' ? '<span style="background:var(--accent-primary);color:white;font-size:0.68rem;padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:600">ADMIN</span>' : ''}
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px">
            Joined: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'} &nbsp;|&nbsp;
            Last login: ${u.lastLogin && u.lastLogin !== '—' ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
          </div>
        </div>
        ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="AdminPanel.confirmDelete('${u.username}', '${u.displayName}')">🗑️ Remove</button>` : '<span style="font-size:0.75rem;color:var(--text-muted)">Protected</span>'}
      </div>
    `).join('');
  };

  const confirmDelete = (username, displayName) => {
    Modal.open('confirm-delete-modal');
    document.getElementById('delete-user-name').textContent = displayName + ' (@' + username + ')';
    document.getElementById('confirm-delete-btn').onclick = async () => {
      Modal.close('confirm-delete-modal');
      const result = await Auth.deleteUser(username);
      if (result.success) { Toast.success('✅ User ' + displayName + ' removed.'); loadUsers(); }
      else Toast.error('❌ ' + result.error);
    };
  };

  // Auto-calculate 3 calorie targets from BMR + adjustment
  const calcCaloriesFromBMR = (bmr, adjustment, goalType) => {
    const sign = (goalType === 'gain') ? 1 : -1;
    return {
      rest:     Math.round(bmr * 1.2     + sign * adjustment),
      moderate: Math.round(bmr * 1.55    + sign * adjustment),
      full:     Math.round(bmr * 1.725   + sign * adjustment),
    };
  };

  const applyAutoCalc = () => {
    const weight = parseFloat(document.getElementById('p-weight')?.value);
    const height = parseFloat(document.getElementById('p-height')?.value);
    const dob    = document.getElementById('p-dob')?.value;
    const adj    = parseFloat(document.getElementById('p-cal-adjustment')?.value) || 500;
    const goalW  = parseFloat(document.getElementById('p-goal-weight')?.value);
    const currW  = weight;

    if (!weight || !height || !dob) return;

    const age = calcAge(dob);
    const bmr = calcBMR(weight, height, age);
    const goalType = (currW && goalW) ? (currW < goalW ? 'gain' : 'lose') : 'lose';
    const targets = calcCaloriesFromBMR(bmr, adj, goalType);

    const restEl = document.getElementById('p-calories-rest');
    const modEl  = document.getElementById('p-calories-moderate');
    const fullEl = document.getElementById('p-calories-workout');
    if (restEl) restEl.value = targets.rest;
    if (modEl)  modEl.value  = targets.moderate;
    if (fullEl) fullEl.value = targets.full;

    // Update adjustment label
    const adjLabel = document.getElementById('cal-adjust-label');
    if (adjLabel) adjLabel.textContent = goalType === 'gain'
      ? '📈 Daily Calorie Surplus'
      : '📉 Daily Calorie Deficit';

    // Show macro preview for all 3 day types
    const macroPreviewEl = document.getElementById('macro-preview');
    if (macroPreviewEl && window.FitnessCalc) {
      const split = goalType === 'gain' ? '25/25/50' : goalType === 'lose' ? '35/25/40' : '30/25/45';
      const mr = FitnessCalc.calcMacros(targets.rest,     goalType);
      const mm = FitnessCalc.calcMacros(targets.moderate, goalType);
      const mf = FitnessCalc.calcMacros(targets.full,     goalType);
      macroPreviewEl.innerHTML =
        '<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;font-size:0.78rem">'
        + '<div style="font-weight:600;color:var(--text-muted);margin-bottom:2px">📊 Macro targets (' + split + '% P/C/F)</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>😴 Rest</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mr.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mr.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mr.fat + 'g F</span></span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>🏃 Moderate</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mm.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mm.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mm.fat + 'g F</span></span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-card);border-radius:8px">'
        +   '<span>🏋️ Full Workout</span>'
        +   '<span><span style="color:#3B82F6;font-weight:600">' + mf.protein + 'g P</span> · <span style="color:#A78BFA;font-weight:600">' + mf.carbs + 'g C</span> · <span style="color:#FB923C;font-weight:600">' + mf.fat + 'g F</span></span>'
        + '</div>'
        + '</div>';
    }
  };

  const init = () => {
    if (!Auth.isAdmin()) return;
    const panel = document.getElementById('admin-panel');
    if (panel) panel.style.display = 'block';
    loadUsers();
    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadUsers);
    bindCSVAdmin();
  };

  const bindCSVAdmin = () => {
    // Download CSV
    const downloadBtn = document.getElementById('download-csv-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', () => {
      const csv = FoodDB.adminExportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'nk-food-database.csv';
      a.click(); URL.revokeObjectURL(url);
      Toast.success('✅ CSV downloaded!');
    });

    // Upload CSV
    const uploadInput = document.getElementById('upload-csv-input');
    if (uploadInput) uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const statusEl = document.getElementById('csv-status');
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--text-muted)';
      statusEl.textContent = '⏳ Uploading and processing...';
      try {
        const text = await file.text();
        const count = await FoodDB.adminImportCSV(text);
        statusEl.style.color = 'var(--success)';
        statusEl.textContent = '✅ Uploaded ' + count + ' foods successfully! All users will see updated values.';
        Toast.success('✅ Database updated with ' + count + ' foods!');
      } catch (err) {
        statusEl.style.color = 'var(--error)';
        statusEl.textContent = '❌ Error: ' + err.message;
      }
      uploadInput.value = '';
    });

    // Migrate built-in foods
    const migrateBtn = document.getElementById('migrate-foods-btn');
    if (migrateBtn) migrateBtn.addEventListener('click', async () => {
      if (!confirm('This will push all default foods to Firebase. Continue?')) return;
      const statusEl = document.getElementById('migrate-status');
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--text-muted)';
      statusEl.textContent = '⏳ Migrating foods to Firebase...';
      migrateBtn.disabled = true;
      try {
        // Built-in foods from the old FOOD_DATABASE if still available
        const foods = window.FOOD_DATABASE || [];
        if (!foods.length) {
          statusEl.style.color = 'var(--error)';
          statusEl.textContent = '❌ No built-in foods found. Upload a CSV instead.';
          migrateBtn.disabled = false;
          return;
        }
        const count = await FoodDB.adminMigrateAll(foods);
        statusEl.style.color = 'var(--success)';
        statusEl.textContent = '✅ Migrated ' + count + ' foods to Firebase!';
        Toast.success('✅ Migration complete! ' + count + ' foods in Firebase.');
      } catch (err) {
        statusEl.style.color = 'var(--error)';
        statusEl.textContent = '❌ Error: ' + err.message;
        migrateBtn.disabled = false;
      }
    });
  };

  return { init, loadUsers, confirmDelete };
})();

// Expose BMR calc functions globally for use in dashboard.js
window.FitnessCalc = {
  calcAge: (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  },
  calcBMI: (weight, height) => Utils.round1(weight / ((height/100) ** 2)),
  calcBMR: (weight, height, age) => Math.round(10*weight + 6.25*height - 5*age + 5),
  calcCaloriesFromBMR: (bmr, adjustment, goalType) => {
    const sign = (goalType === 'gain') ? 1 : -1;
    return {
      rest:     Math.round(bmr * 1.2   + sign * adjustment),
      moderate: Math.round(bmr * 1.55  + sign * adjustment),
      full:     Math.round(bmr * 1.725 + sign * adjustment),
    };
  },
  // Macro splits (Protein / Fat / Carbs %)
  // Lose:     35 / 25 / 40
  // Gain:     25 / 25 / 50
  // Maintain: 30 / 25 / 45
  calcMacros: (calories, goalType) => {
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
  },
  recalcAndSave: (newWeight) => {
    const profile = NKStorage.getProfile() || {};
    if (!profile.height || !profile.dob) return; // can't calc without height/dob
    profile.weight = newWeight;
    const age = FitnessCalc.calcAge(profile.dob);
    const bmr = FitnessCalc.calcBMR(newWeight, profile.height, age);
    const goalType = (newWeight < profile.goalWeight) ? 'gain'
                   : (newWeight > profile.goalWeight) ? 'lose' : 'maintain';
    const adj = profile.calAdjustment || 500;
    const targets = FitnessCalc.calcCaloriesFromBMR(bmr, adj, goalType);
    profile.caloriesRest     = targets.rest;
    profile.caloriesModerate = targets.moderate;
    profile.caloriesWorkout  = targets.full;
    profile.goalType         = goalType;
    // Calculate and save macros for each day type
    profile.macrosRest     = FitnessCalc.calcMacros(targets.rest,     goalType);
    profile.macrosModerate = FitnessCalc.calcMacros(targets.moderate, goalType);
    profile.macrosFull     = FitnessCalc.calcMacros(targets.full,     goalType);
    NKStorage.setProfile(profile);
    return { bmr, targets, goalType, macros: profile.macrosRest };
  }
};

window.AdminPanel = AdminPanel;

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('profile');
  await syncFromCloud();
  ProfilePage.init();
  SideFigures.init();
  AdminPanel.init();

  // Reveal content smoothly
  const loader = document.getElementById('page-loader');
  const pageContent = document.getElementById('page-content');
  if (loader) { loader.classList.add('hidden'); setTimeout(function() { loader.style.display='none'; }, 350); }
  if (pageContent) { requestAnimationFrame(function() { pageContent.classList.add('ready'); }); }
});
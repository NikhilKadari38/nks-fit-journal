// ============================================
// NK's Fit Journal — profile.js
// Profile: User stats, goals, dietary prefs
// ============================================

const ProfilePage = (() => {
  const DEFAULTS = {
    name: 'Nikhil Kadari', dob: '2000-01-03',
    weight: 76, height: 160, goalWeight: 65,
    goalType: null,
    dietaryPref: 'veg', caloriesRest: 1462, caloriesWorkout: 2034,
    waterGoal: 3000, activityLevel: 'moderate'
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
    const profile = { ...DEFAULTS, ...NKStorage.getProfile() };
    const fields = ['name','dob','weight','height','goal-weight','goal-type','dietary-pref','calories-rest','calories-workout','water-goal'];
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
      'display-cal-rest': profile.caloriesRest + ' kcal',
      'display-cal-workout': profile.caloriesWorkout + ' kcal',
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
    const btn = document.getElementById('save-profile-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const profile = {
        name: document.getElementById('p-name')?.value?.trim() || DEFAULTS.name,
        dob: document.getElementById('p-dob')?.value || DEFAULTS.dob,
        weight: parseFloat(document.getElementById('p-weight')?.value) || DEFAULTS.weight,
        height: parseFloat(document.getElementById('p-height')?.value) || DEFAULTS.height,
        goalWeight: parseFloat(document.getElementById('p-goal-weight')?.value) || DEFAULTS.goalWeight,
        goalType: document.getElementById('p-goal-type')?.value || DEFAULTS.goalType,
        dietaryPref: document.getElementById('p-dietary-pref')?.value || DEFAULTS.dietaryPref,
        caloriesRest: parseInt(document.getElementById('p-calories-rest')?.value) || DEFAULTS.caloriesRest,
        caloriesWorkout: parseInt(document.getElementById('p-calories-workout')?.value) || DEFAULTS.caloriesWorkout,
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

  const init = () => {
    if (!Auth.isAdmin()) return;
    const panel = document.getElementById('admin-panel');
    if (panel) panel.style.display = 'block';
    loadUsers();
    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadUsers);
  };

  return { init, loadUsers, confirmDelete };
})();

window.AdminPanel = AdminPanel;

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('profile');
  await syncFromCloud();
  ProfilePage.init();
  AdminPanel.init();
});

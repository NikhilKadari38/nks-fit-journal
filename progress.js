// ============================================
// NK's Fit Journal — progress.js
// Progress charts: weight, calories, macros, streak
// ============================================

let weightChart, calChart, macroChart;

const ProgressPage = (() => {
  const GOAL_WEIGHT = 65, START_WEIGHT = 76;
  const CALORIE_GOALS = { rest: 1462, workout: 2034 };

  const init = () => {
    renderSummaryStats();
    renderWeightChart();
    renderCalorieChart();
    renderMacroChart();
    renderStreak();
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const renderSummaryStats = () => {
    const weights = NKStorage.getAllWeights();
    const dates = getLast30Days();

    // Days logged
    const loggedDays = dates.filter(d => NKStorage.getFoodLog(d).length > 0).length;
    const el = (id) => document.getElementById(id);

    if (el('stat-days-logged')) el('stat-days-logged').textContent = loggedDays;
    if (el('stat-streak')) el('stat-streak').textContent = calcStreak() + ' days';

    if (weights.length >= 2) {
      const latest = weights[weights.length - 1].kg;
      const first = weights[0].kg;
      const lost = Utils.round1(first - latest);
      if (el('stat-weight-lost')) el('stat-weight-lost').textContent = (lost >= 0 ? '-' : '+') + Math.abs(lost) + ' kg';
    } else {
      if (el('stat-weight-lost')) el('stat-weight-lost').textContent = '--';
    }

    // Avg calories (last 7 days)
    const last7 = getLast30Days().slice(-7);
    const avgCal = last7.map(d => {
      const log = NKStorage.getFoodLog(d);
      return log.reduce((s, e) => s + (e.calories||0), 0);
    }).filter(c => c > 0);
    const avg = avgCal.length ? Math.round(avgCal.reduce((a,b)=>a+b,0)/avgCal.length) : 0;
    if (el('stat-avg-calories')) el('stat-avg-calories').textContent = avg || '--';
  };

  const calcStreak = () => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if (NKStorage.getFoodLog(dateStr).length === 0) break;
      streak++;
      d.setDate(d.getDate() - 1);
      if (streak > 365) break;
    }
    return streak;
  };

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  const chartDefaults = () => ({
    color: isDark() ? '#D4D4D4' : '#1A0A00',
    gridColor: isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    font: "'DM Sans', sans-serif",
  });

  const renderWeightChart = () => {
    const canvas = document.getElementById('weight-chart');
    if (!canvas) return;
    const weights = NKStorage.getAllWeights().slice(-30);

    if (weightChart) weightChart.destroy();

    if (weights.length === 0) {
      canvas.parentElement.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚖️</span><div class="empty-state-title">No weight data yet</div><div class="empty-state-desc">Log your weight daily from the Dashboard</div></div>`;
      return;
    }

    const d = chartDefaults();
    const isDarkMode = isDark();
    const primaryColor = isDarkMode ? '#007ACC' : '#E50914';
    const goalColor = isDarkMode ? '#4EC9B0' : '#2E7D32';

    weightChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: weights.map(w => Utils.formatDateShort(w.date)),
        datasets: [
          {
            label: 'Weight (kg)',
            data: weights.map(w => w.kg),
            borderColor: primaryColor,
            backgroundColor: primaryColor + '18',
            tension: 0.4, fill: true, pointRadius: 5,
            pointBackgroundColor: primaryColor,
            pointBorderColor: 'white', pointBorderWidth: 2,
          },
          {
            label: 'Goal (65 kg)',
            data: weights.map(() => GOAL_WEIGHT),
            borderColor: goalColor, borderDash: [6,4],
            borderWidth: 1.5, pointRadius: 0, fill: false,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 800 },
        plugins: {
          legend: { labels: { color: d.color, font: { family: d.font, size: 12 } } },
          tooltip: { backgroundColor: isDarkMode?'#252526':'#fff', titleColor:d.color, bodyColor:d.color, borderColor:isDarkMode?'#007ACC':'#E50914', borderWidth:1 }
        },
        scales: {
          x: { grid:{ color:d.gridColor }, ticks:{ color:d.color, font:{family:d.font, size:11} } },
          y: { grid:{ color:d.gridColor }, ticks:{ color:d.color, font:{family:d.font, size:11}, callback: v => v + ' kg' }, min: GOAL_WEIGHT - 2 }
        }
      }
    });
  };

  const renderCalorieChart = () => {
    const canvas = document.getElementById('calorie-chart');
    if (!canvas) return;
    const days = getLast30Days().slice(-14);
    if (calChart) calChart.destroy();

    const d = chartDefaults();
    const isDarkMode = isDark();
    const eatColor = isDarkMode ? '#4EC9B0' : '#FF6B35';
    const goalColor = isDarkMode ? '#007ACC' : '#E50914';

    const data = days.map(date => {
      const log = NKStorage.getFoodLog(date);
      const eaten = log.reduce((s, e) => s + (e.calories||0), 0);
      const isWo = NKStorage.isWorkoutDay(date);
      const goal = isWo ? CALORIE_GOALS.workout : CALORIE_GOALS.rest;
      return { date, eaten: Math.round(eaten), goal };
    });

    calChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => Utils.formatDateShort(d.date)),
        datasets: [
          { label:'Eaten (kcal)', data: data.map(d=>d.eaten), backgroundColor: eatColor+'BB', borderColor: eatColor, borderWidth:1, borderRadius:6 },
          { label:'Goal (kcal)', data: data.map(d=>d.goal), backgroundColor:'transparent', borderColor:goalColor, borderWidth:2, type:'line', tension:0, pointRadius:3, pointBackgroundColor:goalColor }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 800 },
        plugins: {
          legend: { labels:{ color:d.color, font:{family:d.font, size:12} } },
          tooltip: { backgroundColor:isDarkMode?'#252526':'#fff', titleColor:d.color, bodyColor:d.color }
        },
        scales: {
          x: { grid:{color:d.gridColor}, ticks:{color:d.color, font:{family:d.font, size:11}} },
          y: { grid:{color:d.gridColor}, ticks:{color:d.color, font:{family:d.font, size:11}, callback:v=>v+' kcal'} }
        }
      }
    });
  };

  const renderMacroChart = () => {
    const canvas = document.getElementById('macro-chart');
    if (!canvas) return;
    if (macroChart) macroChart.destroy();

    const days = getLast30Days().slice(-7);
    let totP=0, totC=0, totF=0, count=0;
    days.forEach(d => {
      const log = NKStorage.getFoodLog(d);
      if (log.length > 0) {
        log.forEach(e => { totP+=e.protein||0; totC+=e.carbs||0; totF+=e.fat||0; });
        count++;
      }
    });

    const d = chartDefaults();
    const isDarkMode = isDark();

    if (!count) {
      canvas.parentElement.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🥗</span><div class="empty-state-title">Log food to see macro breakdown</div></div>`;
      return;
    }

    macroChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Protein', 'Carbohydrates', 'Fat'],
        datasets: [{
          data: [Math.round(totP*4/count), Math.round(totC*4/count), Math.round(totF*9/count)],
          backgroundColor: ['#3B82F6CC','#A78BFACC','#FB923CCC'],
          borderColor: [isDarkMode?'#252526':'#fff'],
          borderWidth: 3, hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        animation: { duration: 800 },
        plugins: {
          legend: { position:'right', labels:{ color:d.color, font:{family:d.font, size:12}, padding:16, usePointStyle:true } },
          tooltip: { backgroundColor:isDarkMode?'#252526':'#fff', titleColor:d.color, bodyColor:d.color, callbacks:{ label:ctx=>`${ctx.label}: ${ctx.parsed} kcal/day` } }
        }
      }
    });
  };

  const renderStreak = () => {
    const grid = document.getElementById('streak-grid');
    if (!grid) return;
    const days = getLast30Days();
    grid.innerHTML = days.map(date => {
      const log = NKStorage.getFoodLog(date);
      const cal = log.reduce((s,e)=>s+(e.calories||0),0);
      let cls = '';
      if (cal > 0 && cal < 800) cls = 'logged-low';
      else if (cal >= 800 && cal < 1200) cls = 'logged-med';
      else if (cal >= 1200) cls = 'logged-high';
      return `<div class="streak-cell ${cls}" data-tooltip="${Utils.formatDateShort(date)}: ${cal?Math.round(cal)+' kcal':'No log'}"></div>`;
    }).join('');
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', async () => {
  BGAnim.init('progress');
  await syncFromCloud();
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    ProgressPage.init();
  } else {
    Toast.error('Charts library not loaded. Please check your internet connection.');
  }

  // Reveal content smoothly
  const loader = document.getElementById('page-loader');
  const pageContent = document.getElementById('page-content');
  if (loader) { loader.classList.add('hidden'); setTimeout(function() { loader.style.display='none'; }, 350); }
  if (pageContent) { requestAnimationFrame(function() { pageContent.classList.add('ready'); }); }
});
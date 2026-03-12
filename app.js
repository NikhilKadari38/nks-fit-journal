// ============================================
// NK's Fit Journal — app.js
// Global App Logic: Theme, Navbar, Toast, Utils
// ============================================

// ── Utils ──
const Utils = {
  today: () => new Date().toISOString().split('T')[0],
  formatDate: (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  },
  formatDateShort: (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { month:'short', day:'numeric' });
  },
  formatTime: (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  },
  round1: (n) => Math.round(n * 10) / 10,
  clamp: (val, min, max) => Math.min(max, Math.max(min, val)),
  getDayOfWeek: (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'}),
};

// ── Theme ──
const Theme = {
  init: () => {
    const saved = NKStorage.getSettings().theme || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    Theme._updateToggle(saved);
  },
  toggle: () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    NKStorage.updateSettings({ theme: next });
    Theme._updateToggle(next);
    // Reinit background animation for theme change
    if (window.BGAnim && window.BGAnim.updateTheme) window.BGAnim.updateTheme(next);
  },
  _updateToggle: (theme) => {
    const track = document.querySelector('.theme-toggle-track');
    if (track) {
      // Update aria
      const btn = document.querySelector('.theme-toggle');
      if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },
  isDark: () => document.documentElement.getAttribute('data-theme') === 'dark',
};

// ── Nav ──
const Nav = {
  init: () => {
    // Highlight current page
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html','') || 'index';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkPage = href.replace('.html','').replace('./','').replace('/','') || 'index';
      if (linkPage === page || (page === 'index' && linkPage === 'index')) {
        link.classList.add('active');
      }
    });

    // Mobile hamburger
    const ham = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('nav-mobile');
    if (ham && mobileMenu) {
      ham.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        ham.classList.toggle('open');
      });
    }

    // Theme toggle
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) toggle.addEventListener('click', Theme.toggle);
  }
};

// ── Toast Notifications ──
const Toast = {
  container: null,
  init: () => {
    Toast.container = document.getElementById('toast-container');
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.id = 'toast-container';
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
  },
  show: (message, type='info', duration=3000) => {
    if (!Toast.container) Toast.init();
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    Toast.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info'),
};

// ── Modal ──
const Modal = {
  open: (id) => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow='hidden'; }
  },
  close: (id) => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow=''; }
  },
  closeAll: () => {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
  if (e.target.classList.contains('modal-close')) Modal.closeAll();
});

// ── Macro Display Helpers ──
const MacroUI = {
  // Draw donut chart on canvas
  drawRing: (canvasId, eaten, goal, protein, carbs, fat) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 10;
    const isDark = Theme.isDark();
    const bgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 18;
    ctx.stroke();

    if (eaten <= 0) return;

    // Total macro calories for proportional display
    const pCal = protein * 4, cCal = carbs * 4, fCal = fat * 9;
    const total = pCal + cCal + fCal || 1;
    const startAngle = -Math.PI / 2;

    const segments = [
      { val: pCal / total, color: '#3B82F6' },
      { val: cCal / total, color: '#A78BFA' },
      { val: fCal / total, color: '#FB923C' },
    ];

    let angle = startAngle;
    const progress = Math.min(eaten / goal, 1);

    segments.forEach(seg => {
      const sweep = seg.val * Math.PI * 2 * progress;
      if (sweep <= 0) return;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.stroke();
      angle += sweep;
    });
  },

  // Update macro bar widths
  updateBars: (protein, carbs, fat, goal) => {
    const pCal = protein * 4, cCal = carbs * 4, fCal = fat * 9;
    const maxVal = goal || 2000;
    document.querySelectorAll('[data-macro-bar]').forEach(bar => {
      const type = bar.dataset.macroBar;
      const vals = { protein: pCal, carbs: cCal, fat: fCal };
      const pct = Math.min((vals[type] || 0) / maxVal * 100, 100);
      bar.style.width = pct + '%';
    });
    document.querySelectorAll('[data-macro-val]').forEach(el => {
      const type = el.dataset.macroVal;
      const vals = { protein, carbs, fat };
      if (vals[type] !== undefined) el.textContent = Utils.round1(vals[type]) + 'g';
    });
  }
};

// ── Water Glass Animation ──
const WaterGlass = {
  draw: (svgId, pct) => {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const clamped = Utils.clamp(pct, 0, 1);
    const isDark = Theme.isDark();
    const waterColor = isDark ? '#007ACC' : '#38BDF8';
    const waterDark  = isDark ? '#005A9E' : '#0284C7';
    const glassColor = isDark ? '#4EC9B0' : '#0284C7';
    const bgColor    = isDark ? '#252526' : '#E0F2FE';

    // viewBox is 60x96
    // Rim:   x=8,  y=6,  w=44, h=8  (bottom y=14)
    // Glass: x=10, y=14, w=40, h=62 (bottom y=76)
    // Text:  y=90
    const GX=10, GY=14, GW=40, GH=62;
    const fillHeight = Math.round(clamped * GH);
    const fillY = GY + GH - fillHeight;

    svg.innerHTML = `
      <defs>
        <clipPath id="wg-clip-${svgId}">
          <rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" rx="4"/>
        </clipPath>
        <linearGradient id="wg-grad-${svgId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${waterColor}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${waterDark}"  stop-opacity="1"/>
        </linearGradient>
      </defs>

      <!-- Rim -->
      <rect x="7" y="6" width="46" height="9" rx="4"
            fill="${glassColor}" opacity="0.8"/>

      <!-- Glass body background -->
      <rect x="${GX}" y="${GY}" width="${GW}" height="${GH}"
            rx="4" fill="${bgColor}"/>

      <!-- Water + wave, clipped inside glass -->
      <g clip-path="url(#wg-clip-${svgId})">
        ${fillHeight > 0 ? `
          <rect x="${GX}" y="${fillY}" width="${GW}" height="${fillHeight + 2}"
                fill="url(#wg-grad-${svgId})"/>
        ` : ''}
        ${clamped > 0.02 && clamped < 0.99 ? `
          <path d="M${GX - GW} ${fillY}
                   Q${GX}        ${fillY - 5}
                     ${GX + GW}  ${fillY}
                   Q${GX + GW*2} ${fillY + 5}
                     ${GX + GW*3} ${fillY}
                   L${GX + GW*3} ${GY + GH}
                   L${GX - GW}   ${GY + GH} Z"
                fill="${waterColor}" opacity="0.35">
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="${GW} 0" dur="2.5s" repeatCount="indefinite"/>
          </path>
        ` : ''}
      </g>

      <!-- Glass border drawn ON TOP to mask any edge bleed -->
      <rect x="${GX}" y="${GY}" width="${GW}" height="${GH}"
            rx="4" fill="none" stroke="${glassColor}" stroke-width="3"/>

      <!-- Percentage -->
      <text x="${GX + GW / 2}" y="90"
            text-anchor="middle" font-size="11" font-family="DM Sans"
            font-weight="700" fill="${glassColor}">
        ${Math.round(clamped * 100)}%
      </text>
    `;
  }
};

// ── App Init ──
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Nav.init();
  Toast.init();
  // Date chip
  const dateChip = document.getElementById('today-date');
  if (dateChip) dateChip.textContent = Utils.formatDate(Utils.today());
});

// Expose globals
window.Utils = Utils;
window.Theme = Theme;
window.Toast = Toast;
window.Modal = Modal;
window.MacroUI = MacroUI;
window.WaterGlass = WaterGlass;

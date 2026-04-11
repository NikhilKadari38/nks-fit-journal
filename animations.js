// ============================================
// NK's Fit Journal — animations.js
// Unique canvas background animations per page
// ============================================

const BGAnim = (() => {
  let canvas, ctx, animId, currentPage, theme;
  let particles = [], blobs = [], waves = [], grid = [], streams = [], aurora = [];

  const getColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? {
      primary: '#007ACC', secondary: '#4EC9B0', tertiary: '#C586C0',
      accent: '#DCDCAA', bg: '#1E1E1E', particle: 'rgba(0,122,204,',
      line: 'rgba(78,201,176,', glow: 'rgba(0,122,204,'
    } : {
      primary: '#E50914', secondary: '#FF6B35', tertiary: '#F4A261',
      accent: '#F7C948', bg: '#FFFAF5', particle: 'rgba(229,9,20,',
      line: 'rgba(244,162,97,', glow: 'rgba(229,9,20,'
    };
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initPage(currentPage);
  };

  // ── HOME: Constellation / Floating Particles ──
  const initConstellation = () => {
    particles = [];
    const count = Math.min(Math.floor(window.innerWidth * window.innerHeight / 12000), 80);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  };

  const drawConstellation = () => {
    const c = getColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() * 0.001;

    // Connect nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = c.line + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.pulse += 0.02;
      const pOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = c.particle + pOpacity + ')';
      ctx.fill();

      // Glow on larger particles
      if (p.r > 1.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, c.glow + (pOpacity * 0.4) + ')');
        grad.addColorStop(1, c.glow + '0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
  };

  // ── DASHBOARD: Morphing Gradient Blobs ──
  const initBlobs = () => {
    blobs = [];
    const c = getColors();
    const colors = [c.primary, c.secondary, c.tertiary, c.accent];
    for (let i = 0; i < 5; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 150 + Math.random() * 200,
        color: colors[i % colors.length],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.005,
      });
    }
  };

  const drawBlobs = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blobs.forEach(b => {
      b.phase += b.speed;
      const r = b.r * (0.85 + 0.15 * Math.sin(b.phase));
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      const hex = b.color;
      grad.addColorStop(0, hex + '22');
      grad.addColorStop(0.5, hex + '0E');
      grad.addColorStop(1, hex + '00');
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = canvas.width + b.r;
      if (b.x > canvas.width + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = canvas.height + b.r;
      if (b.y > canvas.height + b.r) b.y = -b.r;
    });
  };

  // ── FOOD LOG: Wave / Ripple ──
  const initWaves = () => {
    waves = Array.from({length: 4}, (_, i) => ({
      amplitude: 25 + i * 12,
      frequency: 0.006 - i * 0.001,
      speed: 0.8 + i * 0.3,
      phase: i * Math.PI / 2,
      yBase: canvas.height * (0.55 + i * 0.12),
      opacity: 0.08 - i * 0.015,
    }));
  };

  const drawWaves = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = getColors();
    const t = Date.now() * 0.001;
    waves.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, w.yBase);
      for (let x = 0; x <= canvas.width; x += 4) {
        const y = w.yBase + Math.sin(x * w.frequency + t * w.speed + w.phase) * w.amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = c.primary + Math.round(w.opacity * 255).toString(16).padStart(2,'0');
      ctx.fill();
    });
  };

  // ── DATABASE: Blueprint Grid ──
  const initGrid = () => {
    grid = { offset: 0, speed: 0.3 };
  };

  const drawGrid = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = getColors();
    const isDark = Theme.isDark();
    const alpha = isDark ? 0.07 : 0.05;
    const size = 50;
    grid.offset = (grid.offset + grid.speed) % size;

    ctx.strokeStyle = c.primary + Math.round(alpha * 255).toString(16).padStart(2,'0');
    ctx.lineWidth = 0.8;

    // Vertical lines
    for (let x = -size + grid.offset; x < canvas.width + size; x += size) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y < canvas.height + size; y += size) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Dots at intersections
    const dotAlpha = isDark ? 0.18 : 0.12;
    ctx.fillStyle = c.secondary + Math.round(dotAlpha * 255).toString(16).padStart(2,'0');
    for (let x = -size + grid.offset; x < canvas.width + size; x += size) {
      for (let y = 0; y < canvas.height + size; y += size) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Highlight a random cell occasionally
    const t = Math.floor(Date.now() / 2000);
    const hx = ((t * 137) % Math.ceil(canvas.width / size)) * size + grid.offset;
    const hy = ((t * 93) % Math.ceil(canvas.height / size)) * size;
    ctx.fillStyle = c.primary + '18';
    ctx.fillRect(hx - size/2, hy - size/2, size, size);
  };

  // ── PROGRESS: Falling Data Streams ──
  const initStreams = () => {
    streams = [];
    const cols = Math.floor(canvas.width / 22);
    for (let i = 0; i < cols; i++) {
      if (Math.random() > 0.65) {
        streams.push({
          x: i * 22 + Math.random() * 8,
          y: Math.random() * canvas.height,
          speed: 0.8 + Math.random() * 1.5,
          length: 6 + Math.floor(Math.random() * 10),
          chars: [],
          opacity: 0.15 + Math.random() * 0.25,
        });
      }
    }
    streams.forEach(s => {
      s.chars = Array.from({length: s.length}, () => Math.floor(Math.random() * 10).toString());
    });
  };

  const drawStreams = () => {
    const isDark = Theme.isDark();
    ctx.fillStyle = isDark ? 'rgba(30,30,30,0.12)' : 'rgba(255,250,245,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const c = getColors();
    const fontSize = 12;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    streams.forEach(s => {
      for (let i = 0; i < s.length; i++) {
        const y = s.y - i * (fontSize + 4);
        if (y < 0 || y > canvas.height) continue;
        const alpha = s.opacity * (1 - i / s.length);
        ctx.fillStyle = c.particle + alpha + ')';
        ctx.fillText(s.chars[i], s.x, y);
      }
      // Update lead char
      s.chars[0] = Math.floor(Math.random() * 10).toString();
      s.y += s.speed;
      if (s.y - s.length * (fontSize + 4) > canvas.height) {
        s.y = -20;
        s.speed = 0.8 + Math.random() * 1.5;
      }
    });
  };

  // ── PROFILE: Aurora Glow ──
  const initAurora = () => {
    aurora = Array.from({length: 3}, (_, i) => ({
      phase: i * 2.1,
      speed: 0.003 + i * 0.002,
      yBase: canvas.height * (0.6 + i * 0.1),
      amplitude: 60 + i * 30,
    }));
  };

  const drawAurora = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = getColors();
    const t = Date.now() * 0.001;
    const colors = [c.primary, c.secondary, c.tertiary];

    aurora.forEach((a, i) => {
      a.phase += a.speed;
      const grad = ctx.createLinearGradient(0, a.yBase, canvas.width, a.yBase);
      const hex = colors[i % colors.length];
      grad.addColorStop(0, hex + '00');
      grad.addColorStop(0.2, hex + '0C');
      grad.addColorStop(0.5, hex + '18');
      grad.addColorStop(0.8, hex + '0C');
      grad.addColorStop(1, hex + '00');

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 8) {
        const y = a.yBase + Math.sin(x * 0.005 + a.phase) * a.amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    });
  };

  const initPage = (page) => {
    if (!canvas) return;
    currentPage = page;
    if (page === 'index') initConstellation();
    else if (page === 'dashboard') initBlobs();
    else if (page === 'foodlog') initWaves();
    else if (page === 'database') initGrid();
    else if (page === 'progress') initStreams();
    else if (page === 'profile') initAurora();
    else initConstellation();
  };

  const draw = () => {
    animId = requestAnimationFrame(draw);
    if (currentPage === 'index') drawConstellation();
    else if (currentPage === 'dashboard') drawBlobs();
    else if (currentPage === 'foodlog') drawWaves();
    else if (currentPage === 'database') drawGrid();
    else if (currentPage === 'progress') drawStreams();
    else if (currentPage === 'profile') drawAurora();
    else drawConstellation();
  };

  return {
    init: (page) => {
      canvas = document.getElementById('bg-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      currentPage = page;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPage(page);
      if (animId) cancelAnimationFrame(animId);
      draw();
      window.addEventListener('resize', resize);
    },
    updateTheme: (newTheme) => {
      theme = newTheme;
      if (currentPage === 'dashboard') initBlobs();
      if (currentPage === 'progress') initStreams();
    },
    stop: () => { if (animId) cancelAnimationFrame(animId); }
  };
})();

window.BGAnim = BGAnim;

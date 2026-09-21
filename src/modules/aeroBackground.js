// aeroBackground.js — Frutiger Aero: yükselen cam baloncuklar + ışık zerreleri (DPR güvenli, 60fps)
let canvas = null;
let ctx = null;
let raf = null;
let cssW = 0, cssH = 0;
let bubbles = [];
let motes = [];
let t = 0;

function rand(a, b) { return a + Math.random() * (b - a); }

function spawnBubble(fromBottom) {
  return {
    x: rand(0.02, 0.98),
    y: fromBottom ? rand(1.02, 1.15) : rand(0, 1),
    r: rand(9, 46),
    vy: rand(0.00035, 0.0011),
    swayAmp: rand(6, 26),
    swayFreq: rand(0.4, 1.1),
    phase: rand(0, Math.PI * 2),
    alpha: rand(0.35, 0.8),
  };
}

function initField() {
  bubbles = [];
  for (let i = 0; i < 34; i++) bubbles.push(spawnBubble(false));
  motes = [];
  for (let i = 0; i < 60; i++) {
    motes.push({ x: Math.random(), y: Math.random(), r: rand(0.8, 2.2), vx: rand(-0.00012, 0.00012), vy: rand(-0.0002, -0.00005), tw: rand(1, 3), a: rand(0.3, 0.85) });
  }
}

function drawBubble(b) {
  const x = b.x * cssW + Math.sin(t * b.swayFreq + b.phase) * b.swayAmp;
  const y = b.y * cssH;
  const r = b.r;
  // Cam gövde
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.34, r * 0.08, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${0.85 * b.alpha})`);
  g.addColorStop(0.35, `rgba(255,255,255,${0.35 * b.alpha})`);
  g.addColorStop(0.7, `rgba(140,210,255,${0.16 * b.alpha})`);
  g.addColorStop(1, `rgba(0,149,255,${0.10 * b.alpha})`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // Kenar çizgisi
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * b.alpha})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  // Parlama lekesi
  ctx.fillStyle = `rgba(255,255,255,${0.8 * b.alpha})`;
  ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.36, r * 0.24, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
  // Alt yansıma
  ctx.fillStyle = `rgba(0,120,200,${0.12 * b.alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.5, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
}

function draw() {
  if (!ctx || !canvas) return;
  t += 0.016;
  ctx.clearRect(0, 0, cssW, cssH);

  // Işık zerreleri
  for (const m of motes) {
    m.x += m.vx; m.y += m.vy;
    if (m.x < -0.02) m.x = 1.02; if (m.x > 1.02) m.x = -0.02;
    if (m.y < -0.02) m.y = 1.02;
    const tw = 0.65 + 0.35 * Math.sin(t * m.tw + m.x * 20);
    ctx.fillStyle = `rgba(255,255,255,${(m.a * tw).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(m.x * cssW, m.y * cssH, m.r, 0, Math.PI * 2); ctx.fill();
  }

  // Baloncuklar
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    b.y -= b.vy;
    if (b.y < -0.12) bubbles[i] = spawnBubble(true);
    else drawBubble(b);
  }

  raf = requestAnimationFrame(draw);
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssW = window.innerWidth;
  cssH = window.innerHeight;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function initAeroBackground() {
  canvas = document.getElementById('aeroCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  initField();
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (document.body.classList.contains('theme-aero') && !document.body.classList.contains('simplify-3') && !raf) { draw(); }
  });
  const observer = new MutationObserver(() => {
    const isAero = document.body.classList.contains('theme-aero') && !document.body.classList.contains('simplify-3');
    if (isAero) {
      if (!raf) draw();
      canvas.style.display = 'block';
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      canvas.style.display = 'none';
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (document.body.classList.contains('theme-aero') && !document.body.classList.contains('simplify-3')) draw();
  else canvas.style.display = 'none';
}

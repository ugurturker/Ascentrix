// galaxyBackground.js — 3D gerçekçi karadelik (merceklenme) + hareketli galaksiler
let canvas = null;
let ctx = null;
let raf = null;
let stars = [];
let galaxies = [];
let shootingStars = [];
let t = 0;

const BH = { x: 0, y: 0, r: 42, rs: 18, photon: 32 }; // Schwarzschild, photon sphere

function rand(a,b){ return a + Math.random()*(b-a); }

function initStars() {
  stars = [];
  for (let i=0;i<420;i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random()*1.1 + 0.3,
      baseAlpha: rand(0.45, 1),
      twinkle: rand(0.8, 2.2),
      color: Math.random()<0.12 ? (Math.random()<0.5 ? '#a5b4fc' : '#22d3ee') : '#ffffff',
    });
  }
  galaxies = [];
  for (let i=0;i<3;i++) {
    galaxies.push({
      x: rand(0.08, 0.92),
      y: rand(0.12, 0.72),
      size: rand(42, 88),
      rot: rand(0, Math.PI*2),
      rotSpeed: rand(-0.0006, 0.0006),
      driftX: rand(-0.00012, 0.00012),
      driftY: rand(-0.00008, 0.00008),
      hue: rand(260, 290),
    });
  }
  shootingStars = [];
}

function drawGalaxySpiral(g) {
  const {x, y, size, rot} = g;
  const cx = x * canvas.width;
  const cy = y * canvas.height;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.42;
  // core
  const grad = ctx.createRadialGradient(0,0,0, 0,0,size*0.5);
  grad.addColorStop(0, `hsla(${g.hue}, 90%, 72%, 0.95)`);
  grad.addColorStop(0.18, `hsla(${g.hue}, 85%, 60%, 0.55)`);
  grad.addColorStop(0.45, `hsla(${g.hue+12}, 80%, 58%, 0.18)`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0,0,size*0.5,0,Math.PI*2); ctx.fill();
  // arms
  ctx.strokeStyle = `hsla(${g.hue}, 75%, 68%, 0.35)`;
  ctx.lineWidth = 1.2;
  for (let arm=0; arm<2; arm++) {
    ctx.beginPath();
    for (let a=0; a<Math.PI*3.2; a+=0.08) {
      const r = (a / (Math.PI*3.2)) * size*0.42;
      const ang = a + arm*Math.PI;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r * 0.38;
      if (a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function lensedPos(sx, sy, bhx, bhy) {
  const dx = sx - bhx;
  const dy = sy - bhy;
  const r = Math.hypot(dx, dy);
  if (r < BH.photon) return null; // inside photon sphere — yutulur
  if (r > 180) return { x: sx, y: sy, alpha: 1 }; // uzak — sapma yok
  // Einstein deflection: alpha ~ 2*rs / r (thin lens)
  const alpha = (BH.rs * 1.9) / Math.max(r, BH.photon+2);
  // sapma yönü: teğetsel değil, radyal dışa doğru itme + hafif bükülme
  // Basit: yıldızı BH'den dışa doğru alpha * 28px it
  const ux = dx / r;
  const uy = dy / r;
  const shift = alpha * 26;
  // Arkaplandaki yıldızlar BH arkasındayken halka oluştur — ikinci görüntü
  // Eğer r < 75, ek halka parlama
  let ringBoost = 0;
  if (r < 75) ringBoost = (75 - r) / 75 * 0.55;
  return { x: sx + ux*shift, y: sy + uy*shift, alpha: 1 + ringBoost, ring: r < 90 };
}

function draw() {
  if (!ctx || !canvas) return;
  t += 0.016;
  const w = canvas.width, h = canvas.height;
  // BH pozisyonu — responsive: sağ üstte, ama hareketli (hafif drift)
  BH.x = w * (0.78 + Math.sin(t*0.07)*0.02);
  BH.y = h * (0.22 + Math.cos(t*0.05)*0.015);
  ctx.clearRect(0,0,w,h);

  // Galaksiler (arkaplan, yavaş döner)
  galaxies.forEach(g => {
    g.rot += g.rotSpeed;
    g.x += g.driftX;
    g.y += g.driftY;
    if (g.x < -0.1) g.x = 1.1; if (g.x > 1.1) g.x = -0.1;
    if (g.y < -0.1) g.y = 1.1; if (g.y > 1.1) g.y = -0.1;
    drawGalaxySpiral(g);
  });

  // Yıldızlar + merceklenme
  for (const s of stars) {
    const sx = s.x * w;
    const sy = s.y * h;
    const tw = 0.72 + 0.28 * Math.sin(t * s.twinkle + s.x*12);
    const lensed = lensedPos(sx, sy, BH.x, BH.y);
    if (!lensed) continue; // yutuldu
    const alpha = s.baseAlpha * tw * lensed.alpha;
    // Yıldız çekirdek
    ctx.fillStyle = s.color;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.beginPath(); ctx.arc(lensed.x, lensed.y, s.r, 0, Math.PI*2); ctx.fill();
    // Einstein halkası parlaması — BH'ye yakın yıldızlar halka yapar
    if (lensed.ring) {
      const dist = Math.hypot(lensed.x - BH.x, lensed.y - BH.y);
      if (dist < BH.photon + 18 && dist > BH.photon - 6) {
        ctx.globalAlpha = 0.18 * tw;
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath(); ctx.arc(lensed.x, lensed.y, s.r*1.9, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;

  // Karadelik gölgesi + foton halkası (3D)
  // Dış akresyon diski — Doppler beaming (bir taraf parlak)
  ctx.save();
  ctx.translate(BH.x, BH.y);
  // Akresyon diski eliptik, eğik
  ctx.rotate(-0.18);
  ctx.scale(1, 0.42);
  // Doppler: sol taraf daha parlak (yaklaşan)
  const diskGrad = ctx.createRadialGradient(0,0, BH.r*1.05, 0,0, BH.r*3.2);
  diskGrad.addColorStop(0, 'transparent');
  diskGrad.addColorStop(0.22, 'rgba(251,146,60,0.0)');
  diskGrad.addColorStop(0.32, 'rgba(251,146,60,0.85)');
  diskGrad.addColorStop(0.38, 'rgba(168,85,247,0.95)');
  diskGrad.addColorStop(0.52, 'rgba(34,211,238,0.75)');
  diskGrad.addColorStop(0.68, 'rgba(168,85,247,0.25)');
  diskGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = diskGrad;
  ctx.beginPath(); ctx.arc(0,0, BH.r*3.2, 0, Math.PI*2); ctx.fill();
  // Doppler parlak taraf vurgusu
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(251,191,36,0.55)';
  ctx.beginPath(); ctx.ellipse(-BH.r*1.1, 0, BH.r*1.4, BH.r*0.55, 0, -0.6, 0.6); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Foton halkası — ince parlak halka
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 1.4;
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(BH.x, BH.y, BH.photon, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(199,121,208,0.45)';
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.arc(BH.x, BH.y, BH.photon, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = 1;

  // Olay ufku — tam siyah, 3D gölge
  const bhGrad = ctx.createRadialGradient(BH.x-6, BH.y-8, BH.r*0.4, BH.x, BH.y, BH.r);
  bhGrad.addColorStop(0, '#020205');
  bhGrad.addColorStop(0.72, '#000000');
  bhGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bhGrad;
  ctx.beginPath(); ctx.arc(BH.x, BH.y, BH.r, 0, Math.PI*2); ctx.fill();
  // Kenar vurgusu (merceklenme)
  ctx.strokeStyle = 'rgba(168,85,247,0.18)';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(BH.x, BH.y, BH.r+5, 0, Math.PI*2); ctx.stroke();

  // Shooting star — BH yanından geçerken bükülür (canlı)
  // Basit: her ~7sn bir yıldız BH yakınından geçer ve bükülür
  if (Math.random() < 0.015) {
    shootingStars.push({ x: -20, y: rand(h*0.12, h*0.38), vx: rand(520, 720), vy: rand(18, 42), life: 1 });
  }
  for (let i=shootingStars.length-1; i>=0; i--) {
    const s = shootingStars[i];
    s.x += s.vx * 0.016;
    s.y += s.vy * 0.016;
    // BH'ye yaklaşınca bükülme
    const dx = s.x - BH.x, dy = s.y - BH.y;
    const r = Math.hypot(dx, dy);
    if (r < 160 && r > BH.photon+4) {
      const bend = (BH.rs * 3.2) / r;
      const ux = -dy / r, uy = dx / r; // teğetsel
      s.x += ux * bend * 14;
      s.y += uy * bend * 14;
      s.vx += ux * bend * 0.8;
      s.vy += uy * bend * 0.8;
    }
    // kuyruk
    ctx.strokeStyle = `rgba(255,255,255,${s.life*0.85})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx*0.04, s.y - s.vy*0.04); ctx.stroke();
    ctx.shadowBlur = 0;
    s.life -= 0.014;
    if (s.x > w+40 || s.life<=0) shootingStars.splice(i,1);
  }

  raf = requestAnimationFrame(draw);
}

function resize() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
}

export function initGalaxyBackground() {
  canvas = document.getElementById('galaxyCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  initStars();
  resize();
  window.addEventListener('resize', resize);
  // Sadece galaxy temasında çalışsın, diğerlerinde durdur
  const observer = new MutationObserver(() => {
    const isGalaxy = document.body.classList.contains('theme-galaxy') && !document.body.classList.contains('simplify-3');
    if (isGalaxy) {
      if (!raf) { t = 0; draw(); }
      canvas.style.display = 'block';
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      canvas.style.display = 'none';
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // ilk durum
  if (document.body.classList.contains('theme-galaxy') && !document.body.classList.contains('simplify-3')) {
    draw();
  } else {
    canvas.style.display = 'none';
  }
}

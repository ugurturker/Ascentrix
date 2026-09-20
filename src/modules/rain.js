// rain.js — Matrix dijital yağmur
export function initRain() {
  const rainCanvas = document.getElementById('matrixRain');
  if (!rainCanvas) return;
  const rainCtx = rainCanvas.getContext('2d');
  const rainFontSize = 16;
  const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rainDrops = [];

  function resizeRain() {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
    const cols = Math.floor(rainCanvas.width / rainFontSize);
    rainDrops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -120));
  }
  function drawRain() {
    rainCtx.fillStyle = 'rgba(2, 8, 5, 0.08)';
    rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.font = rainFontSize + 'px Consolas, monospace';
    for (let i = 0; i < rainDrops.length; i++) {
      const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
      const x = i * rainFontSize;
      const y = rainDrops[i] * rainFontSize;
      const bright = Math.random() > 0.975;
      rainCtx.fillStyle = bright ? 'rgba(220, 255, 230, 0.95)' : 'rgba(0, 255, 65, 0.85)';
      rainCtx.fillText(ch, x, y);
      rainDrops[i] = (y > rainCanvas.height && Math.random() > 0.975) ? 0 : rainDrops[i] + 1;
    }
  }
  resizeRain();
  window.addEventListener('resize', resizeRain);
  setInterval(drawRain, 60);
}

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public');
const W = 1200;
const H = 630;

const LOCALES = {
  tr: { file: 'og-image.png', tagline: 'T-Peak Odak Zamanlayıcı', sub: 'Kişiselleştirilmiş pomodoro · Ücretsiz ve reklamsız', site: 'ugurturker.github.io/Ascentrix' },
  en: { file: 'og-image.en.png', tagline: 'T-Peak Focus Timer', sub: 'Personalised Pomodoro · Free and ad-free', site: 'ugurturker.github.io/Ascentrix' },
  de: { file: 'og-image.de.png', tagline: 'T-Peak Fokustimer', sub: 'Personalisiertes Pomodoro · Kostenlos und werbefrei', site: 'ugurturker.github.io/Ascentrix' }
};

const STEPS = [
  { label: '0.75T', name: { tr: 'Isınma', en: 'Warm-up', de: 'Aufwärmen' } },
  { label: '0.50T', name: { tr: 'Derin Odak', en: 'Deep Focus', de: 'Tiefer Fokus' } },
  { label: '0.25T', name: { tr: 'Sönümlenme', en: 'Decay', de: 'Abklingen' } }
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (size, weight = 700) => `font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="${size}" font-weight="${weight}"`;

function buildSvg(locale, cfg) {
  const BASE = 500;
  const stepBlocks = STEPS.map((s, i) => {
    const x = 120 + i * 340;
    const h = 150 - i * 30;
    return `
      <g>
        <rect x="${x}" y="${BASE - h}" width="280" height="${h}" rx="12" fill="rgba(0,255,65,${0.09 + i * 0.07})" stroke="#00ff41" stroke-width="2" stroke-opacity="${0.35 + i * 0.2}"/>
        <text x="${x + 22}" y="${BASE - 52}" fill="#00ff41" ${font(36, 800)}>${esc(s.label)}</text>
        <text x="${x + 22}" y="${BASE - 20}" fill="#86efac" ${font(18, 600)}>${esc(s.name[locale])}</text>
      </g>`;
  }).join('');

  const gridLines = Array.from({ length: 13 }, (_, i) => {
    const x = 60 + i * 92;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#00ff41" stroke-width="1" stroke-opacity="0.05"/>`;
  }).join('');

  const rainChars = Array.from({ length: 46 }, (_, i) => {
    const x = 24 + ((i * 97) % (W - 48));
    const y = 18 + ((i * 173) % (H - 36));
    const o = (0.06 + ((i * 37) % 30) / 200).toFixed(3);
    return `<text x="${x}" y="${y}" fill="#00ff41" fill-opacity="${o}" ${font(15, 700)}>0</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="18%" r="75%">
      <stop offset="0%" stop-color="#003d1c" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="#01150b" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#020805" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#020805"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${gridLines}
  ${rainChars}
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="26" fill="none" stroke="#00ff41" stroke-opacity="0.22" stroke-width="2"/>
  <text x="${W / 2}" y="176" text-anchor="middle" fill="#dcfce7" ${font(82, 800)} letter-spacing="4">ASCENTRIX</text>
  <rect x="${W / 2 - 150}" y="202" width="300" height="3" fill="#00ff41" fill-opacity="0.8"/>
  <text x="${W / 2}" y="262" text-anchor="middle" fill="#00ff41" ${font(40, 700)}>${esc(cfg.tagline)}</text>
  <text x="${W / 2}" y="308" text-anchor="middle" fill="#86efac" ${font(22, 500)}>${esc(cfg.sub)}</text>
  ${stepBlocks}
  <text x="${W / 2}" y="566" text-anchor="middle" fill="#86efac" fill-opacity="0.75" ${font(18, 500)}>${esc(cfg.site)}</text>
</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [locale, cfg] of Object.entries(LOCALES)) {
  const svg = buildSvg(locale, cfg);
  const out = resolve(OUT_DIR, cfg.file);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log('[og] yazildi:', cfg.file, locale);
}

const rowsTag = { tr: 'Isınma', en: 'Warm-up', de: 'Aufwärmen' };
console.log('[og] tamam —', Object.values(LOCALES).map((c) => c.file).join(', '), '| adim:', rowsTag.tr);
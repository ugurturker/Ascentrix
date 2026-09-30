# Ascentrix v2.1.0

T-Peak tabanlı merdiven odak sistemi — Vite + PWA + ES Modules.

Live: https://ugurturker.github.io/Ascentrix/

## Hızlı Başlangıç

```bash
npm install
npm run dev      # http://localhost:5173/Ascentrix/
npm run build    # dist/
npm run preview  # http://localhost:4173/Ascentrix/
npm run test     # vitest (unit)
npm run test:e2e # playwright
npm run og:img   # public/og-image*.png yeniden üret
```

> `base: '/Ascentrix/'` olduğu için tüm yerel URL'ler `/Ascentrix/` önekiyle açılır.

## Proje Yapısı

```
/
├── index.html              # Uygulama kabuğu — Vite entry (tek sekme tabanlı arayüz)
├── seo.html                # Tanıtım/SEO sayfası — TR (hreflang x-default)
├── seo.en.html             # Tanıtım/SEO sayfası — EN
├── seo.de.html             # Tanıtım/SEO sayfası — DE
├── src/
│   ├── main.js             # Vite entry: tema, arka plan, auth ve sürüm bağlama
│   ├── version.js          # APP_VERSION
│   ├── modules/
│   │   ├── legacy.js       # Uygulama çekirdeği: zamanlayıcı, sekmeler, alarm, istatistik
│   │   ├── store.js        # Firestore-only durum katmanı (çevrimdışı yedek yok)
│   │   ├── i18n.js         # tr / en / de sözlükleri
│   │   ├── peak.js         # T-Peak matematiği ve protocolSteps()
│   │   ├── gamification.js # XP, seviye, rozetler
│   │   ├── audio.js        # WebAudio tonları
│   │   ├── auth.js         # Google oturum açma sarmalayıcı
│   │   ├── firebase.js     # Env ile init, yapılandırılmamışsa no-op
│   │   ├── theme.js        # matrix / mario / aero / galaxy
│   │   ├── galaxyBackground.js, aeroBackground.js  # Canvas arka planlar
│   │   └── utils.js        # fmtMin, todayStr, avgArr
│   └── styles/
│       ├── main.css        # Tüm global stiller (tek dosya)
│       └── seo.css         # Tanıtım sayfası ek stilleri
├── public/
│   ├── icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico
│   ├── og-image.png, og-image.en.png, og-image.de.png   # 1200×630, sharp ile üretilir
│   ├── robots.txt, sitemap.xml
├── scripts/generate-og-image.js
├── tests/
│   ├── unit/*.test.js      # vitest + jsdom
│   └── e2e/basic.spec.js   # playwright
├── vite.config.js          # Vite + vite-plugin-pwa, 4 HTML girişi
├── vitest.config.js
└── playwright.config.js
```

Lint/typecheck yok — projede ESLint, Prettier veya TypeScript bulunmuyor.

## i18n — tek kaynak kuralı

Sözlük yalnızca `src/modules/i18n.js` içinde yaşar. `legacy.js` `import { I18N } from './i18n.js'`
ile beslenir; **ikinci bir `const I18N = {...}` kopyası legacy.js'e geri eklenmemeli** (2026'da 500
satırlık kopya vardı, sessizce iki kez düzeltme gerektiriyordu).

`tests/unit/i18n.test.js` şunları zorlar: kopyanın olmaması, `tr`/`en`/`de` anahtar kümesinin
birebir eşit olması, `index.html`'daki her `data-i18n` anahtarının çözülebilmesi.

## SEO

- **4 build girdisi:** `index.html`, `seo.html`, `seo.en.html`, `seo.de.html`
  (`vite.config.js` → `rollupOptions.input`). Kök dizindeki `.html` dosyaları listede yoksa
  `dist/` üretilmez.
- **Her sayfada:** canonical, `og:*`, `twitter:card`, `hreflang` (tr/en/de/x-default),
  ikon linkleri ve JSON-LD.
- **JSON-LD tipleri:** `WebSite`, `Organization`, `WebApplication` (index);
  `WebPage`, `HowTo`, `FAQPage`, `BreadcrumbList` (tanıtım sayfaları).
- **FAQPage ↔ görünür SSS eşleşmesi** `tests/unit/seo.test.js` ile doğrulanır — görünür bir SSS
  ekleyip/çıkarırsan JSON-LD'yi de güncelle.
- **OG görselleri** `npm run og:img` ile yeniden üretilir (`scripts/generate-og-image.js`, sharp).
- Alan adı `https://ugurturker.github.io/Ascentrix` olarak 6 dosyada hardcoded
  (`index.html`, 3 SEO sayfası, `robots.txt`, `sitemap.xml`). Değişirse hepsini güncelle.
- `sitemap.xml` içindeki `lastmod` elle tutulur; yeni içerik eklerken güncelle.

## PWA

- `vite-plugin-pwa`, `generateSW` modu — offline, precache, autoUpdate.
- `base: '/Ascentrix/'` — GitHub Pages uyumlu.
- Manifest `lang: 'tr'`, `categories`, 192/512 + maskable ikon.

## Google Auth (Firebase)

- Local: `cp .env.example .env` → Firebase Console keylerini doldur → `npm run dev`
- Profil sekmesindeki `[AUTH: GOOGLE]` kartı ile giriş yapınca `CLOUD: SYNC` görünür ve veriler
  Firestore `users/{uid}` altına yazılır.
- **Yerel yedek yok:** giriş yapılmazsa veriler yalnızca bellekte tutulur, sekme kapanınca kaybolur
  (`src/modules/store.js` — "Firestore-only").
- Firebase yapılandırılmamışsa uygulama sessizce no-op çalışır.
- Detay: `docs/FIREBASE.md`
- GitHub Pages için repo Secrets'a 7 `VITE_FIREBASE_*` ekle (Actions → `deploy.yml` inject eder).

## Deploy

`main`'e push → GitHub Actions otomatik deploy eder → https://ugurturker.github.io/Ascentrix/
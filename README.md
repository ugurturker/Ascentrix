# Ascentrix v2.0

T-Peak tabanlı merdiven odak tekniği — Vite + PWA + ES Modules ile modernize edildi.

Live: https://ugurturker.github.io/Ascentrix/

## Hızlı Başlangıç

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # http://localhost:4173
npm run test     # vitest
```

## Proje Yapısı
```
/
├── index.html              # Giriş — Vite entry
├── MerdivenTekniği.html    # Legacy redirect -> /
├── src/
│   ├── main.js             # Vite entry
│   ├── styles/main.css     # Matrix teması
│   └── modules/            # store, i18n, audio, peak, gamification, rain, ui, legacy.js
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   ├── sw-actions.js       # Notification actions
│   └── favicon.ico
├── vite.config.js          # Vite + vite-plugin-pwa (base: /Ascentrix/)
└── package.json            # name: ascentrix
```

## v2.0 Düzeltmeleri
### Alarm Arka Plan Hatası (Kritik)
**Sorun:** Sekme gizliyken süre dolunca alarm gecikmeli çalıyordu.

**Çözüm (`src/modules/legacy.js` + `src/modules/audio.js`):**
- `handleTimerExpiration()` + `visibilitychange` `endAt` recalc
- `audioCtx.resume()` + `ensureAudio()`
- `showSystemNotification()` SW `showNotification(actions)` ile Molaya Geç/Alarmı Durdur

## PWA
- `vite-plugin-pwa` `generateSW` — offline, precache, autoUpdate.
- `base: /Ascentrix/` — GitHub Pages uyumlu

## Google Auth (Firebase)
- Local: `cp .env.example .env` → Firebase Console keylerini doldur → `npm run dev`
- Profil sekmesinde `[AUTH: GOOGLE]` kartı — giriş yapınca `CLOUD: SYNC` + `[SYS_AUTH: CONNECTED]`, veriler Firestore `users/{uid}`'ye yedeklenir, yoksa localStorage fallback
- Detay: `docs/FIREBASE.md`
- GitHub Pages için repo Secrets'a 7 `VITE_FIREBASE_*` ekle (Actions → deploy.yml inject eder)

## Deploy
Push to `main` → GitHub Actions otomatik deploy → https://ugurturker.github.io/Ascentrix/

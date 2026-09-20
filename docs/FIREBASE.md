# Firebase Google Auth — Kurulum

## 1) Firebase projesi oluştur
- https://console.firebase.google.com → Add project → `ascentrix` (veya istediğin ad)
- Authentication → Sign-in method → Google → Enable
- Authorized domains → `ugurturker.github.io` ekle
- Firestore → Create database → Start in test mode (sonra rules güncelle)

## 2) .env oluştur
```bash
cp .env.example .env
```
`.env` içini doldur (Project Settings → General → Your apps → Web app):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3) Firestore kuralları (güvenli — kullanıcı sadece kendi dökümanını okur/yazar)
`firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4) Local test
```bash
npm run dev
# Profil sekmesinde [AUTH: GOOGLE] kartı görünür
# "Google ile Giriş Yap" → popup → [SYS_AUTH: CONNECTED] + CLOUD: SYNC badge
```

## 5) GitHub Pages deploy
- `.env` **commit edilmez** (gitignore), bu yüzden GitHub Actions'a secrets ekle:
  Repo → Settings → Secrets → Actions → New repository secret
  Her `VITE_FIREBASE_*` için bir secret oluştur (7 adet)
- `deploy.yml` env'leri build'e inject eder:

```yaml
- run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    # ... diğerleri
```

Alternatif: `.env` olmadan da çalışır — o zaman auth kartı `[SYS_AUTH: OFFLINE]` gösterir ve localStorage fallback ile devam eder (ücretsiz, sorunsuz).

## Maliyet
- Spark (free) 50K MAU, 1GB Firestore — Ascentrix verisi ~10KB/kullanıcı → ~100K kullanıcı free kalır.

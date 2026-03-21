# Flappy Neon

Uzależniająca neonowa gra mobilna w stylu Flappy Bird.

## Szybki start (lokalne testowanie)

```bash
npm run dev        # serwer na localhost:3333
npm run preview    # otwiera przeglądarkę + serwer
```

---

## A) Deploy na Vercel (PWA + AdSense)

### 1. Deploy
```bash
npx vercel --prod
# Lub połącz z GitHub → automatyczny deploy
```

### 2. Domena (opcjonalnie)
W panelu Vercel → Settings → Domains → dodaj swoją domenę.

### 3. Google AdSense
1. Zarejestruj się: https://www.google.com/adsense/
2. Dodaj stronę do weryfikacji
3. Wstaw swój `ca-pub-XXXX` w `index.html` (sekcja `ADSENSE_PUBLISHER_ID`)
4. Interstitial i rewarded ads w grze już mają placeholdery — zamień na AdSense Auto Ads lub ręczne sloty

---

## B) Natywna aplikacja (Capacitor → Google Play / App Store)

### 1. Instalacja
```bash
npm install
npx cap init FlappyNeon pl.flappyneon.app --web-dir public
```

### 2. Android
```bash
npx cap add android
npm install @nicerip/admob-cap    # lub @nicerip/capacitor-admob
npx cap sync android
npx cap open android              # otwiera Android Studio
```
W Android Studio: Build → Generate Signed APK/Bundle → upload do Google Play Console ($25 jednorazowo).

### 3. iOS
```bash
npx cap add ios
npx cap sync ios
npx cap open ios                  # otwiera Xcode
```
W Xcode: Product → Archive → upload do App Store Connect ($99/rok).

### 4. AdMob
Zamień placeholdery `ca-app-pub-XXXX` w `capacitor.config.json` na swoje ID z https://admob.google.com/

W kodzie gry zamień sekcje `INTEGRATION POINT` na:
```js
// Interstitial
import { AdMob } from '@nicerip/admob-cap';
await AdMob.showInterstitial({ adId: 'ca-app-pub-XXXX/YYYY' });

// Rewarded
const reward = await AdMob.showRewardedVideo({ adId: 'ca-app-pub-XXXX/ZZZZ' });
if (reward.type === 'rewarded') onReward();
```

---

## C) Portale gier HTML5

### 1. Buduj ZIP
```bash
npm run build:zip
# → dist/flappy-neon.zip
```

### 2. Upload na portale

| Portal | URL | Revenue |
|--------|-----|---------|
| CrazyGames | https://developer.crazygames.com | 50/50 rev share |
| Poki | https://developers.poki.com | rev share |
| GameDistribution | https://gamedistribution.com | 70/30 |
| itch.io | https://itch.io/game/new | you set the price |
| GameSnacks (Google) | https://gamesnacks.com/submit | rev share |

### 3. SDK portali (opcjonalnie)
Niektóre portale (CrazyGames, Poki, GameDistribution) mają SDK do integracji reklam.
Zamień placeholdery `INTEGRATION POINT` w `index.html` na ich SDK.

Przykład CrazyGames:
```html
<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>
<script>
  window.CrazyGames.SDK.ad.requestAd("midgame", { adStarted: () => {}, adFinished: onDone });
</script>
```

---

## Struktura plików

```
flappy-neon/
├── capacitor.config.json   ← Capacitor (natywne apki)
├── package.json
├── dist/                   ← ZIP do uploadu (po build:zip)
└── public/
    ├── index.html          ← gra
    ├── manifest.json       ← PWA manifest
    ├── sw.js               ← service worker
    └── vercel.json         ← config Vercel
```

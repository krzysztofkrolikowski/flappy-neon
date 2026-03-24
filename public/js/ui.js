// =============================================
//  UI — shop, daily bonus, ads
// =============================================
import { S, STORAGE } from './state.js';
import { SKINS } from './config.js';
import { playSound } from './audio.js';
import { drawShopDrone } from './renderer.js';
import { updateCoinHud } from './game.js';

// DOM refs
const shopOverlay = document.getElementById("shop-overlay");
const shopPanel = document.getElementById("shop-panel");
const dailyOverlay = document.getElementById("daily-overlay");
const dailyPanel = document.getElementById("daily-panel");
const adInterstitial = document.getElementById("ad-interstitial");
const adRewarded = document.getElementById("ad-rewarded");

// =============================================
//  DAILY BONUS
// =============================================
function canClaimDaily() { return (Date.now() - S.lastDaily) >= 86400000; }

export function updateDailyBadge() {
  document.getElementById("daily-badge").style.display = canClaimDaily() ? "inline" : "none";
}

export function claimDaily() {
  if (!canClaimDaily()) {
    const next = new Date(S.lastDaily + 86400000);
    document.getElementById("daily-content").innerHTML =
      `<div style="font-size:14px;color:rgba(255,255,255,0.6);margin:12px 0">
        Już odebrano!<br>Następny bonus: <span style="color:#ffee00">${next.getHours().toString().padStart(2,"0")}:${next.getMinutes().toString().padStart(2,"0")}</span>
      </div>`;
  } else {
    if ((Date.now() - S.lastDaily) > 172800000) S.dailyStreak = 0;
    S.dailyStreak++;
    S.lastDaily = Date.now();
    const bonus = Math.min(S.dailyStreak * 10, 100);
    S.coins += bonus;
    STORAGE.set("coins", S.coins); STORAGE.set("daily_ts", S.lastDaily); STORAGE.set("daily_streak", S.dailyStreak);
    updateCoinHud();
    document.getElementById("daily-content").innerHTML =
      `<div style="font-size:48px;margin:8px 0">🪙</div>
       <div style="font-size:22px;color:#ffee00;font-weight:700">+${bonus} monet!</div>
       <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px">
         Seria: ${S.dailyStreak} ${S.dailyStreak===1?"dzień":"dni"} — wracaj codziennie!
       </div>`;
  }
  dailyOverlay.classList.add("active");
  setTimeout(() => dailyPanel.classList.add("show"), 50);
}

// =============================================
//  SHOP
// =============================================
function animateShopPreviews() {
  const canvases = document.querySelectorAll('.skin-preview-canvas');
  if (!canvases.length) { cancelAnimationFrame(S.shopAnimFrame); S.shopAnimFrame = 0; return; }
  canvases.forEach(function(cvs) {
    const s = SKINS.find(function(sk) { return sk.id === cvs.dataset.skinId; });
    if (s) drawShopDrone(cvs, s);
  });
  S.shopAnimFrame = requestAnimationFrame(animateShopPreviews);
}

export function renderShop() {
  document.getElementById("shop-coins").textContent = S.coins;
  const grid = document.getElementById("shop-grid");
  grid.innerHTML = "";
  if (S.shopAnimFrame) { cancelAnimationFrame(S.shopAnimFrame); S.shopAnimFrame = 0; }
  for (const s of SKINS) {
    const owned = S.ownedSkins.includes(s.id);
    const equipped = S.equippedSkin === s.id;
    const canBuy = S.coins >= s.price;
    const card = document.createElement("div");
    card.className = "skin-card" + (equipped ? " equipped" : owned ? " owned" : !canBuy ? " locked" : "");
    const cvs = document.createElement("canvas");
    cvs.width = 52; cvs.height = 52; cvs.className = 'skin-preview skin-preview-canvas'; cvs.dataset.skinId = s.id;
    const info = document.createElement("div");
    info.innerHTML = `<div class="skin-name">${s.name}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:2px">${s.desc}</div>
      ${s.perkDesc ? '<div style="font-size:9px;color:#ffee00;margin-bottom:3px;font-weight:700">'+s.perkDesc+'</div>' : '<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-bottom:3px">Brak perku</div>'}
      <div class="skin-price ${s.price===0?'free':''}">
        ${equipped?'✓ Aktywny':owned?'Wybierz':s.price===0?'Darmowy':s.price+' 🪙'}
      </div>`;
    card.appendChild(cvs);
    card.appendChild(info);
    card.addEventListener("click", () => {
      if (equipped) return;
      if (owned) {
        S.equippedSkin = s.id; STORAGE.set("skin", S.equippedSkin);
        playSound("buy"); renderShop(); return;
      }
      if (s.price === 0 || S.coins >= s.price) {
        S.coins -= s.price; S.ownedSkins.push(s.id); S.equippedSkin = s.id;
        STORAGE.set("coins", S.coins); STORAGE.set("owned", S.ownedSkins); STORAGE.set("skin", S.equippedSkin);
        updateCoinHud(); playSound("buy"); renderShop();
      }
    });
    grid.appendChild(card);
  }
  requestAnimationFrame(animateShopPreviews);
}

// =============================================
//  ADS — unified: AdMob (native) / AdSense (web)
// =============================================
const IS_NATIVE = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
let admobPlugin = null;
let admobReady = false;

// AdMob IDs
const ADMOB_INTERSTITIAL_ANDROID = 'ca-app-pub-XXXX/INTERSTITIAL_ANDROID';
const ADMOB_INTERSTITIAL_IOS     = 'ca-app-pub-XXXX/INTERSTITIAL_IOS';
const ADMOB_REWARDED_ANDROID     = 'ca-app-pub-XXXX/REWARDED_ANDROID';
const ADMOB_REWARDED_IOS         = 'ca-app-pub-XXXX/REWARDED_IOS';

// Test IDs (Google official)
const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_INTERSTITIAL_IOS     = 'ca-app-pub-3940256099942544/4411468910';
const TEST_REWARDED_ANDROID     = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARDED_IOS         = 'ca-app-pub-3940256099942544/1712485313';

const USE_TEST_ADS = true;
function getAdId(type) {
  const isIos = IS_NATIVE && window.Capacitor.getPlatform() === 'ios';
  if (USE_TEST_ADS) {
    return type === 'interstitial'
      ? (isIos ? TEST_INTERSTITIAL_IOS : TEST_INTERSTITIAL_ANDROID)
      : (isIos ? TEST_REWARDED_IOS : TEST_REWARDED_ANDROID);
  }
  return type === 'interstitial'
    ? (isIos ? ADMOB_INTERSTITIAL_IOS : ADMOB_INTERSTITIAL_ANDROID)
    : (isIos ? ADMOB_REWARDED_IOS : ADMOB_REWARDED_ANDROID);
}

async function initAdMob() {
  if (!IS_NATIVE) return;
  try {
    const mod = await import('https://unpkg.com/@capacitor-community/admob@8.0.0/dist/esm/index.js').catch(() => null);
    if (mod && mod.AdMob) {
      admobPlugin = mod.AdMob;
      await admobPlugin.initialize({ initializeForTesting: USE_TEST_ADS });
      admobReady = true;
    }
  } catch(e) { console.warn('[AdMob] Init failed:', e); }
}
initAdMob();

function pushAdSense() {
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
}

// ── INTERSTITIAL ──
export function showInterstitialAd(onDone) {
  if (IS_NATIVE && admobReady) {
    showNativeInterstitial(onDone);
  } else {
    showWebInterstitial(onDone);
  }
}

async function showNativeInterstitial(onDone) {
  S.adActive = true;
  try {
    await admobPlugin.prepareInterstitial({ adId: getAdId('interstitial') });
    const handler = admobPlugin.addListener('onInterstitialAdDismissed', () => {
      handler.remove(); S.adActive = false; onDone();
    });
    await admobPlugin.showInterstitial();
  } catch(e) {
    console.warn('[AdMob] Interstitial failed:', e);
    S.adActive = false; onDone();
  }
}

function showWebInterstitial(onDone) {
  S.adActive = true;
  adInterstitial.classList.add("active");
  pushAdSense();
  let sec = 5;
  const skipEl = document.getElementById("ad-skip");
  skipEl.classList.remove("ready");
  skipEl.style.pointerEvents = "none";
  skipEl.innerHTML = 'Pomiń za <span class="ad-timer">' + sec + '</span>s';
  const iv = setInterval(() => {
    sec--;
    if (sec <= 0) {
      clearInterval(iv);
      skipEl.innerHTML = "Pomiń ✕";
      skipEl.classList.add("ready");
      skipEl.style.pointerEvents = "auto";
      skipEl.onclick = () => { adInterstitial.classList.remove("active"); skipEl.onclick = null; S.adActive = false; onDone(); };
    } else {
      skipEl.innerHTML = 'Pomiń za <span class="ad-timer">' + sec + '</span>s';
    }
  }, 1000);
}

// ── REWARDED ──
export function showRewardedAd(onReward) {
  if (IS_NATIVE && admobReady) {
    showNativeRewarded(onReward);
  } else {
    showWebRewarded(onReward);
  }
}

async function showNativeRewarded(onReward) {
  S.adActive = true;
  try {
    await admobPlugin.prepareRewardVideoAd({ adId: getAdId('rewarded') });
    const handler = admobPlugin.addListener('onRewardedVideoAdReward', () => {
      handler.remove(); onReward();
    });
    const dismiss = admobPlugin.addListener('onRewardedVideoAdDismissed', () => {
      dismiss.remove(); S.adActive = false;
    });
    await admobPlugin.showRewardVideoAd();
  } catch(e) {
    console.warn('[AdMob] Rewarded failed, granting reward:', e);
    S.adActive = false; onReward();
  }
}

function showWebRewarded(onReward) {
  S.adActive = true;
  adRewarded.classList.add("active");
  const fill = document.getElementById("rewarded-fill");
  const status = document.getElementById("rewarded-status");
  status.textContent = "Oglądasz reklamę...";
  let progress = 0;
  const iv = setInterval(() => {
    progress += 2;
    fill.style.width = progress + "%";
    if (progress >= 100) {
      clearInterval(iv);
      status.textContent = "Nagroda odebrana!";
      setTimeout(() => { adRewarded.classList.remove("active"); fill.style.width = "0"; S.adActive = false; onReward(); }, 300);
    }
  }, 60);
}

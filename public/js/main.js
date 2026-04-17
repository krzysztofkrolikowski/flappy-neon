// =============================================
//  MAIN — entry point, input, game loop
// =============================================
import { S, STORAGE } from './state.js';
import { STATE, REVIVE_COST, TICK_MS, getTaunt, getPartyTaunt, getPartyBirdScale } from './config.js';
import { canvas, ctx, W, H, resize } from './canvas.js';
import { initAudio, playSound, startMusic, stopMusic } from './audio.js';
import {
  initStars, resetGame, update, showGameOver, doRevive, updateCoinHud, showBirdBubble
} from './game.js';
import {
  drawBackground, drawPipe, drawFloatingCoins, drawGround, drawBird,
  drawPowerUpOrbs, drawSpeedLines, drawShieldBubble, drawParticles,
  drawFlash, drawEnvDebris, postProcess, invalidateGradientCache
} from './renderer.js';
import {
  showInterstitialAd, showRewardedAd, claimDaily, updateDailyBadge, renderShop
} from './ui.js';

// ── Wire callbacks to break circular deps ──
S._showInterstitialAd = showInterstitialAd;
S._getTaunt = (s) => S.partyMode ? getPartyTaunt(s) : getTaunt(s);

// ── Init ──
resize();
window.addEventListener("resize", resize);
updateCoinHud();
updateDailyBadge();
initStars();
resetGame();

// =============================================
//  INPUT
// =============================================
const muteBtn = document.getElementById('mute-btn');
function updateMuteBtn() { muteBtn.textContent = S.muted ? '🔇' : '🔊'; }
updateMuteBtn();

function toggleMute() {
  S.muted = !S.muted; STORAGE.set('muted', S.muted); updateMuteBtn();
  if (S.muted) { stopMusic(); }
  else { startMusic(); }
}
muteBtn.addEventListener('click', toggleMute);

// ── Konami Code → Party Fowl Mode ──
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
let konamiIdx = 0;
const partyBanner = document.getElementById('party-banner');
function updatePartyIndicator() {
  const el = document.getElementById('party-indicator');
  if (el) el.style.display = S.partyMode ? 'block' : 'none';
}
updatePartyIndicator();

document.addEventListener('keydown', function konamiListener(e) {
  if (S.state !== STATE.MENU) { konamiIdx = 0; return; }
  if (e.code === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      S.partyMode = !S.partyMode;
      STORAGE.set('party', S.partyMode);
      initAudio();
      playSound('party_activate');
      if (S.partyMode) {
        partyBanner.textContent = '🐔🎉 PARTY FOWL MODE 🎉🐔';
        partyBanner.style.color = '#ffee00';
      } else {
        partyBanner.textContent = '🐔 PARTY MODE OFF 🐔';
        partyBanner.style.color = '#ff4466';
      }
      partyBanner.classList.add('show');
      setTimeout(() => partyBanner.classList.remove('show'), 2200);
      updatePartyIndicator();
    }
  } else { konamiIdx = e.code === KONAMI[0] ? 1 : 0; }
});

function thrustStart() {
  if (S.adActive) return;
  initAudio();
  if (!S.muted && !S.musicPlaying) startMusic();
  if (S.state === STATE.PLAYING && !S.isThrusting) {
    S.isThrusting = true; playSound(S.partyMode ? "fart" : "flap");
  }
}
function thrustStop() { S.isThrusting = false; }

function goToMenu() {
  S.state = STATE.MENU; S.isThrusting = false;
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('go-panel').classList.remove('show');
  document.getElementById('go-overlay').classList.remove('active');
  document.getElementById('score-display').classList.remove('visible');
  document.getElementById('menu-overlay').classList.add('active');
  resetGame(); invalidateGradientCache();
}

function startGame() {
  if (S.adActive) return;
  initAudio();
  if (!S.muted && !S.musicPlaying) startMusic();
  resetGame(); invalidateGradientCache(); S.state = STATE.PLAYING; S.isThrusting = false;
  S.lastTime = 0; S.accumulator = 0;
  document.getElementById('menu-overlay').classList.remove("active");
  document.getElementById('go-overlay').classList.remove("active");
  document.getElementById('go-panel').classList.remove("show");
  document.getElementById('score-display').classList.add("visible");
  S.bird.vy = -4; playSound(S.partyMode ? "fart" : "flap");
  showBirdBubble('start');
}

// Start music on first user interaction
function ensureMusic() {
  initAudio();
  if (!S.muted && !S.musicPlaying) startMusic();
}
['pointerdown','keydown','touchstart'].forEach(evt => {
  document.addEventListener(evt, function onFirst() {
    ensureMusic();
    document.removeEventListener(evt, onFirst);
  }, { once: true });
});

// =============================================
//  EVENT LISTENERS
// =============================================
canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (S.adActive) return;
  if (S.state === STATE.PLAYING) thrustStart();
  else if (S.state === STATE.MENU) startGame();
  else if (S.state === STATE.DYING) { S.state = STATE.DEAD; S.timeScaleTarget = 1; S.chromAb = 0; showGameOver(); }
  else if (S.state === STATE.DEAD) {
    document.getElementById('go-panel').classList.remove("show");
    setTimeout(() => { document.getElementById('go-overlay').classList.remove("active"); startGame(); }, 200);
  }
});

document.addEventListener("pointerdown", e => {
  if (S.state === STATE.DYING && !S.adActive) { e.preventDefault(); S.state = STATE.DEAD; S.timeScaleTarget = 1; S.chromAb = 0; showGameOver(); }
});

canvas.addEventListener("pointerup", () => thrustStop());
canvas.addEventListener("pointerleave", () => thrustStop());
canvas.addEventListener("pointercancel", () => thrustStop());

document.addEventListener("keydown", e => {
  if (S.adActive) return;
  if (e.code === "Escape") {
    e.preventDefault();
    if (S.state === STATE.PLAYING) { S.state = STATE.PAUSED; S.isThrusting = false; document.getElementById('pause-overlay').classList.add('active'); }
    else if (S.state === STATE.PAUSED) { S.state = STATE.PLAYING; document.getElementById('pause-overlay').classList.remove('active'); S.lastTime = 0; S.accumulator = 0; }
    return;
  }
  if (e.code === "KeyM") { toggleMute(); return; }
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
    e.preventDefault();
    if (S.state === STATE.PLAYING) thrustStart();
    else if (S.state === STATE.PAUSED) { S.state = STATE.PLAYING; document.getElementById('pause-overlay').classList.remove('active'); S.lastTime = 0; S.accumulator = 0; }
    else if (S.state === STATE.MENU) startGame();
    else if (S.state === STATE.DYING) { S.state = STATE.DEAD; S.timeScaleTarget = 1; S.chromAb = 0; showGameOver(); }
    else if (S.state === STATE.DEAD) {
      document.getElementById('go-panel').classList.remove("show");
      setTimeout(() => { document.getElementById('go-overlay').classList.remove("active"); startGame(); }, 200);
    }
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") thrustStop();
});

// Buttons
document.getElementById("btn-play").addEventListener("click", e => { e.stopPropagation(); startGame(); });
document.getElementById("btn-resume").addEventListener("click", e => { e.stopPropagation(); S.state = STATE.PLAYING; document.getElementById('pause-overlay').classList.remove('active'); S.lastTime = 0; S.accumulator = 0; });
document.getElementById("btn-menu-pause").addEventListener("click", e => { e.stopPropagation(); goToMenu(); });
document.getElementById("btn-menu-go").addEventListener("click", e => { e.stopPropagation(); goToMenu(); });

document.getElementById("btn-shop").addEventListener("click", e => {
  e.stopPropagation(); renderShop();
  document.getElementById('shop-overlay').classList.add("active");
  setTimeout(() => document.getElementById('shop-panel').classList.add("show"), 50);
});
document.getElementById("btn-shop-go").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById('go-panel').classList.remove("show");
  setTimeout(() => {
    document.getElementById('go-overlay').classList.remove("active");
    renderShop();
    document.getElementById('shop-overlay').classList.add("active");
    setTimeout(() => document.getElementById('shop-panel').classList.add("show"), 50);
  }, 200);
});
document.getElementById("btn-shop-close").addEventListener("click", () => {
  document.getElementById('shop-panel').classList.remove("show");
  setTimeout(() => document.getElementById('shop-overlay').classList.remove("active"), 300);
});

document.getElementById("btn-daily").addEventListener("click", e => { e.stopPropagation(); claimDaily(); });
document.getElementById("btn-daily-close").addEventListener("click", () => {
  document.getElementById('daily-panel').classList.remove("show");
  setTimeout(() => document.getElementById('daily-overlay').classList.remove("active"), 300);
  updateDailyBadge();
});

document.getElementById("btn-restart").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById('go-panel').classList.remove("show");
  setTimeout(() => { document.getElementById('go-overlay').classList.remove("active"); startGame(); }, 200);
});
document.getElementById("btn-revive").addEventListener("click", e => {
  e.stopPropagation(); S.coins -= REVIVE_COST; STORAGE.set("coins", S.coins); updateCoinHud(); doRevive();
});
document.getElementById("btn-revive-ad").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById('go-overlay').classList.remove("active");
  document.getElementById('go-panel').classList.remove("show");
  showRewardedAd(() => doRevive());
});

document.getElementById("btn-share").addEventListener("click", e => {
  e.stopPropagation();
  const text = `NEON DRIFT — ${S.score} pkt! ${S.maxCombo > 3 ? 'Combo x' + S.maxCombo + '! ' : ''}Pokonaj mnie! 🚀`;
  const url = 'https://public-delta-umber.vercel.app';
  if (navigator.share) {
    navigator.share({ title: 'Neon Drift', text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text + ' ' + url).then(() => {
      const btn = document.getElementById('btn-share');
      btn.textContent = '✅ Skopiowano!';
      setTimeout(() => btn.textContent = '📤 Udostępnij', 1500);
    }).catch(() => {});
  }
});

// =============================================
//  GAME LOOP (fixed timestep — 60 ticks/s)
// =============================================
const _BUILD = 'v46-modules';
let _lastError = '';
let _fpsFrames = 0, _fpsLast = 0, _fpsDisplay = 0;

function frame(now) {
  if (S.state === STATE.PAUSED) { S.lastTime = 0; requestAnimationFrame(frame); return; }
  const _now = Date.now();
  _fpsFrames++;
  if (_now - _fpsLast >= 500) { _fpsDisplay = Math.round(_fpsFrames * 1000 / (_now - _fpsLast)); _fpsFrames = 0; _fpsLast = _now; }
  if (!S.lastTime) S.lastTime = now;
  const rawDt = Math.min(now - S.lastTime, 100);
  S.lastTime = now;
  const dt = rawDt * S.timeScale;
  S.accumulator += dt;
  // Cap catch-up to 4 ticks max to prevent cascading lag after a stall
  let ticks = 0;
  while (S.accumulator >= TICK_MS && ticks < 4) {
    try { update(); } catch(e) {
      if (_lastError !== e.message) { _lastError = e.message; console.error('[update crash]', e); }
      if (S.state === STATE.PLAYING) { S.state = STATE.DEAD; showGameOver(); }
    }
    S.accumulator -= TICK_MS;
    ticks++;
  }
  if (S.accumulator > TICK_MS * 2) S.accumulator = 0; // drop excess
  try {
  ctx.save();
  if (S.shakeMag > 0.5) ctx.translate(S.shakeX, S.shakeY);
  drawBackground();
  drawSpeedLines();
  for (const p of S.pipes) drawPipe(p);
  drawFloatingCoins(); drawPowerUpOrbs();
  drawGround(); drawBird(); drawShieldBubble(); drawEnvDebris(); drawParticles(); drawFlash();
  // Speech bubble above bird
  if (S.speechBubble && S.speechBubble.opacity > 0) {
    const b = S.speechBubble;
    const bx = S.bird.x;
    const by = S.bird.y - 38 + b.floatY;
    ctx.save();
    ctx.globalAlpha = b.opacity;
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    const metrics = ctx.measureText(b.text);
    const tw = metrics.width + 16;
    const th = 22;
    const rx = bx - tw / 2;
    const ry = by - th / 2;
    // Bubble background
    ctx.fillStyle = 'rgba(10,10,30,0.85)';
    ctx.strokeStyle = S.currentZone ? S.currentZone.accent : '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = S.currentZone ? S.currentZone.accent : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const cr = 8;
    ctx.moveTo(rx + cr, ry);
    ctx.lineTo(rx + tw - cr, ry);
    ctx.arcTo(rx + tw, ry, rx + tw, ry + cr, cr);
    ctx.lineTo(rx + tw, ry + th - cr);
    ctx.arcTo(rx + tw, ry + th, rx + tw - cr, ry + th, cr);
    ctx.lineTo(rx + cr, ry + th);
    ctx.arcTo(rx, ry + th, rx, ry + th - cr, cr);
    ctx.lineTo(rx, ry + cr);
    ctx.arcTo(rx, ry, rx + cr, ry, cr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bubble tail (triangle pointing down to bird)
    ctx.fillStyle = 'rgba(10,10,30,0.85)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(bx - 5, ry + th);
    ctx.lineTo(bx, ry + th + 6);
    ctx.lineTo(bx + 5, ry + th);
    ctx.closePath();
    ctx.fill();
    // Text
    ctx.fillStyle = '#fff';
    ctx.shadowColor = S.currentZone ? S.currentZone.accent : '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.fillText(b.text, bx, by + 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  // "TAP TO SKIP" hint during DYING
  if (S.state === STATE.DYING) {
    const hAlpha = 0.4 + Math.sin(_now * 0.008) * 0.3;
    ctx.globalAlpha = hAlpha;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ff4466'; ctx.shadowBlur = 12;
    ctx.fillText('DOTKNIJ ABY POMINĄĆ', W / 2, H * 0.78);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  ctx.restore();
  postProcess();
  } catch(e) { console.error('[render error]', e); _lastError = _lastError || e.message; }
  // Debug overlay
  ctx.save();
  ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(_BUILD + ' s=' + S.state + ' fps=' + _fpsDisplay + ' p=' + S.particles.length, 4, H - 4);
  if (_lastError) {
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 11px monospace';
    ctx.fillText('ERR: ' + _lastError, 4, H - 18);
  }
  ctx.restore();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// PWA — register SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

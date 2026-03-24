// =============================================
//  STATE — persistence + shared mutable state
// =============================================
import { PIPE_SPEED_START, PIPE_GAP_START, ZONES, STATE } from './config.js';

export const STORAGE = {
  get(key, fallback) {
    try { const v = localStorage.getItem("fn_" + key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem("fn_" + key, JSON.stringify(val)); } catch {} }
};

export const S = {
  // Persisted
  coins: 0,
  bestScore: 0,
  ownedSkins: ['neon'],
  equippedSkin: 'neon',
  totalGames: 0,
  deathsSinceAd: 0,
  lastDaily: 0,
  dailyStreak: 0,
  unlockedAchievements: [],
  muted: false,

  // Game session
  state: STATE.MENU,
  score: 0,
  sessionCoins: 0,
  reviveUsed: false,

  bird: { x:0, y:0, vy:0, angle:0, wingPhase:0, trail:[] },
  pipes: [],
  pipeTimer: 0,
  floatingCoins: [],
  isThrusting: false,
  gameSpeed: PIPE_SPEED_START,
  pipeGap: PIPE_GAP_START,
  groundX: 0,
  shakeX: 0, shakeY: 0, shakeMag: 0,
  flash: 0,

  starParticles: [],
  particles: [],
  speedLines: [],

  timeScale: 1, timeScaleTarget: 1,
  chromAb: 0,
  screenPulse: 0,
  deathFreezeFrames: 0,
  envDebris: [],
  streakTimer: 0,

  // Combo
  combo: 0, comboTimer: 0, comboMultiplier: 1, maxCombo: 0,

  // Power-ups
  activePowerUp: null, powerUpTimer: 0, powerUpOrbs: [],
  shieldHits: 0, secondChanceUsed: false,

  // Zone
  currentZone: ZONES[0],
  lastZoneIdx: 0,

  // Achievements
  driftCount: 0,
  achievementQueue: [],
  achievementShowing: false,

  // Ads
  adActive: false,

  // Audio
  musicPlaying: false,
  musicNodes: [],

  // Timing
  lastTime: 0,
  accumulator: 0,

  // Shop
  shopAnimFrame: 0,

  // Dying
  dyingTimer: 0,

  // Callbacks (set by main.js to break circular deps)
  _showInterstitialAd: null,
  _getTaunt: null,
};

// Hydrate from localStorage
S.coins = STORAGE.get("coins", 0);
S.bestScore = STORAGE.get("best", 0);
S.ownedSkins = STORAGE.get("owned", ["neon"]);
S.equippedSkin = STORAGE.get("skin", "neon");
S.totalGames = STORAGE.get("games", 0);
S.deathsSinceAd = STORAGE.get("deaths_ad", 0);
S.lastDaily = STORAGE.get("daily_ts", 0);
S.dailyStreak = STORAGE.get("daily_streak", 0);
S.unlockedAchievements = STORAGE.get('achievements', []);
S.muted = STORAGE.get('muted', false);

// =============================================
//  CONFIG — constants, skins, zones, achievements
// =============================================

export const BIRD_SIZE = 22;
export const THRUST_POWER = 0.55;
export const DRIFT_GRAV = 0.30;
export const MAX_VY = 7;
export const PIPE_WIDTH = 16;
export const PIPE_GAP_START = 240;
export const PIPE_GAP_MIN = 175;
export const PIPE_SPEED_START = 3.0;
export const PIPE_SPEED_MAX = 5.5;
export const PIPE_SPACING = 300;
export const GROUND_HEIGHT = 70;
export const AD_EVERY_N_DEATHS = 3;
export const REVIVE_COST = 50;
export const TICK_MS = 1000 / 60;
export const COMBO_DECAY = 180;
export const MUSIC_VOL = 0.05;

export const STATE = { MENU: 0, PLAYING: 1, DYING: 2, DEAD: 3, PAUSED: 4 };

export const streakMilestones = [5,10,15,20,25,30,40,50,75,100];

export const SKINS = [
  { id: "neon",    name: "Cyan",      price: 0,    body: "#00d4ff", glow: "#00f0ff", ring: "#0090cc", thrust: "#00aaff", fx: "none", desc: "Dron rekonesansowy", perk: null, perkDesc: null },
  { id: "fire",    name: "Plasma",    price: 100,  body: "#ff5533", glow: "#ff4400", ring: "#cc3300", thrust: "#ffaa00", fx: "plasma", desc: "Myśliwiec delta V-wing", perk: "thrust_boost", perkDesc: "🔥 +15% siła thrustu" },
  { id: "toxic",   name: "Acid",      price: 150,  body: "#44ff44", glow: "#00ff44", ring: "#22aa22", thrust: "#88ff88", fx: "acid", desc: "Bio-pasożyt z mackami", perk: "combo_slow", perkDesc: "🧪 Combo spada 30% wolniej" },
  { id: "sunset",  name: "Solar",     price: 200,  body: "#ff8844", glow: "#ff6600", ring: "#cc5500", thrust: "#ffcc44", fx: "solar", desc: "Słoneczny skarabeusz", perk: "coin_magnet", perkDesc: "☀️ Zasięg magnesu +40%" },
  { id: "purple",  name: "Void",      price: 300,  body: "#bb44ff", glow: "#aa00ff", ring: "#8822cc", thrust: "#dd88ff", fx: "void", desc: "Czarna dziura + dysk", perk: "gap_widen", perkDesc: "🕳️ Rury +8% szersze" },
  { id: "golden",  name: "Aurum",     price: 500,  body: "#ffd700", glow: "#ffaa00", ring: "#cc9900", thrust: "#ffee88", fx: "aurum", desc: "Imperialny krążownik", perk: "coin_bonus", perkDesc: "👑 +25% monet" },
  { id: "rainbow", name: "Prism",     price: 1000, body: "rainbow", glow: "#ff00e6", ring: "#8822cc", thrust: "#ffffff", fx: "prism", desc: "Kryształowy pryzmat", perk: "powerup_luck", perkDesc: "🌈 2× szansa na power-up" },
  { id: "ghost",   name: "Phantom",   price: 750,  body: "rgba(200,200,255,0.5)", glow: "rgba(200,200,255,0.3)", ring: "rgba(150,150,220,0.4)", thrust: "rgba(180,180,255,0.5)", fx: "phantom", desc: "Widmowy wraith", perk: "small_hitbox", perkDesc: "👻 Hitbox -15%" },
  { id: "matrix",  name: "Glitch",    price: 400,  body: "#00ff41", glow: "#00ff41", ring: "#008f11", thrust: "#00ff41", fx: "glitch", desc: "Wireframe sześcian 3D", perk: "powerup_extend", perkDesc: "⚡ Power-upy +30% dłużej" },
  { id: "cerberus", name: "CERBERUS", price: 1500, body: "#cc1100", glow: "#ff2200", ring: "#881100", thrust: "#ff6600", fx: "hellfire", desc: "Trójgłowy piekielny pies. Gryziesz — płoniesz.", perk: "second_chance", perkDesc: "🔥 1 darmowe zderzenie na grę" },
  { id: "plague",   name: "PLAGUE",   price: 2000, body: "#aacc22", glow: "#88aa00", ring: "#667700", thrust: "#ccff44", fx: "disease", desc: "Zaraza. Trucizna. Rozkład. Bez leku.", perk: "combo_floor", perkDesc: "☠️ Combo nie spada poniżej 3" },
  { id: "kraken",   name: "KRAKEN",   price: 2500, body: "#004455", glow: "#00ccdd", ring: "#006677", thrust: "#44ffee", fx: "abyss", desc: "Z dna oceanu. 8 macek. Miażdży kadłuby.", perk: "gravity_reduce", perkDesc: "🐙 -12% grawitacji" },
  { id: "banshee",  name: "BANSHEE",  price: 3000, body: "#eeeeff", glow: "#ccccff", ring: "#aaaadd", thrust: "#ffffff", fx: "scream", desc: "Krzyk zabija. Fala uderzeniowa łamie kości.", perk: "speed_cap", perkDesc: "👻 Max prędkość rur -8%" },
  { id: "abyssal",  name: "ABYSSAL",  price: 5000, body: "#110011", glow: "#ff0033", ring: "#440000", thrust: "#ff0066", fx: "demon", desc: "Demon z Otchłani. Rogi. Ogień piekielny. Koniec.", perk: "demon_aura", perkDesc: "😈 Hitbox -10%, combo -20% wolniej, +15% monet" },
];

export const POWERUP_TYPES = [
  { id:'shield', icon:'🛡️', color:'#00ffaa', dur:300, desc:'Tarcza' },
  { id:'magnet', icon:'🧲', color:'#ff00e6', dur:360, desc:'Magnes' },
  { id:'slowmo', icon:'⏳', color:'#00aaff', dur:240, desc:'Slow-Mo' },
  { id:'x2',     icon:'×2', color:'#ffee00', dur:300, desc:'x2 Monety' },
];

export const ZONES = [
  { name:'NEON CITY', from:0,  bg1:'#050510', bg2:'#0a0a25', bg3:'#10103a', ground:'#1a0030', accent:'#ff00e6', laser:'#ff0066' },
  { name:'ACID WASTE', from:15, bg1:'#051005', bg2:'#0a250a', bg3:'#103a10', ground:'#003a1a', accent:'#00ff44', laser:'#44ff00' },
  { name:'PLASMA CORE', from:30, bg1:'#100505', bg2:'#250a0a', bg3:'#3a1010', ground:'#3a001a', accent:'#ff4400', laser:'#ff6600' },
  { name:'VOID RIM', from:50, bg1:'#0a0510', bg2:'#150a25', bg3:'#20103a', ground:'#1a0040', accent:'#aa00ff', laser:'#bb44ff' },
  { name:'SINGULARITY', from:75, bg1:'#020208', bg2:'#050515', bg3:'#080828', ground:'#0a0020', accent:'#ffffff', laser:'#ffffff' },
];

export const ACHIEVEMENTS = [
  { id:'first_game', name:'🎮 Początek',      cond: S => S.totalGames >= 1 },
  { id:'score_10',   name:'🌟 Debiutant',     cond: S => S.score >= 10 },
  { id:'score_25',   name:'🔥 Weteran',       cond: S => S.score >= 25 },
  { id:'score_50',   name:'💀 Legenda',       cond: S => S.score >= 50 },
  { id:'combo_5',    name:'⚡ Combo x5',      cond: S => S.maxCombo >= 5 },
  { id:'combo_10',   name:'🌊 Combo x10',     cond: S => S.maxCombo >= 10 },
  { id:'drift_3',    name:'🎯 Drift Master',  cond: S => S.driftCount >= 3 },
  { id:'coins_100',  name:'💰 Bogacz',        cond: S => S.coins >= 100 },
  { id:'coins_500',  name:'💎 Milioner',      cond: S => S.coins >= 500 },
  { id:'shield_save',name:'🛡️ Życie z Tarczy',cond: S => S.shieldHits >= 1 },
  { id:'games_10',   name:'🔁 Uzależniony',   cond: S => S.totalGames >= 10 },
  { id:'games_50',   name:'🎰 Niezatrzymany', cond: S => S.totalGames >= 50 },
];

export const TAUNTS = [
  ['Serio?','No dawaj, spróbuj jeszcze raz...','Nie poddawaj się!','Prawie!'],
  ['Niezły start!','Widzisz? Idzie!','Lepiej niż ostatnio!'],
  ['Wow, talent!','Niezatrzymany!','Szacun!','Giga chad!'],
  ['CO?! Legenda!','Niemożliwe!','Jesteś bogiem?!'],
];

export function getTaunt(s) {
  const tier = s >= 50 ? 3 : s >= 25 ? 2 : s >= 10 ? 1 : 0;
  const arr = TAUNTS[tier];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function hasPerk(perkId, equippedSkin) {
  const s = SKINS.find(sk => sk.id === equippedSkin);
  if (!s) return false;
  if (s.perk === perkId) return true;
  if (s.perk === 'demon_aura') {
    if (perkId === 'small_hitbox' || perkId === 'combo_slow' || perkId === 'coin_bonus') return true;
  }
  return false;
}

export const CHORDS = [
  [164.81, 246.94, 369.99],
  [130.81, 196.00, 329.63],
  [110.00, 164.81, 261.63],
  [123.47, 185.00, 293.66],
];
export const BASS_NOTES = [82.41, 65.41, 55.00, 61.74];
export const ARP_NOTES = [
  [329.63,493.88,659.26,493.88],
  [261.63,392.00,523.25,392.00],
  [220.00,329.63,440.00,329.63],
  [246.94,369.99,493.88,369.99],
];

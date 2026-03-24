// =============================================
//  Script: Extract drawing functions from index.html → renderer.js
// =============================================
const fs = require('fs');
const src = fs.readFileSync('public/index.html', 'utf-8');

// Extract a function body by finding matching braces
function extractFunction(name, src) {
  const pattern = new RegExp('function\\s+' + name + '\\s*\\(');
  const match = pattern.exec(src);
  if (!match) { console.error('NOT FOUND: ' + name); return ''; }
  const start = match.index;
  let i = src.indexOf('{', start);
  let depth = 0;
  let inStr = false, strCh = '', escaped = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (inStr) { if (ch === strCh) inStr = false; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.substring(start, i);
}

const header = `// =============================================
//  RENDERER — all drawing functions
// =============================================
import { S } from './state.js';
import { BIRD_SIZE, GROUND_HEIGHT, PIPE_WIDTH, SKINS, STATE, ZONES } from './config.js';
import { ctx, fxCanvas, fxCtx, W, H, canvas } from './canvas.js';
import { getSkinColors } from './game.js';

`;

const funcNames = [
  'drawShopDrone', 'drawBackground', 'drawPipe', 'drawFloatingCoins',
  'drawGround', 'drawBird', 'drawPowerUpOrbs', 'drawSpeedLines',
  'drawShieldBubble', 'drawParticles', 'drawFlash', 'drawEnvDebris', 'postProcess'
];

let output = header;

for (const name of funcNames) {
  let body = extractFunction(name, src);
  if (!body) continue;

  // Add export keyword
  body = body.replace(/^function\s/, 'export function ');

  // State variable replacements (careful with word boundaries)
  // Use negative lookbehind to avoid replacing inside longer words
  const replacements = [
    // Object references (dot access)
    [/\bbird\./g, 'S.bird.'],
    [/\bbird,/g, 'S.bird,'],
    // State check patterns
    [/\bstate===STATE/g, 'S.state===STATE'],
    [/\bstate!==STATE/g, 'S.state!==STATE'],
    // Boolean/variable reads
    [/\bisThrusting\b/g, 'S.isThrusting'],
    [/\bcurrentZone\b/g, 'S.currentZone'],
    [/\bequippedSkin\b/g, 'S.equippedSkin'],
    [/\bgroundX\b/g, 'S.groundX'],
    [/\bstarParticles\b/g, 'S.starParticles'],
    [/\bfloatingCoins\b/g, 'S.floatingCoins'],
    [/\bpowerUpOrbs\b/g, 'S.powerUpOrbs'],
    [/\bactivePowerUp\b/g, 'S.activePowerUp'],
    [/\bspeedLines\b/g, 'S.speedLines'],
    [/\bparticles\b/g, 'S.particles'],
    [/\benvDebris\b/g, 'S.envDebris'],
    [/\bshakeMag\b/g, 'S.shakeMag'],
    [/\bflash\b/g, 'S.flash'],
    [/\bchromAb\b/g, 'S.chromAb'],
    [/\bscreenPulse\b/g, 'S.screenPulse'],
    [/\btimeScale\b/g, 'S.timeScale'],
    [/\bgameSpeed\b/g, 'S.gameSpeed'],
  ];

  // drawShopDrone uses its own canvas context 'c', not main ctx
  // It takes (cvs, s) as params where s is a skin object — don't replace s.body etc
  if (name === 'drawShopDrone') {
    // Only minimal replacements for drawShopDrone — it's mostly self-contained
    // Skip most state replacements, just add export
    output += body + '\n\n';
    continue;
  }

  for (const [pat, rep] of replacements) {
    body = body.replace(pat, rep);
  }

  // Fix over-replacements
  // "S.flash" inside function params or CSS strings shouldn't be replaced
  // Fix S.flash appearing in event-unrelated places
  body = body.replace(/S\.flash>0/g, 'S.flash>0');  // already correct
  // Fix potential double-S prefix
  body = body.replace(/S\.S\./g, 'S.');

  output += body + '\n\n';
}

fs.writeFileSync('public/js/renderer.js', output, 'utf-8');
const lines = output.split('\n').length;
console.log(`renderer.js created: ${lines} lines, ${output.length} bytes`);
console.log('Exported functions:', funcNames.join(', '));

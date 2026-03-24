// =============================================
//  GAME — core logic, collision, spawning, update
// =============================================
import { S, STORAGE } from './state.js';
import {
  BIRD_SIZE, THRUST_POWER, DRIFT_GRAV, MAX_VY,
  PIPE_WIDTH, PIPE_GAP_START, PIPE_GAP_MIN,
  PIPE_SPEED_START, PIPE_SPEED_MAX, PIPE_SPACING,
  GROUND_HEIGHT, AD_EVERY_N_DEATHS, COMBO_DECAY,
  POWERUP_TYPES, STATE, ZONES, ACHIEVEMENTS, SKINS,
  streakMilestones, hasPerk
} from './config.js';
import { W, H, triggerBassPulse } from './canvas.js';
import { playSound } from './audio.js';

// DOM refs
const scoreDisplay = document.getElementById("score-display");
const comboHud = document.getElementById('combo-hud');
const comboText = document.getElementById('combo-text');
const comboFill = document.getElementById('combo-fill');
const powerupHud = document.getElementById('powerup-hud');
const streakPopup = document.getElementById("streak-popup");
const achievementToast = document.getElementById('achievement-toast');
const zoneBanner = document.getElementById('zone-banner');
const goOverlay = document.getElementById("go-overlay");
const goPanel = document.getElementById("go-panel");
const coinCount = document.getElementById("coin-count");

export function updateCoinHud() { coinCount.textContent = S.coins; }

export function initStars() {
  S.starParticles = [];
  for (let i = 0; i < 80; i++)
    S.starParticles.push({ x:Math.random()*W, y:Math.random()*H, size:Math.random()*2+0.5, speed:Math.random()*0.3+0.1, flicker:Math.random()*Math.PI*2 });
}

export function resetGame() {
  S.bird.x=W*0.22; S.bird.y=H*0.42; S.bird.vy=0; S.bird.angle=0; S.bird.wingPhase=0; S.bird.trail=[];
  S.pipes=[]; S.pipeTimer=PIPE_SPACING; S.score=0; S.sessionCoins=0; S.reviveUsed=false; S.floatingCoins=[];
  S.gameSpeed=PIPE_SPEED_START; S.pipeGap=PIPE_GAP_START;
  S.groundX=0; S.shakeX=0; S.shakeY=0; S.shakeMag=0; S.flash=0; S.particles=[]; S.speedLines=[]; S.isThrusting=false;
  S.combo=0; S.comboTimer=0; S.comboMultiplier=1; S.maxCombo=0; S.driftCount=0;
  S.activePowerUp=null; S.powerUpTimer=0; S.powerUpOrbs=[]; S.shieldHits=0;
  S.secondChanceUsed=false;
  S.currentZone=ZONES[0]; S.lastZoneIdx=0;
  S.timeScale=1; S.timeScaleTarget=1; S.chromAb=0; S.screenPulse=0; S.deathFreezeFrames=0; S.envDebris=[];
  comboHud.classList.remove('visible'); powerupHud.classList.remove('visible');
  scoreDisplay.textContent="0";
}

export function spawnPipe() {
  const gapVariation = (Math.random() - 0.5) * 60;
  const gapMod = hasPerk('gap_widen', S.equippedSkin) ? 1.08 : 1;
  const thisGap = Math.max(PIPE_GAP_MIN, Math.min((S.pipeGap + gapVariation) * gapMod, (PIPE_GAP_START + 20) * gapMod));
  const minY=80, maxY=H-GROUND_HEIGHT-thisGap-80;
  const travelTicks = PIPE_SPACING / Math.max(S.gameSpeed, PIPE_SPEED_START);
  const maxReach = MAX_VY * travelTicks * 0.65;
  let topH;
  const prev = S.pipes.length > 0 ? S.pipes[S.pipes.length - 1] : null;
  if (prev) {
    const prevCenter = prev.topH + prev.gap / 2;
    const prevWorst = prev.moving ? prev.moveRange || 0 : 0;
    const lo = Math.max(minY, prevCenter - thisGap/2 - maxReach + prevWorst);
    const hi = Math.min(maxY, prevCenter - thisGap/2 + maxReach - prevWorst);
    if (lo < hi) { topH = lo + Math.random() * (hi - lo); }
    else { topH = Math.max(minY, Math.min(maxY, prevCenter - thisGap/2)); }
  } else { topH = minY + Math.random() * (maxY - minY); }
  const isMoving = S.score >= 5 && Math.random() < 0.6;
  const moveSpeed = 0.5 + Math.random() * 0.8;
  let moveRange = 25 + Math.random() * 35;
  if (prev && isMoving) {
    const prevCenter = prev.topH + prev.gap / 2;
    const thisCenter = topH + thisGap / 2;
    const dist = Math.abs(thisCenter - prevCenter);
    const prevWorst = prev.moving ? (prev.moveRange || 0) : 0;
    const allowed = Math.max(10, maxReach - dist - prevWorst);
    moveRange = Math.min(moveRange, allowed);
  }
  const moveMin = Math.max(60, topH - moveRange);
  const moveMax = Math.min(H - GROUND_HEIGHT - thisGap - 60, topH + moveRange);
  const effectiveMoving = isMoving && (moveMax - moveMin > 15);
  S.pipes.push({ x:W+20, topH, gap:thisGap, scored:false, glow:0,
    moving:effectiveMoving, moveDir:Math.random()<0.5?1:-1, moveSpeed,
    moveMin, moveMax, moveRange });
  if (Math.random() < 0.7) {
    const coinY = topH + thisGap * (0.2 + Math.random() * 0.6);
    S.floatingCoins.push({ x: W + 20 + PIPE_WIDTH/2, y: coinY, collected: false, wobble: Math.random()*Math.PI*2 });
  }
  if (S.score > 5 && Math.random() < 0.2) {
    const bonusY = Math.random() * (H - GROUND_HEIGHT - 100) + 50;
    S.floatingCoins.push({ x: W + 120 + Math.random()*80, y: bonusY, collected: false, wobble: Math.random()*Math.PI*2, bonus: true });
  }
  const puChance = hasPerk('powerup_luck', S.equippedSkin) ? 0.16 : 0.08;
  if (S.score > 3 && Math.random() < puChance && !S.activePowerUp) {
    const puType = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
    const puY = topH + thisGap * (0.3 + Math.random() * 0.4);
    S.powerUpOrbs.push({ x: W + 80 + Math.random()*60, y: puY, type: puType, collected: false, wobble: Math.random()*Math.PI*2 });
  }
}

function addCombo() {
  S.combo++; S.comboTimer=COMBO_DECAY;
  S.comboMultiplier=1+Math.floor(S.combo/3)*0.5;
  if(S.combo>S.maxCombo) S.maxCombo=S.combo;
  const coins = Math.max(1,Math.floor(S.comboMultiplier));
  comboText.textContent = S.combo < 3 ? `COMBO x${S.combo}` : `COMBO x${S.combo} 🪙${coins}`;
  comboFill.style.width='100%';
  comboHud.classList.add('visible','bump');
  setTimeout(()=>comboHud.classList.remove('bump'),150);
  if(S.combo===5||S.combo===10||S.combo===15||S.combo===20) {
    showStreak(`🔥 COMBO x${S.combo}!`);
    playSound('milestone');
    burst(S.bird.x,S.bird.y,'#ff00e6',15+S.combo);
    S.chromAb=4+S.combo*0.5; S.screenPulse=0.6; triggerBassPulse('combo');
    haptic();
  }
}

function decayCombo() {
  const comboDecayMod = hasPerk('combo_slow', S.equippedSkin) ? 0.7 : (hasPerk('demon_aura', S.equippedSkin) ? 0.8 : 1);
  if(S.comboTimer>0){ S.comboTimer-=comboDecayMod; comboFill.style.width=(S.comboTimer/COMBO_DECAY*100)+'%'; }
  else if(S.combo>0){
    const floor = hasPerk('combo_floor', S.equippedSkin) ? 3 : 0;
    if(S.combo>floor){ S.combo=floor; S.comboMultiplier=floor>0?1+Math.floor(floor/3)*0.5:1; }
    if(S.combo<=0){ comboHud.classList.remove('visible'); }
  }
}

function checkZone() {
  let zi=0;
  for(let i=ZONES.length-1;i>=0;i--) { if(S.score>=ZONES[i].from){zi=i;break;} }
  if(zi!==S.lastZoneIdx) {
    S.lastZoneIdx=zi; S.currentZone=ZONES[zi];
    zoneBanner.textContent=S.currentZone.name;
    zoneBanner.style.color=S.currentZone.accent;
    zoneBanner.style.textShadow=`0 0 30px ${S.currentZone.accent}`;
    zoneBanner.classList.add('show');
    setTimeout(()=>zoneBanner.classList.remove('show'),2000);
    playSound('milestone'); haptic();
  }
}

function checkAchievements() {
  for(const a of ACHIEVEMENTS) {
    if(!S.unlockedAchievements.includes(a.id) && a.cond(S)) {
      S.unlockedAchievements.push(a.id);
      STORAGE.set('achievements', S.unlockedAchievements);
      S.achievementQueue.push(a.name);
      if(!S.achievementShowing) showNextAchievement();
    }
  }
}

function showNextAchievement() {
  if(!S.achievementQueue.length){ S.achievementShowing=false; return; }
  S.achievementShowing=true;
  const name=S.achievementQueue.shift();
  achievementToast.textContent=`🏆 ${name}`;
  achievementToast.classList.add('show');
  playSound('buy');
  setTimeout(()=>{ achievementToast.classList.remove('show'); setTimeout(showNextAchievement,400); },2500);
}

export function haptic() { if(navigator.vibrate) navigator.vibrate(30); }

function spawnSpeedLines() {
  if(S.gameSpeed>3.5) {
    const count=Math.floor((S.gameSpeed-3.5)*2);
    for(let i=0;i<count;i++) S.speedLines.push({ x:W+10, y:Math.random()*H, len:20+Math.random()*40, life:1 });
  }
}

export function burst(x,y,color,count) {
  for (let i=0;i<count;i++) {
    const a=Math.random()*Math.PI*2, sp=Math.random()*4+1;
    S.particles.push({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-2, life:1, decay:0.015+Math.random()*0.02, size:Math.random()*4+2, color });
  }
}

function showCoinPopup(x,y,amount) {
  const el=document.createElement("div");
  el.className="coin-popup"; el.textContent=`+${amount} 🪙`;
  el.style.left=x+"px"; el.style.top=y+"px";
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("fade"));
  setTimeout(()=>el.remove(), 700);
}

export function addCoins(n) {
  const coinMod = hasPerk('coin_bonus', S.equippedSkin) ? 1.25 : (hasPerk('demon_aura', S.equippedSkin) ? 1.15 : 1);
  const amt = Math.ceil(n * coinMod);
  S.coins+=amt; S.sessionCoins+=amt; STORAGE.set("coins",S.coins); updateCoinHud();
}

function checkCollision() {
  const hitboxMod = hasPerk('small_hitbox', S.equippedSkin) ? 0.85 : (hasPerk('demon_aura', S.equippedSkin) ? 0.90 : 1);
  const bx=S.bird.x, by=S.bird.y, br=BIRD_SIZE*0.4*hitboxMod;
  if (by+br>H-GROUND_HEIGHT||by-br<0) return true;
  const PANEL_W=56;
  for (const p of S.pipes) {
    const px=p.x-(PANEL_W-PIPE_WIDTH)/2;
    if (bx+br>px && bx-br<px+PANEL_W)
      if (by-br<p.topH || by+br>p.topH+p.gap) return true;
  }
  return false;
}

export function showStreak(text) { streakPopup.textContent=text; streakPopup.classList.add("show"); S.streakTimer=60; }

export function doRevive() {
  S.reviveUsed=true; S.state=STATE.PLAYING;
  S.bird.vy=-3; S.bird.y=Math.min(S.bird.y, H*0.4); S.isThrusting=false;
  S.shakeMag=0; S.flash=0;
  goOverlay.classList.remove("active"); goPanel.classList.remove("show");
  scoreDisplay.classList.add("visible");
  playSound("revive"); burst(S.bird.x, S.bird.y, "#00ff88", 20);
}

export function showGameOver() {
  S.totalGames++; S.deathsSinceAd++;
  STORAGE.set("games",S.totalGames); STORAGE.set("deaths_ad",S.deathsSinceAd);
  const isNewBest = S.score > S.bestScore;
  if (isNewBest) { S.bestScore=S.score; STORAGE.set("best",S.bestScore); }
  let bonus=0;
  if (S.score>=50) bonus=10; else if(S.score>=30) bonus=5; else if(S.score>=10) bonus=2;
  if (bonus>0) addCoins(bonus);
  scoreDisplay.classList.remove("visible");

  const afterAd = () => {
    goOverlay.classList.add("active");
    document.getElementById("final-score").textContent=S.score;
    const bestEl=document.getElementById("best-score");
    bestEl.textContent=S.bestScore;
    bestEl.className="stat-value"+(isNewBest&&S.score>0?" new-best":"");
    document.getElementById("coins-earned").textContent=`+${S.sessionCoins} 🪙`;
    document.getElementById('go-taunt').textContent=S._getTaunt(S.score);
    let medal="";
    if(S.score>=50)medal="👑"; else if(S.score>=30)medal="💎"; else if(S.score>=20)medal="🏆"; else if(S.score>=10)medal="🥇"; else if(S.score>=5)medal="🥈";
    document.getElementById("medal-display").textContent=medal;
    document.getElementById("btn-revive").style.display="none";
    document.getElementById("btn-revive-ad").style.display="none";
    setTimeout(()=>goPanel.classList.add("show"), 50);
  };

  if (S.deathsSinceAd >= AD_EVERY_N_DEATHS) {
    S.deathsSinceAd=0; STORAGE.set("deaths_ad",0);
    S._showInterstitialAd(afterAd);
  } else afterAd();
}

export function getSkinColors() {
  const s = SKINS.find(sk => sk.id === S.equippedSkin) || SKINS[0];
  if (s.body === "rainbow") {
    const hue = (Date.now() / 10) % 360;
    return { body:`hsl(${hue},100%,60%)`, glow:`hsl(${hue},100%,50%)`, ring:`hsl(${(hue+120)%360},80%,40%)`, thrust:`hsl(${(hue+60)%360},100%,70%)` };
  }
  return { body:s.body, glow:s.glow, ring:s.ring, thrust:s.thrust };
}

export function update() {
  for (const s of S.starParticles) {
    s.flicker+=0.03;
    if(S.state===STATE.PLAYING) s.x-=s.speed*S.gameSpeed*0.3;
    if(s.x<0){ s.x=W; s.y=Math.random()*H; }
  }
  if(S.streakTimer>0){ S.streakTimer--; if(S.streakTimer===0)streakPopup.classList.remove("show"); }

  if (S.state===STATE.MENU) {
    S.bird.x=W*0.22; S.bird.y=H*0.42+Math.sin(Date.now()/400)*12;
    S.bird.angle=Math.sin(Date.now()/500)*0.1; S.bird.wingPhase+=0.15; return;
  }
  if (S.state===STATE.PLAYING) {
    const thrustMod=hasPerk('thrust_boost',S.equippedSkin)?1.15:1;
    const gravMod=hasPerk('gravity_reduce',S.equippedSkin)?0.88:1;
    if(S.isThrusting){S.bird.vy-=THRUST_POWER*thrustMod;if(S.bird.vy<-MAX_VY)S.bird.vy=-MAX_VY;}
    else{S.bird.vy+=DRIFT_GRAV*gravMod;if(S.bird.vy>MAX_VY)S.bird.vy=MAX_VY;}
    S.bird.vy*=0.98; S.bird.y+=S.bird.vy;
    S.bird.angle=Math.max(-0.5,Math.min(S.bird.vy*0.06,1.2));
    S.bird.wingPhase+=S.isThrusting?0.35:0.12;
    S.bird.trail.push({x:S.bird.x,y:S.bird.y,life:1});
    if(S.bird.trail.length>15)S.bird.trail.shift();
    for(const t of S.bird.trail) t.life-=0.07;
    if(S.isThrusting){
      for(let i=0;i<2;i++){const a=Math.PI+Math.random()*0.6-0.3;S.particles.push({x:S.bird.x-BIRD_SIZE*0.5,y:S.bird.y+(Math.random()-0.5)*4,vx:Math.cos(a)*4,vy:Math.sin(a)*2,life:0.6,decay:0.04,size:2+Math.random()*3,color:getSkinColors().thrust});}
      if(Math.random()>0.6) S.particles.push({x:S.bird.x-BIRD_SIZE*0.5,y:S.bird.y+(Math.random()-0.5)*6,vx:-2-Math.random()*3,vy:(Math.random()-0.5)*3,life:0.4,decay:0.05,size:1+Math.random(),color:'#ffffff'});
    }
    if(S.gameSpeed>3.5 && Math.random()>0.85) {
      S.particles.push({x:W+5,y:Math.random()*(H-GROUND_HEIGHT),vx:-S.gameSpeed*3,vy:(Math.random()-0.5)*0.5,life:0.5,decay:0.025,size:1+Math.random(),color:S.currentZone.accent});
    }
    // Power-up collection
    for(let i=S.powerUpOrbs.length-1;i>=0;i--) {
      const pu=S.powerUpOrbs[i];
      pu.x-=S.gameSpeed; pu.wobble+=0.06;
      if(pu.collected || pu.x < -30) { S.powerUpOrbs.splice(i,1); continue; }
      const dx=S.bird.x-pu.x, dy=S.bird.y-pu.y;
      if(dx*dx+dy*dy < 22*22) {
        pu.collected=true; S.powerUpOrbs.splice(i,1);
        const durMod = hasPerk('powerup_extend', S.equippedSkin) ? 1.3 : 1;
        S.activePowerUp=pu.type; S.powerUpTimer=Math.round(pu.type.dur * durMod);
        powerupHud.textContent=`${pu.type.icon} ${pu.type.desc}`;
        powerupHud.style.color=pu.type.color;
        powerupHud.classList.add('visible');
        playSound('powerup'); haptic();
        burst(pu.x,pu.y,pu.type.color,20);
        showStreak(`${pu.type.icon} ${pu.type.desc}!`);
      }
    }
    if(S.activePowerUp) {
      S.powerUpTimer--;
      if(S.powerUpTimer<=0) { S.activePowerUp=null; powerupHud.classList.remove('visible'); }
      if(S.activePowerUp && S.activePowerUp.id==='magnet') {
        for(const c of S.floatingCoins) {
          if(c.collected) continue;
          const dx=S.bird.x-c.x, dy=S.bird.y-c.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          const magnetRange = hasPerk('coin_magnet', S.equippedSkin) ? 168 : 120;
          if(dist < magnetRange) { c.x+=dx/dist*4; c.y+=dy/dist*4; }
        }
      }
      if(S.activePowerUp && S.activePowerUp.id==='slowmo') {
        S.gameSpeed=Math.max(PIPE_SPEED_START*0.5, S.gameSpeed*0.97);
      }
    }
    S.groundX-=S.gameSpeed; if(S.groundX<-40) S.groundX+=40;
    S.pipeTimer-=S.gameSpeed; if(S.pipeTimer<=0){ spawnPipe(); S.pipeTimer=PIPE_SPACING; }

    for(let i=S.floatingCoins.length-1;i>=0;i--) {
      const c=S.floatingCoins[i]; c.x-=S.gameSpeed; c.wobble+=0.05;
      if(c.x < -20) { S.floatingCoins.splice(i,1); continue; }
      if(c.collected) continue;
      const dx=S.bird.x-c.x, dy=S.bird.y-c.y;
      if(dx*dx+dy*dy < 20*20) {
        c.collected=true;
        const amt = (c.bonus ? 3 : 1) * (S.activePowerUp && S.activePowerUp.id==='x2' ? 2 : 1);
        addCoins(amt); playSound("coin"); addCombo();
        showCoinPopup(c.x, c.y-15, amt);
        burst(c.x, c.y, "#ffee00", 8);
        S.floatingCoins.splice(i,1);
      }
    }
    for(let i=S.pipes.length-1;i>=0;i--) {
      const p=S.pipes[i]; p.x-=S.gameSpeed;
      if(p.moving){p.topH+=p.moveDir*p.moveSpeed;if(p.topH<=p.moveMin||p.topH>=p.moveMax)p.moveDir*=-1;}
      if(p.glow>0) p.glow-=0.03;
      const pRight=p.x-(56-PIPE_WIDTH)/2+56;
      if(!p.scored && pRight<S.bird.x) {
        p.scored=true; p.glow=1;
        const pts=Math.max(1,Math.floor(S.comboMultiplier));
        S.score+=pts; scoreDisplay.textContent=S.score;
        playSound("score"); addCombo(); checkZone(); spawnSpeedLines();
        const distTop=Math.abs(S.bird.y-p.topH),distBot=Math.abs(S.bird.y-(p.topH+p.gap));
        const nearDist=Math.min(distTop,distBot);
        if(streakMilestones.includes(S.score)){playSound("milestone");showStreak(`🔥 ${S.score}!`);burst(W/2,H*0.3,"#ffee00",20);haptic();}
        else if(nearDist<25){S.driftCount++;addCoins(Math.ceil(2*S.comboMultiplier));showStreak(`⚡ DRIFT +${pts}×${S.comboMultiplier.toFixed(1)}`);burst(S.bird.x,S.bird.y,"#00ffaa",18);playSound("coin");haptic();S.chromAb=3;triggerBassPulse('drift');}
        else if(pts>1){showStreak(`+${pts} ×${S.comboMultiplier.toFixed(1)}`);}
        const speedMax = hasPerk('speed_cap', S.equippedSkin) ? PIPE_SPEED_MAX * 0.92 : PIPE_SPEED_MAX;
        S.gameSpeed=Math.min(speedMax, PIPE_SPEED_START+S.score*0.025);
        S.pipeGap=Math.max(PIPE_GAP_MIN, PIPE_GAP_START-S.score*0.5);
      }
      if(p.x+56<-10) S.pipes.splice(i,1);
    }
    if(checkCollision()) {
      if(S.activePowerUp && S.activePowerUp.id==='shield') {
        S.activePowerUp=null; S.powerUpTimer=0; powerupHud.classList.remove('visible');
        S.shieldHits++; playSound('shield'); haptic(); S.shakeMag=6; S.flash=0.5;
        burst(S.bird.x,S.bird.y,'#00ffaa',20);
        S.bird.vy=S.bird.vy>0?-3:3;
        showStreak('🛡️ TARCZA!');
      } else if(hasPerk('second_chance', S.equippedSkin) && !S.secondChanceUsed) {
        S.secondChanceUsed=true;
        playSound('shield'); haptic(); S.shakeMag=8; S.flash=0.6;
        burst(S.bird.x,S.bird.y,'#ff2200',25);
        S.bird.vy=S.bird.vy>0?-4:4;
        showStreak('🔥 CERBERUS — DRUGA SZANSA!');
      } else {
        S.state=STATE.DYING; playSound("hit"); haptic(); S.shakeMag=14; S.flash=1;
        S.chromAb=8; S.screenPulse=1; S.deathFreezeFrames=0;
        S.dyingTimer=0;
        S.timeScaleTarget=0.35;
        triggerBassPulse('hit');
        burst(S.bird.x,S.bird.y,"#ff4466",18); burst(S.bird.x,S.bird.y,"#ffee00",10);
        burst(S.bird.x,S.bird.y,"#ffffff",6);
        for(let i=0;i<12;i++){const a=i/12*Math.PI*2;S.particles.push({x:S.bird.x,y:S.bird.y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,life:0.7,decay:0.03,size:3,color:'#ff0066'});}
        for(let i=0;i<6;i++) S.envDebris.push({x:S.bird.x,y:S.bird.y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8-3,rot:0,rotV:(Math.random()-0.5)*0.3,size:3+Math.random()*5,life:0.8,color:Math.random()>0.5?'#ff4466':'#ffee00'});
      }
    }
  }
  decayCombo();
  S.timeScale+=(S.timeScaleTarget-S.timeScale)*0.08;
  if(Math.abs(S.timeScale-S.timeScaleTarget)<0.005) S.timeScale=S.timeScaleTarget;
  S.chromAb*=0.88; S.screenPulse*=0.85;
  for(let i=S.envDebris.length-1;i>=0;i--) {
    const d=S.envDebris[i]; d.x+=d.vx; d.y+=d.vy; d.vy+=0.15; d.rot+=d.rotV; d.life-=0.012;
    if(d.life<=0) S.envDebris.splice(i,1);
  }
  if (S.state===STATE.DYING) {
    if(S.deathFreezeFrames>0){S.deathFreezeFrames--;} else {
    S.isThrusting=false;
    S.bird.vy+=DRIFT_GRAV*3; S.bird.y+=S.bird.vy; S.bird.angle+=0.18;
    S.shakeMag*=0.88; S.shakeX=(Math.random()-0.5)*S.shakeMag; S.shakeY=(Math.random()-0.5)*S.shakeMag;
    S.flash*=0.82;
    S.dyingTimer=(S.dyingTimer||0)+1;
    if(S.dyingTimer>20) S.timeScaleTarget+=(1-S.timeScaleTarget)*0.06;
    if(Math.random()>0.7) S.particles.push({x:S.bird.x+(Math.random()-0.5)*10,y:S.bird.y+(Math.random()-0.5)*10,vx:(Math.random()-0.5)*2,vy:-Math.random()*2,life:0.5,decay:0.04,size:2+Math.random()*3,color:Math.random()>0.5?'#ff4466':'#ff8800'});
    if(S.bird.y>H-GROUND_HEIGHT+20 || S.dyingTimer>45){ S.state=STATE.DEAD; S.timeScaleTarget=1; S.chromAb=0; showGameOver(); }
    }
  }
  for(let i=S.particles.length-1;i>=0;i--) {
    const p=S.particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay;
    if(p.life<=0) S.particles.splice(i,1);
  }
  for(let i=S.speedLines.length-1;i>=0;i--) {
    const sl=S.speedLines[i]; sl.x-=S.gameSpeed*3; sl.life-=0.03;
    if(sl.life<=0||sl.x+sl.len<0) S.speedLines.splice(i,1);
  }
  checkAchievements();
}

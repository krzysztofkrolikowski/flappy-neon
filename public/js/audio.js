// =============================================
//  AUDIO — Web Audio synth engine + dynamic music
// =============================================
import { S } from './state.js';
import { MUSIC_ZONES, ZONES } from './config.js';

let audioCtx;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function getAudioCtx() { return audioCtx; }

export function playSound(type) {
  if (!audioCtx || S.muted) return;
  const t = audioCtx.currentTime;
  const dest = audioCtx.destination;

  function synth(wave, freq, endFreq, dur, vol, filterFreq) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.8);
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0, t + dur);
    if (filterFreq) {
      const f = audioCtx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(filterFreq, t);
      f.Q.setValueAtTime(2, t);
      o.connect(f); f.connect(g);
    } else { o.connect(g); }
    g.connect(dest);
    o.start(t); o.stop(t + dur);
  }

  if (type === "flap") {
    const bufLen = audioCtx.sampleRate * 0.04;
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2);
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.setValueAtTime(1000, t);
    filt.frequency.exponentialRampToValueAtTime(350, t + 0.035); filt.Q.setValueAtTime(1, t);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.035, t); g.gain.linearRampToValueAtTime(0, t + 0.04);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(t); src.stop(t + 0.04);
  } else if (type === "score") {
    synth('square', 220, 140, 0.06, 0.015, 500);
  } else if (type === "hit") {
    const bufLen = audioCtx.sampleRate * 0.2;
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.setValueAtTime(1200, t);
    filt.frequency.exponentialRampToValueAtTime(50, t + 0.18); filt.Q.setValueAtTime(1, t);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.06, t); g.gain.linearRampToValueAtTime(0, t + 0.2);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(t); src.stop(t + 0.2);
    synth('sine', 55, 30, 0.15, 0.03);
  } else if (type === "milestone") {
    [400, 480, 520].forEach((freq, i) => {
      const delay = i * 0.07;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const f = audioCtx.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(freq, t + delay);
      f.type = 'lowpass'; f.frequency.setValueAtTime(900, t + delay); f.Q.setValueAtTime(1, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.022, t + delay + 0.015);
      g.gain.linearRampToValueAtTime(0, t + delay + 0.13);
      o.connect(f); f.connect(g); g.connect(dest);
      o.start(t + delay); o.stop(t + delay + 0.13);
    });
  } else if (type === "coin") {
    synth('triangle', 650, 280, 0.035, 0.02, 900);
  } else if (type === "buy") {
    synth('square', 300, 180, 0.05, 0.018, 450);
    synth('square', 200, 130, 0.06, 0.02, 400);
  } else if (type === "revive") {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const f = audioCtx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.35);
    f.type = 'lowpass'; f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(800, t + 0.3); f.Q.setValueAtTime(4, t);
    g.gain.setValueAtTime(0.02, t); g.gain.linearRampToValueAtTime(0.035, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    o.connect(f); f.connect(g); g.connect(dest);
    o.start(t); o.stop(t + 0.4);
  } else if (type === "powerup") {
    synth('sawtooth', 120, 220, 0.2, 0.025, 400);
  } else if (type === "shield") {
    synth('triangle', 350, 180, 0.08, 0.03, 700);
  }
}

// =============================================
//  DYNAMIC MUSIC — zone-aware + intensity scaling
// =============================================

const MUSIC_VOL_BASE = 0.055;

function getMusicVolGain() {
  return MUSIC_VOL_BASE * (S.musicVolume / 100);
}

function getMusicIntensity() {
  const zi = S.musicCurrentZoneIdx;
  const zoneStart = ZONES[zi].from;
  const zoneEnd = (zi < ZONES.length - 1) ? ZONES[zi + 1].from : zoneStart + 50;
  const progress = Math.min(1, Math.max(0, (S.score - zoneStart) / (zoneEnd - zoneStart)));
  return 0.7 + progress * 0.3;
}

export function startMusic(zoneIdx) {
  if (!audioCtx) return;
  if (S.musicPlaying) stopMusic();
  S.musicPlaying = true;
  S.musicCurrentZoneIdx = zoneIdx || 0;
  const mz = MUSIC_ZONES[S.musicCurrentZoneIdx] || MUSIC_ZONES[0];

  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0, audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(getMusicVolGain(), audioCtx.currentTime + 1.5);
  S.musicMasterGain = master;
  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 10;
  limiter.ratio.value = 6; limiter.attack.value = 0.003; limiter.release.value = 0.15;
  master.connect(limiter); limiter.connect(audioCtx.destination);
  S.musicNodes.push(master, limiter);

  const BPM = mz.bpm, beatLen = 60/BPM, barLen = beatLen*4;
  const loopLen = barLen * 4;
  let nextLoop = audioCtx.currentTime + 0.05;

  const noiseBufLen = audioCtx.sampleRate * 2;
  const _noiseBuf = audioCtx.createBuffer(1, noiseBufLen, audioCtx.sampleRate);
  const _nd = _noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseBufLen; i++) _nd[i] = (Math.random() * 2 - 1);
  const tickBufLen = Math.ceil(audioCtx.sampleRate * 0.015);
  const _tickBuf = audioCtx.createBuffer(1, tickBufLen, audioCtx.sampleRate);
  const _td = _tickBuf.getChannelData(0);
  for (let i = 0; i < tickBufLen; i++) _td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (tickBufLen * 0.2));

  function scheduleLoop() {
    if (!S.musicPlaying) return;
    const intensity = getMusicIntensity();
    const start = nextLoop;

    for (let bar = 0; bar < 4; bar++) {
      const t = start + bar * barLen;
      const chord = mz.chords[bar];

      for (const freq of chord) {
        const o1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        o1.type = mz.padWave; o1.frequency.value = freq;
        o1.connect(g1); g1.connect(master);
        const pv = mz.padVol * intensity;
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(pv, t + barLen * 0.3);
        g1.gain.setValueAtTime(pv, t + barLen * 0.7);
        g1.gain.linearRampToValueAtTime(0, t + barLen + 0.5);
        o1.start(t); o1.stop(t + barLen + 0.6);

        const o2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        const f2 = audioCtx.createBiquadFilter();
        o2.type = 'triangle'; o2.frequency.value = freq * 1.002;
        f2.type = 'lowpass'; f2.frequency.value = mz.filterFreq; f2.Q.value = 0.5;
        o2.connect(f2); f2.connect(g2); g2.connect(master);
        g2.gain.setValueAtTime(0, t + 0.1);
        g2.gain.linearRampToValueAtTime(0.07 * intensity, t + barLen * 0.4);
        g2.gain.linearRampToValueAtTime(0, t + barLen + 0.3);
        o2.start(t); o2.stop(t + barLen + 0.4);

        const o3 = audioCtx.createOscillator();
        const g3 = audioCtx.createGain();
        o3.type = 'sine'; o3.frequency.value = freq * 0.5;
        o3.connect(g3); g3.connect(master);
        g3.gain.setValueAtTime(0, t);
        g3.gain.linearRampToValueAtTime(0.04 * intensity, t + barLen * 0.5);
        g3.gain.linearRampToValueAtTime(0, t + barLen);
        o3.start(t); o3.stop(t + barLen + 0.1);
      }

      const bfreq = mz.bass[bar];
      const bo = audioCtx.createOscillator();
      const bg = audioCtx.createGain();
      bo.type = mz.bassWave; bo.frequency.value = bfreq;
      bo.connect(bg); bg.connect(master);
      const bv = mz.bassVol * intensity;
      bg.gain.setValueAtTime(0, t);
      bg.gain.linearRampToValueAtTime(bv, t + beatLen);
      bg.gain.setValueAtTime(bv, t + barLen - beatLen);
      bg.gain.linearRampToValueAtTime(0, t + barLen);
      bo.start(t); bo.stop(t + barLen + 0.05);

      const b2 = audioCtx.createOscillator();
      const bg2 = audioCtx.createGain();
      const bf = audioCtx.createBiquadFilter();
      b2.type = 'triangle'; b2.frequency.value = bfreq * 2;
      bf.type = 'lowpass'; bf.frequency.value = 200;
      b2.connect(bf); bf.connect(bg2); bg2.connect(master);
      const pt = t + beatLen * 2;
      bg2.gain.setValueAtTime(0.15 * intensity, pt);
      bg2.gain.exponentialRampToValueAtTime(0.01, pt + beatLen * 0.8);
      b2.start(pt); b2.stop(pt + beatLen);

      const notes = mz.arps[bar];
      const hits = [0, 1.3, 2.5, 3.2];
      for (let i = 0; i < hits.length; i++) {
        const nt = t + hits[i] * beatLen;
        const freq = notes[i % notes.length] * 2;
        const po = audioCtx.createOscillator();
        const pg = audioCtx.createGain();
        po.type = mz.arpWave; po.frequency.value = freq;
        po.connect(pg); pg.connect(master);
        pg.gain.setValueAtTime(mz.arpVol * intensity, nt);
        pg.gain.exponentialRampToValueAtTime(0.01, nt + beatLen * 2);
        po.start(nt); po.stop(nt + beatLen * 2.1);

        const so = audioCtx.createOscillator();
        const sg = audioCtx.createGain();
        const sf = audioCtx.createBiquadFilter();
        so.type = 'triangle'; so.frequency.value = freq * 1.005;
        sf.type = 'lowpass'; sf.frequency.value = 2000;
        so.connect(sf); sf.connect(sg); sg.connect(master);
        sg.gain.setValueAtTime(0.06 * intensity, nt + 0.05);
        sg.gain.exponentialRampToValueAtTime(0.01, nt + beatLen * 3);
        so.start(nt + 0.05); so.stop(nt + beatLen * 3.1);

        const eo = audioCtx.createOscillator();
        const eg = audioCtx.createGain();
        eo.type = 'sine'; eo.frequency.value = freq * 0.999;
        eo.connect(eg); eg.connect(master);
        const echo = beatLen * 0.75;
        eg.gain.setValueAtTime(0, nt + echo);
        eg.gain.linearRampToValueAtTime(0.04 * intensity, nt + echo + 0.02);
        eg.gain.exponentialRampToValueAtTime(0.01, nt + echo + beatLen * 1.5);
        eo.start(nt + echo); eo.stop(nt + echo + beatLen * 1.6);
      }

      const ws = audioCtx.createBufferSource();
      const wg = audioCtx.createGain();
      const wf = audioCtx.createBiquadFilter();
      ws.buffer = _noiseBuf; ws.loop = true;
      wf.type = 'bandpass'; wf.Q.value = mz.noiseQ;
      wf.frequency.setValueAtTime(200 + bar * 150, t);
      wf.frequency.linearRampToValueAtTime(600 + bar * 150, t + barLen * 0.5);
      wf.frequency.linearRampToValueAtTime(300 + bar * 50, t + barLen);
      ws.connect(wf); wf.connect(wg); wg.connect(master);
      const tv = mz.texVol * intensity;
      wg.gain.setValueAtTime(0, t);
      wg.gain.linearRampToValueAtTime(tv, t + barLen * 0.3);
      wg.gain.setValueAtTime(tv, t + barLen * 0.7);
      wg.gain.linearRampToValueAtTime(0, t + barLen);
      ws.start(t); ws.stop(t + barLen + 0.01);

      for (let ti = 0; ti < 2; ti++) {
        const tt = t + ti * beatLen * 2 + (Math.random() - 0.5) * beatLen * 0.3;
        const ts = audioCtx.createBufferSource();
        const tg = audioCtx.createGain();
        const thp = audioCtx.createBiquadFilter();
        ts.buffer = _tickBuf;
        thp.type = 'highpass'; thp.frequency.value = 6000 + Math.random() * 4000;
        ts.connect(thp); thp.connect(tg); tg.connect(master);
        tg.gain.setValueAtTime((0.06 + Math.random() * 0.06) * intensity, tt);
        tg.gain.exponentialRampToValueAtTime(0.01, tt + 0.03);
        ts.start(tt); ts.stop(tt + 0.04);
      }
    }

    nextLoop = start + loopLen;
    const ahead = (nextLoop - audioCtx.currentTime) * 1000 - 800;
    S.musicTimer = setTimeout(scheduleLoop, Math.max(ahead, 100));
  }

  scheduleLoop();
  scheduleLoop();
}

export function stopMusic() {
  S.musicPlaying = false;
  clearTimeout(S.musicTimer);
  if (S.musicMasterGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      S.musicMasterGain.gain.cancelScheduledValues(now);
      S.musicMasterGain.gain.setValueAtTime(S.musicMasterGain.gain.value, now);
      S.musicMasterGain.gain.linearRampToValueAtTime(0, now + 0.5);
    } catch(e) {}
  }
  const nodesToDisconnect = [...S.musicNodes];
  setTimeout(() => {
    for (const n of nodesToDisconnect) { try { n.disconnect(); } catch(e) {} }
  }, 600);
  S.musicNodes = [];
  S.musicMasterGain = null;
}

export function updateMusicZone(newZoneIdx) {
  if (!S.musicPlaying || !audioCtx) return;
  if (newZoneIdx === S.musicCurrentZoneIdx) return;
  stopMusic();
  setTimeout(() => {
    if (!S.muted) startMusic(newZoneIdx);
  }, 600);
}

export function setMusicVolume(vol) {
  S.musicVolume = Math.max(0, Math.min(100, vol));
  if (S.musicMasterGain && audioCtx) {
    const now = audioCtx.currentTime;
    S.musicMasterGain.gain.cancelScheduledValues(now);
    S.musicMasterGain.gain.setValueAtTime(S.musicMasterGain.gain.value, now);
    S.musicMasterGain.gain.linearRampToValueAtTime(getMusicVolGain(), now + 0.1);
  }
}

export function suspendAudio() {
  if (audioCtx) audioCtx.suspend();
}

export function resumeAudio() {
  if (audioCtx) audioCtx.resume();
}

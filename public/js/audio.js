// =============================================
//  AUDIO — Web Audio synth engine + ambient music
// =============================================
import { S } from './state.js';
import { MUSIC_VOL, CHORDS, BASS_NOTES, ARP_NOTES } from './config.js';

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
//  SPACE AMBIENT MUSIC
// =============================================

export function startMusic() {
  if (S.musicPlaying || !audioCtx) return;
  S.musicPlaying = true;
  const master = audioCtx.createGain();
  master.gain.value = MUSIC_VOL;
  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 12;
  limiter.ratio.value = 8; limiter.attack.value = 0.002; limiter.release.value = 0.15;
  master.connect(limiter); limiter.connect(audioCtx.destination);
  S.musicNodes.push(master, limiter);

  const BPM = 90, beatLen = 60/BPM, barLen = beatLen*4;
  const loopLen = barLen*4;
  let nextPad = 0, nextBass = 0, nextPing = 0, nextTex = 0;

  function playPad() {
    if (!S.musicPlaying) return;
    const now = audioCtx.currentTime;
    const start = Math.max(now + 0.05, nextPad);
    for (let bar = 0; bar < 4; bar++) {
      const chord = CHORDS[bar];
      const t = start + bar * barLen;
      for (const freq of chord) {
        const osc1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        osc1.type = 'sine'; osc1.frequency.value = freq;
        osc1.connect(g1); g1.connect(master);
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.09, t + barLen * 0.35);
        g1.gain.setValueAtTime(0.09, t + barLen * 0.65);
        g1.gain.linearRampToValueAtTime(0, t + barLen);
        osc1.start(t); osc1.stop(t + barLen + 0.05);
        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        const filt = audioCtx.createBiquadFilter();
        osc2.type = 'triangle'; osc2.frequency.value = freq * 1.002;
        filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 0.5;
        osc2.connect(filt); filt.connect(g2); g2.connect(master);
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.05, t + barLen * 0.4);
        g2.gain.linearRampToValueAtTime(0, t + barLen);
        osc2.start(t); osc2.stop(t + barLen + 0.05);
      }
    }
    nextPad = start + loopLen;
    setTimeout(playPad, (nextPad - audioCtx.currentTime - 0.3) * 1000);
  }

  function playBass() {
    if (!S.musicPlaying) return;
    const now = audioCtx.currentTime;
    const start = Math.max(now + 0.05, nextBass);
    for (let bar = 0; bar < 4; bar++) {
      const freq = BASS_NOTES[bar];
      const t = start + bar * barLen;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.28, t + beatLen * 0.8);
      g.gain.setValueAtTime(0.28, t + barLen - beatLen * 0.8);
      g.gain.linearRampToValueAtTime(0, t + barLen);
      osc.start(t); osc.stop(t + barLen + 0.05);
    }
    nextBass = start + loopLen;
    setTimeout(playBass, (nextBass - audioCtx.currentTime - 0.3) * 1000);
  }

  function playPings() {
    if (!S.musicPlaying) return;
    const now = audioCtx.currentTime;
    const start = Math.max(now + 0.05, nextPing);
    for (let bar = 0; bar < 4; bar++) {
      const notes = ARP_NOTES[bar];
      const t = start + bar * barLen;
      const hits = [0, 1.3, 2.5, 3.2];
      for (let i = 0; i < hits.length; i++) {
        const nt = t + hits[i] * beatLen;
        const freq = notes[i % notes.length] * 2;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        osc.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.10, nt);
        g.gain.linearRampToValueAtTime(0, nt + beatLen * 1.8);
        osc.start(nt); osc.stop(nt + beatLen * 1.9);
        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        osc2.type = 'triangle'; osc2.frequency.value = freq * 1.003;
        osc2.connect(g2); g2.connect(master);
        const echo = beatLen * 0.6;
        g2.gain.setValueAtTime(0, nt + echo);
        g2.gain.linearRampToValueAtTime(0.03, nt + echo + 0.03);
        g2.gain.linearRampToValueAtTime(0, nt + echo + beatLen * 1.2);
        osc2.start(nt + echo); osc2.stop(nt + echo + beatLen * 1.3);
      }
    }
    nextPing = start + loopLen;
    setTimeout(playPings, (nextPing - audioCtx.currentTime - 0.3) * 1000);
  }

  function playTexture() {
    if (!S.musicPlaying) return;
    const now = audioCtx.currentTime;
    const start = Math.max(now + 0.05, nextTex);
    const noiseBufLen = audioCtx.sampleRate * 2;
    const noiseBuf = audioCtx.createBuffer(1, noiseBufLen, audioCtx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseBufLen; i++) nd[i] = (Math.random() * 2 - 1);
    const src = audioCtx.createBufferSource();
    const ng = audioCtx.createGain();
    const bp = audioCtx.createBiquadFilter();
    src.buffer = noiseBuf; src.loop = true;
    bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 6;
    bp.frequency.setValueAtTime(250, start);
    bp.frequency.linearRampToValueAtTime(700, start + loopLen * 0.5);
    bp.frequency.linearRampToValueAtTime(300, start + loopLen);
    src.connect(bp); bp.connect(ng); ng.connect(master);
    ng.gain.setValueAtTime(0, start);
    ng.gain.linearRampToValueAtTime(0.025, start + loopLen * 0.15);
    ng.gain.setValueAtTime(0.025, start + loopLen * 0.85);
    ng.gain.linearRampToValueAtTime(0, start + loopLen);
    src.start(start); src.stop(start + loopLen + 0.05);
    const tickBufLen = audioCtx.sampleRate * 0.012;
    const tickBuf = audioCtx.createBuffer(1, tickBufLen, audioCtx.sampleRate);
    const td = tickBuf.getChannelData(0);
    for (let i = 0; i < tickBufLen; i++) td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (tickBufLen * 0.15));
    for (let i = 0; i < 6; i++) {
      const tt = start + (i * beatLen * 2.5) + Math.random() * beatLen * 0.2;
      if (tt >= start + loopLen) continue;
      const tsrc = audioCtx.createBufferSource();
      const tg = audioCtx.createGain();
      const thp = audioCtx.createBiquadFilter();
      tsrc.buffer = tickBuf;
      thp.type = 'highpass'; thp.frequency.value = 7000 + Math.random() * 3000;
      tsrc.connect(thp); thp.connect(tg); tg.connect(master);
      tg.gain.setValueAtTime(0.04 + Math.random() * 0.03, tt);
      tg.gain.linearRampToValueAtTime(0, tt + 0.025);
      tsrc.start(tt); tsrc.stop(tt + 0.03);
    }
    nextTex = start + loopLen;
    setTimeout(playTexture, (nextTex - audioCtx.currentTime - 0.3) * 1000);
  }

  playPad(); playBass(); playPings(); playTexture();
}

export function stopMusic() {
  S.musicPlaying = false;
  for (const n of S.musicNodes) { try { n.disconnect(); } catch(e) {} }
  S.musicNodes = [];
}

export function suspendAudio() {
  if (audioCtx) audioCtx.suspend();
}

export function resumeAudio() {
  if (audioCtx) audioCtx.resume();
}

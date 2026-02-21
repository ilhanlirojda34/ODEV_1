/**
 * audio.js — Web Audio API motoru
 *
 * Dışa aktarılan API:
 *   ensureAudio()          — AudioContext'i başlat / devam ettir
 *   playTone(fl, fh)       — İki sinüs osilatörü başlat
 *   fadeStop()             — Sesi yumuşakça kapat
 */

import { FS } from './dtmf.js';

let actx     = null;
let gainNode = null;
let osc1     = null;
let osc2     = null;

export function ensureAudio() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: FS });
    gainNode = actx.createGain();
    gainNode.gain.value = 0.001;
    gainNode.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
}

function killOscs() {
  [osc1, osc2].forEach(o => {
    if (o) { try { o.stop(); o.disconnect(); } catch (_) {} }
  });
  osc1 = osc2 = null;
}

export function playTone(fl, fh) {
  ensureAudio();
  killOscs();

  const t = actx.currentTime;
  gainNode.gain.cancelScheduledValues(t);
  gainNode.gain.setValueAtTime(0.001, t);
  gainNode.gain.exponentialRampToValueAtTime(0.4, t + 0.012);

  osc1 = actx.createOscillator();
  osc2 = actx.createOscillator();
  osc1.type = osc2.type = 'sine';
  osc1.frequency.value = fl;
  osc2.frequency.value = fh;
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  osc1.start();
  osc2.start();
}

export function fadeStop() {
  if (!actx || !gainNode) return;

  const t = actx.currentTime;
  gainNode.gain.cancelScheduledValues(t);
  gainNode.gain.setValueAtTime(gainNode.gain.value, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

  const o1 = osc1, o2 = osc2;
  osc1 = osc2 = null;

  setTimeout(() => {
    [o1, o2].forEach(o => { if (o) { try { o.stop(); o.disconnect(); } catch (_) {} } });
  }, 60);
}

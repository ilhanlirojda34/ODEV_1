// ── Ses Motoru ────────────────────────────────────────────────────────────────
export const FS = 44100;
export const MIN_MS = 150;

let actx = null, gainNode = null;
let osc1 = null, osc2 = null;

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
  [osc1, osc2].forEach(o => { if (o) { try { o.stop(); o.disconnect(); } catch(e){} } });
  osc1 = osc2 = null;
}

export function playTone(fl, fh) {
  ensureAudio();
  killOscs();
  gainNode.gain.cancelScheduledValues(actx.currentTime);
  gainNode.gain.setValueAtTime(0.001, actx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.4, actx.currentTime + 0.012);

  osc1 = actx.createOscillator(); osc1.type = 'sine';
  osc2 = actx.createOscillator(); osc2.type = 'sine';
  osc1.frequency.value = fl;
  osc2.frequency.value = fh;
  osc1.connect(gainNode); osc2.connect(gainNode);
  osc1.start(); osc2.start();
}

export function fadeStop() {
  if (!actx || !gainNode) return;
  const t = actx.currentTime;
  gainNode.gain.cancelScheduledValues(t);
  gainNode.gain.setValueAtTime(gainNode.gain.value, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  const o1 = osc1, o2 = osc2; osc1 = osc2 = null;
  setTimeout(() => {
    if (o1) { try { o1.stop(); o1.disconnect(); } catch(e){} }
    if (o2) { try { o2.stop(); o2.disconnect(); } catch(e){} }
  }, 60);
}

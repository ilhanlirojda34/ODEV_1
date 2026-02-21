/**
 * sequence.js — Sekans çalma motoru
 */

import { DTMF }              from './dtmf.js';
import { ensureAudio, playTone, fadeStop } from './audio.js';
import { updateUI, setStatusBadge, clearPressedKeys } from './ui.js';
import { drawCharts }         from './charts.js';

const TONE_MS = 200;
const GAP_MS  = 80;

let seqRunning = false;
let seqCancel  = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function playSequence() {
  if (seqRunning) return;

  const raw = document.getElementById('seqInput')
    .value.toUpperCase().replace(/[^0-9A-D*#]/g, '');
  if (!raw) return;

  ensureAudio();
  seqRunning = true;
  seqCancel  = false;
  _setControls(true);

  for (let i = 0; i < raw.length; i++) {
    if (seqCancel) break;

    const k       = raw[i];
    const [fl, fh] = DTMF[k];

    playTone(fl, fh);
    updateUI(k, fl, fh, true);
    drawCharts(fl, fh);
    _setProgress((i / raw.length) * 100);

    await sleep(TONE_MS);
    fadeStop();
    setStatusBadge('BEKLEME');
    clearPressedKeys();

    if (i < raw.length - 1) await sleep(GAP_MS);
  }

  _setProgress(100);
  setTimeout(() => _setProgress(null), 400);

  seqRunning = false;
  _setControls(false);
}

export function stopSequence() {
  seqCancel  = true;
  seqRunning = false;
  fadeStop();
  _setControls(false);
  _setProgress(null);
  setStatusBadge('BEKLEME');
  clearPressedKeys();
}

// ── Özel yardımcılar ─────────────────────────────────────────────────────────

function _setControls(playing) {
  document.getElementById('seqPlayBtn').disabled = playing;
  document.getElementById('seqStopBtn').disabled = !playing;
}

function _setProgress(pct) {
  const wrap = document.getElementById('seqProgress');
  const bar  = document.getElementById('seqProgressBar');
  if (pct === null) {
    wrap.classList.remove('visible');
    bar.style.width = '0%';
  } else {
    wrap.classList.add('visible');
    bar.style.width = pct + '%';
  }
}

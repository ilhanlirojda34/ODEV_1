// ── Sekans Çalar ──────────────────────────────────────────────────────────────
import { DTMF } from './dtmf.js';
import { ensureAudio, playTone, fadeStop } from './audio.js';
import { updateUI, setStatusBadge } from './ui.js';
import { drawCharts } from './charts.js';

let seqRunning = false;
let seqCancel  = false;

export async function playSequence() {
  if (seqRunning) return;
  const raw = document.getElementById('seqInput').value.toUpperCase().replace(/[^0-9A-D*#]/g, '');
  if (!raw) return;

  ensureAudio();
  seqRunning = true;
  seqCancel  = false;
  document.getElementById('seqPlayBtn').disabled = true;
  document.getElementById('seqStopBtn').disabled = false;
  document.getElementById('seqProgress').classList.add('visible');

  const TONE_MS = 200, GAP_MS = 80;

  for (let i = 0; i < raw.length; i++) {
    if (seqCancel) break;
    const k = raw[i];
    const [fl, fh] = DTMF[k];

    playTone(fl, fh);
    updateUI(k, fl, fh, true);
    drawCharts(fl, fh);
    document.getElementById('seqProgressBar').style.width = ((i / raw.length) * 100) + '%';

    await sleep(TONE_MS);
    fadeStop();
    setStatusBadge('BEKLEME');
    document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));

    if (i < raw.length - 1) await sleep(GAP_MS);
  }

  document.getElementById('seqProgressBar').style.width = '100%';
  setTimeout(() => {
    document.getElementById('seqProgress').classList.remove('visible');
    document.getElementById('seqProgressBar').style.width = '0%';
  }, 400);

  seqRunning = false;
  document.getElementById('seqPlayBtn').disabled = false;
  document.getElementById('seqStopBtn').disabled = true;
}

export function stopSequence() {
  seqCancel = true;
  fadeStop();
  seqRunning = false;
  document.getElementById('seqPlayBtn').disabled = false;
  document.getElementById('seqStopBtn').disabled = true;
  document.getElementById('seqProgress').classList.remove('visible');
  setStatusBadge('BEKLEME');
  document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

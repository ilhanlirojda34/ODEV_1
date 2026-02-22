// ── Tuş Takımı ────────────────────────────────────────────────────────────────
import { DTMF, LAYOUT, SPECIAL } from './dtmf.js';
import { playTone, fadeStop, MIN_MS } from './audio.js';
import { updateUI, setStatusBadge } from './ui.js';
import { drawCharts } from './charts.js';

let currentKey = null, isHolding = false, toneStart = 0;

export function buildKeypad(containerId) {
  const keypad = document.getElementById(containerId);
  LAYOUT.forEach(k => {
    const btn = document.createElement('div');
    btn.className = 'key' + (SPECIAL.has(k) ? ' special' : '');
    btn.dataset.key = k;
    const [fl, fh] = DTMF[k];
    btn.innerHTML = `${k}<span class="sub">${fl}+${fh}</span>`;
    keypad.appendChild(btn);
  });
}

function startKey(k) {
  if (isHolding && currentKey === k) return;
  isHolding = true;
  currentKey = k;
  toneStart = Date.now();
  const [fl, fh] = DTMF[k];
  playTone(fl, fh);
  updateUI(k, fl, fh, true);
  drawCharts(fl, fh);
}

function releaseKey() {
  if (!isHolding) return;
  isHolding = false;
  const elapsed = Date.now() - toneStart;
  const wait = Math.max(0, MIN_MS - elapsed);
  setTimeout(() => {
    if (!isHolding) {
      fadeStop();
      setStatusBadge('BEKLEME');
      document.getElementById('dispStatus').textContent = '—';
      document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));
    }
  }, wait);
}

export function bindEvents(containerId) {
  const keypad = document.getElementById(containerId);

  keypad.addEventListener('mousedown', e => {
    e.preventDefault();
    const btn = e.target.closest('.key');
    if (btn) startKey(btn.dataset.key);
  });

  keypad.addEventListener('touchstart', e => {
    e.preventDefault();
    const btn = e.target.closest('.key');
    if (btn) startKey(btn.dataset.key);
  }, { passive: false });

  document.addEventListener('mouseup', releaseKey);
  document.addEventListener('touchend', releaseKey);
  document.addEventListener('touchcancel', releaseKey);

  document.addEventListener('keydown', e => {
    if (e.repeat || e.target === document.getElementById('seqInput')) return;
    const k = e.key === '*' ? '*' : e.key === '#' ? '#' : e.key.toUpperCase();
    if (DTMF[k]) { e.preventDefault(); startKey(k); }
  });

  document.addEventListener('keyup', e => {
    if (e.target === document.getElementById('seqInput')) return;
    releaseKey();
  });
}

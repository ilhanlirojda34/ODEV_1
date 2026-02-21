/**
 * keypad.js — Tuş takımı DOM oluşturma & giriş olayları
 */

import { DTMF, LAYOUT, SPECIAL, MIN_MS } from './dtmf.js';
import { playTone, fadeStop }            from './audio.js';
import { updateUI, setStatusBadge, clearPressedKeys } from './ui.js';
import { drawCharts }                    from './charts.js';

let currentKey  = null;
let isHolding   = false;
let toneStart   = 0;

// ── Tuş takımı oluştur ───────────────────────────────────────────────────────

export function buildKeypad(containerId) {
  const container = document.getElementById(containerId);
  LAYOUT.forEach(k => {
    const btn = document.createElement('div');
    btn.className      = 'key' + (SPECIAL.has(k) ? ' special' : '');
    btn.dataset.key    = k;
    const [fl, fh]     = DTMF[k];
    btn.innerHTML      = `${k}<span class="sub">${fl}+${fh}</span>`;
    container.appendChild(btn);
  });
}

// ── Ton yönetimi ─────────────────────────────────────────────────────────────

export function startKey(k) {
  if (isHolding && currentKey === k) return;
  isHolding  = true;
  currentKey = k;
  toneStart  = Date.now();

  const [fl, fh] = DTMF[k];
  playTone(fl, fh);
  updateUI(k, fl, fh, true);
  drawCharts(fl, fh);
}

export function releaseKey() {
  if (!isHolding) return;
  isHolding = false;
  const elapsed = Date.now() - toneStart;
  const wait    = Math.max(0, MIN_MS - elapsed);

  setTimeout(() => {
    if (!isHolding) {
      fadeStop();
      setStatusBadge('BEKLEME');
      document.getElementById('dispStatus').textContent = '—';
      clearPressedKeys();
    }
  }, wait);
}

// ── Olay bağlama ─────────────────────────────────────────────────────────────

export function bindEvents(keypadId) {
  const keypad = document.getElementById(keypadId);

  // Fare
  keypad.addEventListener('mousedown', e => {
    e.preventDefault();
    const btn = e.target.closest('.key');
    if (btn) startKey(btn.dataset.key);
  });

  // Dokunma
  keypad.addEventListener('touchstart', e => {
    e.preventDefault();
    const btn = e.target.closest('.key');
    if (btn) startKey(btn.dataset.key);
  }, { passive: false });

  document.addEventListener('mouseup',     releaseKey);
  document.addEventListener('touchend',    releaseKey);
  document.addEventListener('touchcancel', releaseKey);

  // Klavye
  document.addEventListener('keydown', e => {
    const seqInput = document.getElementById('seqInput');
    if (e.repeat || e.target === seqInput) return;
    const k = e.key === '*' ? '*' : e.key === '#' ? '#' : e.key.toUpperCase();
    if (DTMF[k]) { e.preventDefault(); startKey(k); }
  });

  document.addEventListener('keyup', e => {
    if (e.target === document.getElementById('seqInput')) return;
    releaseKey();
  });
}

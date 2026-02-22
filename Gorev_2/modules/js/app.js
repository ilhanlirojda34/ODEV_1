/**
 * app.js — Uygulama giriş noktası
 *
 * Tüm modülleri import eder, bileşenleri başlatır ve
 * global olarak erişilmesi gereken fonksiyonları window'a bağlar.
 */
import { DTMF }                          from './dtmf.js';
import { buildKeypad, bindEvents }        from './keypad.js';
import { playSequence, stopSequence }     from './sequence.js';
import { initCanvases, drawCharts }       from './charts.js';

// ── Başlangıç ────────────────────────────────────────────────────────────────
buildKeypad('keypad');
bindEvents('keypad');
initCanvases();

// ── Pencere yeniden boyutlandırma ────────────────────────────────────────────
let lastKey = null;

// keypad.js'deki startKey, currentKey'i dışa aktarmıyor; son seçilen tuşu
// burada basit bir proxy ile izliyoruz.
document.getElementById('keypad').addEventListener('mousedown', e => {
  const btn = e.target.closest('.key');
  if (btn) lastKey = btn.dataset.key;
});

window.addEventListener('resize', () => {
  if (lastKey) {
    const [fl, fh] = DTMF[lastKey];
    drawCharts(fl, fh);
  }
});

// ── Sekans butonları için global bağlama ─────────────────────────────────────
// HTML onclick niteliklerini koruyabilmek için window'a atıyoruz.
window.playSequence = playSequence;
window.stopSequence = stopSequence;

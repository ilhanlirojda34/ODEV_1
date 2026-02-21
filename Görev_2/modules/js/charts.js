/**
 * charts.js — Zaman uzayı & FFT spektrum grafikleri
 */

import { FS, FFT_SIZE } from './dtmf.js';

const waveCanvas = document.getElementById('waveCanvas');
const specCanvas = document.getElementById('specCanvas');
const wCtx = waveCanvas.getContext('2d');
const sCtx = specCanvas.getContext('2d');

// ── Yardımcılar ──────────────────────────────────────────────────────────────

function resizeCanvas(c) {
  const dpr  = devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width    = rect.width  * dpr;
  c.height   = rect.height * dpr;
}

function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr  = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i+j],            ui = im[i+j];
        const vr = re[i+j+len/2]*cr - im[i+j+len/2]*ci;
        const vi = re[i+j+len/2]*ci + im[i+j+len/2]*cr;
        re[i+j]       = ur + vr;  im[i+j]       = ui + vi;
        re[i+j+len/2] = ur - vr;  im[i+j+len/2] = ui - vi;
        [cr, ci] = [cr*wr - ci*wi, cr*wi + ci*wr];
      }
    }
  }
}

function computeFFT(fl, fh) {
  const N  = FFT_SIZE;
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / FS;
    const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / N));   // Hann penceresi
    re[i] = w * 0.5 * (Math.sin(2 * Math.PI * fl * t) + Math.sin(2 * Math.PI * fh * t));
  }
  fftInPlace(re, im);
  const mag = new Float32Array(N / 2);
  for (let i = 0; i < N / 2; i++) mag[i] = Math.sqrt(re[i] ** 2 + im[i] ** 2) / N;
  return mag;
}

// ── Çiziciler ────────────────────────────────────────────────────────────────

function drawWave(fl, fh) {
  const ctx = wCtx;
  const W = waveCanvas.width, H = waveCanvas.height;
  const dpr = devicePixelRatio || 1;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Yatay ızgara
  ctx.strokeStyle = '#f0f2f5';
  ctx.lineWidth   = 1;
  for (let i = 1; i < 4; i++) {
    const y = (H / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Merkez çizgisi
  ctx.strokeStyle = '#d1d8e0';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  // Y ekseni etiketleri
  ctx.font      = `${10 * dpr}px DM Mono, monospace`;
  ctx.fillStyle = '#aab0ba';
  ctx.textAlign = 'right';
  ctx.fillText('+1', W - 6 * dpr, 10 * dpr);
  ctx.fillText('0',  W - 6 * dpr, H / 2 + 4 * dpr);
  ctx.fillText('-1', W - 6 * dpr, H - 4 * dpr);
  ctx.textAlign = 'left';

  const T = 3 / fl;  // 3 periyot göster
  const N = W;

  // f_low bileşeni
  ctx.beginPath();
  ctx.strokeStyle = '#93b4f4';
  ctx.lineWidth   = 1.5 * dpr;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * T;
    const y = H / 2 - (H * 0.3) * Math.sin(2 * Math.PI * fl * t);
    i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
  }
  ctx.stroke();

  // f_high bileşeni
  ctx.beginPath();
  ctx.strokeStyle = '#f4a090';
  ctx.lineWidth   = 1.5 * dpr;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * T;
    const y = H / 2 - (H * 0.3) * Math.sin(2 * Math.PI * fh * t);
    i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
  }
  ctx.stroke();

  // DTMF toplamı
  ctx.beginPath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth   = 2.5 * dpr;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * T;
    const s = 0.5 * (Math.sin(2 * Math.PI * fl * t) + Math.sin(2 * Math.PI * fh * t));
    const y = H / 2 - (H * 0.38) * s;
    i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
  }
  ctx.stroke();

  // Zaman etiketleri
  ctx.font      = `${9.5 * dpr}px DM Mono, monospace`;
  ctx.fillStyle = '#8a929e';
  ctx.textAlign = 'left';
  ctx.fillText(`0 ms`, 6 * dpr, H - 6 * dpr);
  ctx.textAlign = 'right';
  ctx.fillText(`${(T * 1000).toFixed(2)} ms`, W - 20 * dpr, H - 6 * dpr);
  ctx.textAlign = 'center';
  ctx.font      = `bold ${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('ZAMAN (ms)', W / 2, H - 6 * dpr);
}

function drawSpectrum(fl, fh) {
  const ctx = sCtx;
  const W = specCanvas.width, H = specCanvas.height;
  const dpr = devicePixelRatio || 1;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const mag     = computeFFT(fl, fh);
  const maxFreq = 2000;
  const maxBin  = Math.floor(maxFreq * FFT_SIZE / FS);
  const PLOT_H  = H - 30 * dpr;
  const binPx   = W / maxBin;

  // Normalize
  let maxMag = 0;
  for (let i = 1; i < maxBin; i++) if (mag[i] > maxMag) maxMag = mag[i];
  if (maxMag < 1e-10) maxMag = 1;

  // Yatay ızgara
  ctx.strokeStyle = '#f0f2f5';
  ctx.lineWidth   = 1;
  for (let db = 0.25; db < 1; db += 0.25) {
    const y = PLOT_H * (1 - db);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Barlar (yalnızca anlamlı bileşenler)
  ctx.fillStyle = '#2563eb';
  for (let i = 1; i < maxBin; i++) {
    const norm = mag[i] / maxMag;
    if (norm < 0.05) continue;
    const barH = norm * PLOT_H;
    const x    = (i / maxBin) * W;
    ctx.fillRect(x, PLOT_H - barH, Math.max(binPx - 0.5, 1), barH);
  }

  // X ekseni
  ctx.strokeStyle = '#d1d8e0';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(0, PLOT_H); ctx.lineTo(W, PLOT_H); ctx.stroke();

  // X ekseni etiketleri
  ctx.font      = `${9.5 * dpr}px DM Mono, monospace`;
  for (let f = 0; f <= maxFreq; f += 200) {
    const x = (f / maxFreq) * W;
    ctx.strokeStyle = '#e8eaed';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PLOT_H); ctx.stroke();
    ctx.fillStyle   = '#8a929e';
    ctx.textAlign   = f === 0 ? 'left' : f === maxFreq ? 'right' : 'center';
    const xLabel    = f === 0 ? x + 4 * dpr : f === maxFreq ? x - 4 * dpr : x;
    ctx.fillText(f, xLabel, PLOT_H + 14 * dpr);
  }

  // Eksen başlığı
  ctx.textAlign = 'center';
  ctx.font      = `bold ${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('FREKANS (Hz)', W / 2, H - 4 * dpr);

  // Tepe noktası rozetleri
  [[fl, 'f₁'], [fh, 'f₂']].forEach(([f, lbl]) => {
    const x    = (f / maxFreq) * W;
    const norm = Math.max(...Array.from({ length: 5 }, (_, j) => {
      const b = Math.round((f - 2 + j) * FFT_SIZE / FS);
      return (b >= 0 && b < mag.length) ? mag[b] / maxMag : 0;
    }));
    const barTop = PLOT_H - norm * PLOT_H;

    ctx.setLineDash([3 * dpr, 3 * dpr]);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth   = 1.5 * dpr;
    ctx.beginPath(); ctx.moveTo(x, barTop - 6 * dpr); ctx.lineTo(x, 4 * dpr); ctx.stroke();
    ctx.setLineDash([]);

    const txt = `${lbl} ${f} Hz`;
    ctx.font  = `${9 * dpr}px DM Mono, monospace`;
    const tw  = ctx.measureText(txt).width;
    const bw  = tw + 10 * dpr, bh = 14 * dpr;
    let   bx  = Math.max(2, Math.min(W - bw - 2, x - bw / 2));
    const by  = 2 * dpr;

    ctx.fillStyle   = '#eff4ff';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4 * dpr);
    ctx.fill();
    ctx.strokeStyle = '#bfd0f7';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.textAlign = 'center';
    ctx.fillText(txt, bx + bw / 2, by + 10 * dpr);
  });
}

// ── Genel amaçlı ─────────────────────────────────────────────────────────────

export function drawCharts(fl, fh) {
  resizeCanvas(waveCanvas);
  resizeCanvas(specCanvas);
  drawWave(fl, fh);
  drawSpectrum(fl, fh);
}

export function initCanvases() {
  resizeCanvas(waveCanvas);
  resizeCanvas(specCanvas);
}

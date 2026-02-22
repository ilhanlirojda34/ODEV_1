// ── Grafikler ─────────────────────────────────────────────────────────────────
import { FS } from './audio.js';
import { DTMF } from './dtmf.js';

const FFT_SIZE = 16384;

let waveCanvas, specCanvas, wCtx, sCtx;

export function initCanvases() {
  waveCanvas = document.getElementById('waveCanvas');
  specCanvas = document.getElementById('specCanvas');
  wCtx = waveCanvas.getContext('2d');
  sCtx = specCanvas.getContext('2d');

  setTimeout(() => {
    resizeCanvas(waveCanvas);
    resizeCanvas(specCanvas);
  }, 50);

  initTooltips();
}

function resizeCanvas(c) {
  const dpr = devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width  = rect.width  * dpr;
  c.height = rect.height * dpr;
}

export function drawCharts(fl, fh) {
  resizeCanvas(waveCanvas);
  resizeCanvas(specCanvas);
  drawWave(fl, fh);
  drawSpectrum(fl, fh);
}

// ── Zaman Uzayı ───────────────────────────────────────────────────────────────
let waveData = null;

function drawWave(fl, fh) {
  const ctx = wCtx;
  const dpr = devicePixelRatio || 1;
  resizeCanvas(waveCanvas);
  const W = waveCanvas.width, H = waveCanvas.height;

  const MARGIN_L = 36 * dpr;
  const MARGIN_B = 22 * dpr;
  const MARGIN_R = 28 * dpr;
  const PW = W - MARGIN_L - MARGIN_R;
  const PH = H - MARGIN_B;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const T = 3 / fl;
  waveData = { fl, fh, T, W, H, MARGIN_L, MARGIN_B, PW, PH, dpr };

  const yTicks = [1, 0.5, 0, -0.5, -1];
  ctx.font = `${9.5 * dpr}px DM Mono, monospace`;
  ctx.textAlign = 'right';
  yTicks.forEach(v => {
    const y = MARGIN_B/2 + PH/2 - v * PH * 0.42;
    ctx.strokeStyle = v === 0 ? '#c8d0da' : '#f0f2f5';
    ctx.lineWidth = v === 0 ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(MARGIN_L, y); ctx.lineTo(W - MARGIN_R, y); ctx.stroke();
    ctx.fillStyle = '#9aa0aa';
    ctx.fillText(v.toFixed(1), MARGIN_L - 4 * dpr, y + 3.5 * dpr);
  });

  ctx.save();
  ctx.translate(9 * dpr, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa0aa';
  ctx.font = `${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('Genlik (normalize)', 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa0aa';
  ctx.font = `${9.5 * dpr}px DM Mono, monospace`;
  const tSteps = 4;
  for (let i = 0; i <= tSteps; i++) {
    const tVal = (i / tSteps) * T;
    const x = MARGIN_L + (i / tSteps) * PW;
    ctx.strokeStyle = '#f0f2f5';
    ctx.lineWidth = 1;
    if (i > 0 && i < tSteps) {
      ctx.beginPath(); ctx.moveTo(x, MARGIN_B/2); ctx.lineTo(x, MARGIN_B/2 + PH); ctx.stroke();
    }
    ctx.fillText((tVal * 1000).toFixed(2) + ' ms', x, H - 4 * dpr);
  }
  ctx.fillStyle = '#9aa0aa';
  ctx.font = `${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('Zaman (ms)', MARGIN_L + PW / 2, H - 4*dpr + 11*dpr);

  const N = Math.round(PW);

  function plotLine(color, lw, ampScale, fn) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * dpr;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * T;
      const v = fn(t);
      const x = MARGIN_L + i;
      const y = MARGIN_B/2 + PH/2 - v * PH * ampScale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  plotLine('#bcd0f8', 1.5, 0.3, t => Math.sin(2*Math.PI*fl*t));
  plotLine('#f8b8a8', 1.5, 0.3, t => Math.sin(2*Math.PI*fh*t));
  plotLine('#2563eb', 2.5, 0.4, t => 0.5*(Math.sin(2*Math.PI*fl*t)+Math.sin(2*Math.PI*fh*t)));

  ctx.setLineDash([3*dpr, 3*dpr]);
  ctx.strokeStyle = '#bcd0f8';
  ctx.lineWidth = 1 * dpr;
  const period = 1/fl;
  for (let p = 1; p <= 3; p++) {
    const x = MARGIN_L + (p * period / T) * PW;
    if (x < W - MARGIN_R) {
      ctx.beginPath(); ctx.moveTo(x, MARGIN_B/2); ctx.lineTo(x, MARGIN_B/2 + PH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#93b4f4';
      ctx.font = `${8.5*dpr}px DM Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`T=${(period*1000).toFixed(2)}ms`, x, MARGIN_B/2 + 10*dpr);
      ctx.setLineDash([3*dpr, 3*dpr]);
    }
  }
  ctx.setLineDash([]);
}

// ── FFT ───────────────────────────────────────────────────────────────────────
function computeFFT(fl, fh) {
  const N = FFT_SIZE;
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / FS;
    const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / N));
    re[i] = w * 0.5 * (Math.sin(2 * Math.PI * fl * t) + Math.sin(2 * Math.PI * fh * t));
  }
  fftInPlace(re, im);
  const mag = new Float32Array(N / 2);
  for (let i = 0; i < N / 2; i++) mag[i] = Math.sqrt(re[i] ** 2 + im[i] ** 2) / N;
  return mag;
}

function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i+j], ui = im[i+j];
        const vr = re[i+j+len/2]*cr - im[i+j+len/2]*ci;
        const vi = re[i+j+len/2]*ci + im[i+j+len/2]*cr;
        re[i+j] = ur+vr; im[i+j] = ui+vi;
        re[i+j+len/2] = ur-vr; im[i+j+len/2] = ui-vi;
        [cr, ci] = [cr*wr - ci*wi, cr*wi + ci*wr];
      }
    }
  }
}

// ── Frekans Uzayı ─────────────────────────────────────────────────────────────
let specData = null;

function drawSpectrum(fl, fh) {
  const ctx = sCtx;
  const dpr = devicePixelRatio || 1;
  resizeCanvas(specCanvas);
  const W = specCanvas.width, H = specCanvas.height;

  const MARGIN_L = 42 * dpr;
  const MARGIN_B = 28 * dpr;
  const MARGIN_R = 24 * dpr;
  const PW = W - MARGIN_L - MARGIN_R;
  const PH = H - MARGIN_B - 6*dpr;
  const TOP = 6 * dpr;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const mag = computeFFT(fl, fh);
  const maxFreq = 2000;
  const maxBin = Math.floor(maxFreq * FFT_SIZE / FS);

  let maxMag = 0;
  for (let i = 1; i < maxBin; i++) if (mag[i] > maxMag) maxMag = mag[i];
  if (maxMag < 1e-10) maxMag = 1;

  specData = { fl, fh, mag, maxMag, maxFreq, maxBin, W, H, MARGIN_L, MARGIN_B, PW, PH, TOP, dpr };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  ctx.font = `${9.5 * dpr}px DM Mono, monospace`;
  ctx.textAlign = 'right';
  yTicks.forEach(v => {
    const y = TOP + PH * (1 - v);
    ctx.strokeStyle = v === 0 ? '#c8d0da' : '#f0f2f5';
    ctx.lineWidth = v === 0 ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(MARGIN_L, y); ctx.lineTo(MARGIN_L + PW, y); ctx.stroke();
    const label = v === 1 ? 'max' : v === 0 ? '0' : v.toFixed(2);
    ctx.fillStyle = '#9aa0aa';
    ctx.fillText(label, MARGIN_L - 4 * dpr, y + 3.5 * dpr);
  });

  ctx.save();
  ctx.translate(9 * dpr, TOP + PH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa0aa';
  ctx.font = `${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('Genlik (norm.)', 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = `${9.5 * dpr}px DM Mono, monospace`;
  for (let f = 0; f <= maxFreq; f += 200) {
    const x = MARGIN_L + (f / maxFreq) * PW;
    ctx.strokeStyle = f % 400 === 0 ? '#e8eaed' : '#f5f5f5';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, TOP + PH); ctx.stroke();
    ctx.fillStyle = '#9aa0aa';
    ctx.fillText(f === 0 ? '0' : f, x, TOP + PH + 14 * dpr);
  }

  ctx.fillStyle = '#9aa0aa';
  ctx.font = `${9 * dpr}px DM Sans, sans-serif`;
  ctx.fillText('Frekans (Hz)', MARGIN_L + PW / 2, H - 2 * dpr);

  // Sadece DTMF bileşenleri — gürültü zemini yok
  const HZ_PER_BUCKET = 2;
  const numBuckets = Math.floor(maxFreq / HZ_PER_BUCKET);
  const bucketW = PW / numBuckets;

  for (let b = 0; b < numBuckets; b++) {
    const fLo = b * HZ_PER_BUCKET;
    const fHi = fLo + HZ_PER_BUCKET;
    const binLo = Math.floor(fLo * FFT_SIZE / FS);
    const binHi = Math.ceil(fHi * FFT_SIZE / FS);

    let peak = 0;
    for (let i = binLo; i <= Math.min(binHi, maxBin-1); i++) {
      if (mag[i] > peak) peak = mag[i];
    }
    const norm = peak / maxMag;
    if (norm < 0.003) continue;

    const freqMid = fLo + HZ_PER_BUCKET / 2;
    const nearLow  = Math.abs(freqMid - fl) < 25;
    const nearHigh = Math.abs(freqMid - fh) < 25;
    if (!nearLow && !nearHigh) continue;

    const barH = norm * PH;
    const x = MARGIN_L + b * bucketW;
    ctx.fillStyle = nearLow ? '#3b82f6' : '#ef4444';
    ctx.fillRect(x, TOP + PH - barH, Math.max(bucketW - 0.5, 1), barH);
  }

  [[fl, 'f₁ (low)', '#3b82f6'], [fh, 'f₂ (high)', '#ef4444']].forEach(([f, lbl, col]) => {
    const x = MARGIN_L + (f / maxFreq) * PW;
    const peakNorm = Math.max(...Array.from({length:7}, (_, j) => {
      const b = Math.round((f - 3 + j) * FFT_SIZE / FS);
      return b >= 0 && b < mag.length ? mag[b] / maxMag : 0;
    }));
    const barTop = TOP + PH * (1 - peakNorm);

    ctx.setLineDash([3*dpr, 3*dpr]);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.moveTo(x, barTop - 4*dpr); ctx.lineTo(x, TOP + 2*dpr); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `${9*dpr}px DM Mono, monospace`;
    const txt = `${lbl}: ${f} Hz`;
    const tw = ctx.measureText(txt).width + 10*dpr;
    const th = 15*dpr;
    let lx = x - tw/2;
    lx = Math.max(MARGIN_L+1, Math.min(MARGIN_L+PW-tw-1, lx));
    const ly = TOP + 2*dpr;
    ctx.fillStyle = col + '18';
    ctx.beginPath(); ctx.roundRect(lx, ly, tw, th, 4*dpr); ctx.fill();
    ctx.strokeStyle = col + '55';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.fillText(txt, lx + tw/2, ly + 10.5*dpr);
  });

  ctx.textAlign = 'left';
}

// ── Hover Tooltip'leri ────────────────────────────────────────────────────────
function initTooltips() {
  const tooltip = document.getElementById('tooltip');

  function showTooltip(e, html) {
    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
    moveTooltip(e);
  }
  function moveTooltip(e) {
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY - 10;
    if (x + tw > window.innerWidth  - 10) x = e.clientX - tw - 14;
    if (y + th > window.innerHeight - 10) y = e.clientY - th - 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }
  function hideTooltip() { tooltip.classList.remove('visible'); }

  waveCanvas.addEventListener('mousemove', e => {
    if (!waveData) return;
    const rect = waveCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * devicePixelRatio;
    const { fl, fh, T, MARGIN_L, PW, PH, MARGIN_B } = waveData;
    const plotX = mx - MARGIN_L;
    if (plotX < 0 || plotX > PW) { hideTooltip(); return; }
    const t = (plotX / PW) * T;
    const vLow  = Math.sin(2*Math.PI*fl*t);
    const vHigh = Math.sin(2*Math.PI*fh*t);
    const vSum  = 0.5*(vLow + vHigh);
    showTooltip(e,
      `<span class="tt-label">t = </span>${(t*1000).toFixed(3)} ms<br>` +
      `<span style="color:#bcd0f8">f_low (${fl}Hz) = </span>${vLow.toFixed(3)}<br>` +
      `<span style="color:#f8b8a8">f_high (${fh}Hz) = </span>${vHigh.toFixed(3)}<br>` +
      `<span style="color:#93c5fd">x(t) toplamı = </span>${vSum.toFixed(3)}`
    );
  });
  waveCanvas.addEventListener('mouseleave', hideTooltip);

  specCanvas.addEventListener('mousemove', e => {
    if (!specData) return;
    const rect = specCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * devicePixelRatio;
    const { fl, fh, mag, maxMag, maxFreq, maxBin, MARGIN_L, PW } = specData;
    const plotX = mx - MARGIN_L;
    if (plotX < 0 || plotX > PW) { hideTooltip(); return; }
    const freq = (plotX / PW) * maxFreq;
    const binCenter = Math.round(freq * FFT_SIZE / FS);
    const winR = Math.ceil(15 * FFT_SIZE / FS);
    let peakBin = binCenter, peakMag = 0;
    for (let b = Math.max(1, binCenter-winR); b <= Math.min(maxBin-1, binCenter+winR); b++) {
      if (mag[b] > peakMag) { peakMag = mag[b]; peakBin = b; }
    }
    const norm = peakMag / maxMag;
    const freqExact = peakBin * FS / FFT_SIZE;
    const nearLow  = Math.abs(freqExact - fl) < 30;
    const nearHigh = Math.abs(freqExact - fh) < 30;
    const tag = nearLow  ? ` ← <span style="color:#93c5fd">f₁ (low)</span>`
              : nearHigh ? ` ← <span style="color:#fca5a5">f₂ (high)</span>` : '';
    const freqRes = (FS / FFT_SIZE).toFixed(2);
    showTooltip(e,
      `<span class="tt-label">Frekans: </span>${freqExact.toFixed(1)} Hz${tag}<br>` +
      `<span class="tt-label">Genlik: </span>${norm.toFixed(4)} (norm.)<br>` +
      `<span class="tt-label">Bin #${peakBin} &nbsp;|&nbsp; Δf = ${freqRes} Hz/bin</span>`
    );
  });
  specCanvas.addEventListener('mouseleave', hideTooltip);
}

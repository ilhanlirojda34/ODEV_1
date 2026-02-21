/**
 * ui.js — DOM güncelleme & durum yönetimi
 */

export function updateUI(k, fl, fh, playing) {
  // Tuş vurgusu
  document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));
  document.querySelector(`[data-key="${k}"]`).classList.add('pressed');

  // Bilgi şeridi
  document.getElementById('dispKey').textContent   = k;
  document.getElementById('dispLow').textContent   = fl + ' Hz';
  document.getElementById('dispHigh').textContent  = fh + ' Hz';
  document.getElementById('dispStatus').textContent = playing ? 'ÇALIYOR' : '—';

  // Grafik başlıkları
  document.getElementById('waveInfo').innerHTML =
    `<strong>${k}</strong> &nbsp;x(t) = sin(2π·${fl}·t) + sin(2π·${fh}·t)`;
  document.getElementById('specInfo').innerHTML =
    `<strong>f₁=${fl} Hz</strong> &nbsp; <strong>f₂=${fh} Hz</strong>`;

  // Rozet
  setStatusBadge(playing ? 'ÇALIYOR' : 'BEKLEME');

  // Boşta mesajları gizle
  document.getElementById('waveIdle').style.display = 'none';
  document.getElementById('specIdle').style.display = 'none';
}

export function setStatusBadge(txt) {
  const b = document.getElementById('statusBadge');
  b.textContent = txt;
  const active = txt === 'ÇALIYOR';
  b.style.background   = active ? '#eff4ff'       : 'var(--bg)';
  b.style.color        = active ? 'var(--accent)'  : 'var(--muted)';
  b.style.borderColor  = active ? '#bfd0f7'        : 'var(--border)';
}

export function clearPressedKeys() {
  document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));
}

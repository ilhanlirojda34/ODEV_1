// ── Arayüz Güncellemeleri ─────────────────────────────────────────────────────

export function updateUI(k, fl, fh, playing) {
  document.querySelectorAll('.key').forEach(b => b.classList.remove('pressed'));
  document.querySelector(`[data-key="${k}"]`).classList.add('pressed');
  document.getElementById('dispKey').textContent = k;
  document.getElementById('dispLow').textContent = fl + ' Hz';
  document.getElementById('dispHigh').textContent = fh + ' Hz';
  document.getElementById('dispStatus').textContent = playing ? 'ÇALIYOR' : '—';
  document.getElementById('waveInfo').innerHTML = `<strong>${k}</strong> &nbsp;x(t) = sin(2π·${fl}·t) + sin(2π·${fh}·t)`;
  document.getElementById('specInfo').innerHTML = `<strong>f₁=${fl} Hz</strong> &nbsp; <strong>f₂=${fh} Hz</strong>`;
  setStatusBadge(playing ? 'ÇALIYOR' : 'BEKLEME');

  document.getElementById('waveIdle').style.display = 'none';
  document.getElementById('specIdle').style.display = 'none';
}

export function setStatusBadge(txt) {
  const b = document.getElementById('statusBadge');
  b.textContent = txt;
  b.style.background = txt === 'ÇALIYOR' ? '#eff4ff' : 'var(--bg)';
  b.style.color      = txt === 'ÇALIYOR' ? 'var(--accent)' : 'var(--muted)';
  b.style.borderColor= txt === 'ÇALIYOR' ? '#bfd0f7' : 'var(--border)';
}

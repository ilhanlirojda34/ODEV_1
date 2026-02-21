import numpy as np
import matplotlib.pyplot as plt

# --- 1. FREKANS VE ÖRNEKLEME PARAMETRELERİ ---
f0 = 85.0
f1 = f0          # 85.0 Hz
f2 = f0 / 2.0    # 42.5 Hz
f3 = 10.0 * f0   # 850.0 Hz

# Nyquist'e göre fs >= 1700 Hz olmalı. Pürüzsüz çizim için 10000 Hz seçtik.
fs = 10000.0     

# --- 2. ZAMAN VEKTÖRLERİ (Dinamik 3 Periyot Ayarı) ---
# Periyot formülü: T = 1 / f
# Her sinyal için 3 periyotluk (3 * T) zaman dizisi oluşturuyoruz
t1 = np.arange(0, 3 * (1 / f1), 1 / fs)
t2 = np.arange(0, 3 * (1 / f2), 1 / fs)
t3 = np.arange(0, 3 * (1 / f3), 1 / fs)

# --- 3. SİNYALLERİN ÜRETİLMESİ ---
# x(t) = sin(2 * pi * f * t)
y1 = np.sin(2 * np.pi * f1 * t1)
y2 = np.sin(2 * np.pi * f2 * t2)
y3 = np.sin(2 * np.pi * f3 * t3)

# --- 4. GÖRSELLEŞTİRME: İLK 3 SİNYAL (Aynı pencerede alt alta) ---
fig1, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(8, 8))
fig1.canvas.manager.set_window_title('Görev 1 - Temel Sinyaller')
plt.subplots_adjust(hspace=0.5) # Grafikler arası boşluk

ax1.plot(t1, y1, color='blue')
ax1.set_title(f'Sinyal 1 (f1 = {f1} Hz)')
ax1.set_xlabel('Zaman (s)')
ax1.set_ylabel('Genlik')
ax1.grid(True)

ax2.plot(t2, y2, color='green')
ax2.set_title(f'Sinyal 2 (f2 = {f2} Hz)')
ax2.set_xlabel('Zaman (s)')
ax2.set_ylabel('Genlik')
ax2.grid(True)

ax3.plot(t3, y3, color='red')
ax3.set_title(f'Sinyal 3 (f3 = {f3} Hz)')
ax3.set_xlabel('Zaman (s)')
ax3.set_ylabel('Genlik')
ax3.grid(True)

# --- 5. TOPLAM SİNYAL GRAFİĞİ (Yeni Pencerede) ---
# Toplam sinyali çizerken, en düşük frekanslı sinyalin (f2) 3 periyodunu
# baz alıyoruz ki tüm sinyallerin davranışı net görünsün.
t_sum = np.arange(0, 3 * (1 / f2), 1 / fs)
y_sum = np.sin(2 * np.pi * f1 * t_sum) + np.sin(2 * np.pi * f2 * t_sum) + np.sin(2 * np.pi * f3 * t_sum)

fig2, ax_sum = plt.subplots(figsize=(8, 4))
fig2.canvas.manager.set_window_title('Görev 1 - Toplam Sinyal')
ax_sum.plot(t_sum, y_sum, color='purple')
ax_sum.set_title('3 Sinyalin Toplamı (x(t) = x1(t) + x2(t) + x3(t))')
ax_sum.set_xlabel('Zaman (s)')
ax_sum.set_ylabel('Genlik')
ax_sum.grid(True)

# Grafikleri ekranda göster
plt.show()
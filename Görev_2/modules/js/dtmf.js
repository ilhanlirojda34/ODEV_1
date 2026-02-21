/**
 * dtmf.js — DTMF Frekans Tablosu ve Sabitler
 */

export const DTMF = {
  '1':[697,1209],'2':[697,1336],'3':[697,1477],'A':[697,1633],
  '4':[770,1209],'5':[770,1336],'6':[770,1477],'B':[770,1633],
  '7':[852,1209],'8':[852,1336],'9':[852,1477],'C':[852,1633],
  '*':[941,1209],'0':[941,1336],'#':[941,1477],'D':[941,1633],
};

export const LAYOUT   = ['1','2','3','A','4','5','6','B','7','8','9','C','*','0','#','D'];
export const SPECIAL  = new Set(['A','B','C','D','*','#']);

export const FS       = 44100;  // örnekleme frekansı
export const FFT_SIZE = 2048;
export const MIN_MS   = 150;    // minimum tuş basma süresi (ms)

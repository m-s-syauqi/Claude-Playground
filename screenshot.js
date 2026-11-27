// Reads a run from a screenshot of a running app (Strava, Huawei Health, …).
// Text recognition runs in the browser with Tesseract.js, so the image never
// leaves the device. Only the recogniser itself is downloaded from a CDN, the
// first time it's used.
(function (root) {
  'use strict';

  const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  const KM_PER_MI = 1.609344;
  const IDLE_MS = 60000;

  // ---------- Parsing (pure, no DOM) ----------
  const MONTHS = {
    jan: 1, january: 1, januari: 1,
    feb: 2, february: 2, februari: 2,
    mar: 3, march: 3, maret: 3,
    apr: 4, april: 4,
    may: 5, mei: 5,
    jun: 6, june: 6, juni: 6,
    jul: 7, july: 7, juli: 7,
    aug: 8, august: 8, agu: 8, agt: 8, agustus: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, okt: 10, oktober: 10,
    nov: 11, november: 11, nop: 11, nopember: 11,
    dec: 12, december: 12, des: 12, desember: 12,
  };
  const pad = (n) => String(n).padStart(2, '0');
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const validDate = (y, m, d) => {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
  };
  const to24 = (h, min, ampm) => {
    h = Number(h); min = Number(min);
    if (ampm) { const pm = /p/i.test(ampm); if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; }
    return h < 24 && min < 60 ? `${pad(h)}:${pad(min)}` : '';
  };
  const durSec = (s) => s.split(':').map(Number).reduce((a, v) => a * 60 + v, 0);

  function findDateTime(t, ref) {
    // "Run 2026-11-27 05:07:25" (activity names synced from watches)
    let m = t.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T]+(\d{1,2})[:.](\d{2}))?/);
    if (m) {
      const date = validDate(+m[1], +m[2], +m[3]);
      if (date) return { date, time: m[4] ? to24(m[4], m[5]) : '' };
    }
    const timeAfter = String.raw`(?:\s*(?:at|pukul|jam|,|·|-)?\s*(\d{1,2})[:.](\d{2})\s*([ap]\.?m\.?)?)?`;
    // "Today at 5:07 AM", "Yesterday at 17:00", "Hari ini pukul 05.07", "Kemarin pukul 17.00"
    m = t.match(new RegExp(String.raw`\b(today|yesterday|hari ini|kemarin)\b` + timeAfter, 'i'));
    if (m) {
      const d = new Date(ref);
      if (/yesterday|kemarin/i.test(m[1])) d.setDate(d.getDate() - 1);
      return { date: isoOf(d), time: m[2] ? to24(m[2], m[3], m[4]) : '' };
    }
    // "November 26, 2026 at 5:07 AM" or "26 November 2026 pukul 05.07"
    const re = new RegExp(String.raw`\b(?:(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(20\d{2})|([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(20\d{2}))` + timeAfter, 'gi');
    for (const x of t.matchAll(re)) {
      const day = Number(x[1] || x[5]), mon = MONTHS[(x[2] || x[4]).toLowerCase()], year = Number(x[3] || x[6]);
      const date = mon && validDate(year, mon, day);
      if (date) return { date, time: x[7] ? to24(x[7], x[8], x[9]) : '' };
    }
    return null;
  }

  function parseRun(text, ref = new Date()) {
    let t = String(text || '').replace(/[‘’`´′]/g, "'").replace(/[“”″]/g, '"');
    const out = { date: null, time: '', km: null, durationSec: null, paceSec: null, hr: null, kcal: null, elevM: null, guessedDate: false };

    const dt = findDateTime(t, ref);
    if (dt) Object.assign(out, dt);
    else { out.date = isoOf(new Date(ref)); out.guessedDate = true; }

    // Pace: "6:45 /km", "6'45\"/km". OCR sometimes misreads the slash ("6:45 [km", "5:47 fkm"),
    // so allow any one character there. Remove it so it isn't taken for a duration.
    const paceRe = /(?<![\d:])(\d{1,2})[:'](\d{2})"?\s*[^\s\d]?\s*(km|mi)\b/i;
    let m = t.match(paceRe);
    if (m) {
      const sec = Number(m[1]) * 60 + Number(m[2]);
      out.paceSec = /mi/i.test(m[3]) ? sec / KM_PER_MI : sec;
      t = t.replace(m[0], ' ');
    }
    // Drop timestamps so they aren't taken for durations.
    t = t.replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}[ T]+\d{1,2}:\d{2}(:\d{2})?/g, ' ')
      .replace(/\b\d{1,2}[:.]\d{2}\s*[ap]\.?m\.?/gi, ' ')
      .replace(/\b(?:at|pukul|jam)\s+\d{1,2}[:.]\d{2}/gi, ' ');

    const times = [...t.matchAll(/(?<![\d:.])(\d{1,2}:\d{2}(?::\d{2})?)(?![\d:])/g)].map((x) => durSec(x[1])).filter((s) => s > 0);

    // Distance. OCR often drops the decimal point ("413 km" for 4.13 km), so keep the possible readings.
    const dists = [];
    for (const x of t.matchAll(/(?<![\d:.,])(\d{1,3}(?:[.,]\d{1,3})?)\s*(km|mi)\b/gi)) {
      const f = /mi/i.test(x[2]) ? KM_PER_MI : 1;
      const raw = x[1].replace(',', '.');
      if (raw.includes('.')) dists.push([Number(raw) * f]);
      else { const n = Number(raw); dists.push([n / 100, n / 10, n].filter((v) => v >= 0.3).map((v) => v * f)); }
    }
    const variants = dists.length ? dists[0] : [];

    const P = out.paceSec;
    if (P && times.length && variants.length) {
      // Pick the distance reading and time that agree with the pace.
      let best = null;
      for (const D of variants) for (const T of times) {
        const err = Math.abs(T - P * D) / (P * D);
        if (!best || err < best.err) best = { err, D, T };
      }
      if (best.err < 0.05) { out.km = best.D; out.durationSec = best.T; }
      else { out.durationSec = times[0]; out.km = Math.round((times[0] / P) * 100) / 100; }
    } else if (P && times.length) {
      out.durationSec = times[0];
      out.km = Math.round((times[0] / P) * 100) / 100;
    } else if (variants.length) {
      const T = times[0] || null;
      out.durationSec = T;
      out.km = (T && variants.find((D) => T / D >= 150 && T / D <= 1200)) || variants[0];
      if (!T && P) out.durationSec = Math.round(P * out.km);
    } else if (times.length) {
      out.durationSec = times[0];
    }
    if (out.km != null) out.km = Math.round(out.km * 100) / 100;

    m = t.match(/(\d{2,3})\s*bpm/i);
    if (m && +m[1] >= 50 && +m[1] <= 230) out.hr = Number(m[1]);
    m = t.match(/(?<![\d.,])(\d{1,2}[.,]\d{3}|\d{1,4})\s*(?:cal|kcal|kkal)\b/i);
    if (m) out.kcal = Number(m[1].replace(/[.,]/g, ''));
    // Elevation: the first "<n> m" after the label, skipping times like "2m 23s".
    const elevAt = t.search(/elev/i);
    if (elevAt >= 0) {
      m = t.slice(elevAt).match(/(?<![\w:.,])([0-9Oo]{1,4})\s?m\b(?!\s*\d{1,2}\s?s\b)/);
      if (m) out.elevM = Number(m[1].replace(/o/gi, '0'));
    }
    return out;
  }

  // ---------- Recognition (browser only) ----------
  let workerPromise = null, idleTimer = null, onProgress = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => reject(new Error('load'));
      document.head.appendChild(s);
    });
  }

  function getWorker() {
    if (!workerPromise) {
      workerPromise = (async () => {
        if (!root.Tesseract) await loadScript(TESSERACT_URL);
        const worker = await root.Tesseract.createWorker('eng', 1, {
          logger: (msg) => { if (onProgress) onProgress(msg); },
        });
        // Automatic page layout. The default (one block of text) skips lines on
        // screens that mix a map, cards and a grid of numbers.
        await worker.setParameters({ tessedit_pageseg_mode: '3' });
        return worker;
      })().catch((e) => { workerPromise = null; throw e; });
    }
    return workerPromise;
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      const p = workerPromise; workerPromise = null;
      if (p) { try { (await p).terminate(); } catch { /* ignore */ } }
    }, IDLE_MS);
  }

  // Black text on white: grayscale, dark mode inverted, then thresholded so tinted
  // cards and badges don't break up the text. Status bar cropped.
  async function prepare(file) {
    const bmp = await createImageBitmap(file);
    const crop = Math.round(bmp.height * 0.04);
    const scale = Math.min(2, Math.max(1, 1000 / bmp.width), 2400 / bmp.width);
    const w = Math.round(bmp.width * scale), h = Math.round((bmp.height - crop) * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, crop, bmp.width, bmp.height - crop, 0, 0, w, h);
    if (bmp.close) bmp.close();
    const img = ctx.getImageData(0, 0, w, h), px = img.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = g;
      sum += g;
    }
    const dark = sum / (px.length / 4) < 128;
    for (let i = 0; i < px.length; i += 4) {
      const g = dark ? 255 - px[i] : px[i];
      px[i] = px[i + 1] = px[i + 2] = g > 150 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  async function readRun(file, progress) {
    onProgress = progress || null;
    clearTimeout(idleTimer);
    try {
      const [worker, canvas] = await Promise.all([getWorker(), prepare(file)]);
      const { data } = await worker.recognize(canvas);
      const ref = file.lastModified ? new Date(file.lastModified) : new Date();
      return { ...parseRun(data.text, ref), text: data.text };
    } finally {
      onProgress = null;
      scheduleIdle();
    }
  }

  const api = { parseRun, readRun };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StrideScreenshot = api;
})(typeof window !== 'undefined' ? window : globalThis);

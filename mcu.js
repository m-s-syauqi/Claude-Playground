(() => {
  'use strict';

  // ---------- Data: 29 lari dari ringkasan PDF ----------
  // [tanggal, mulai, jarak km, waktu bergerak, HR rata-rata, elevasi m, kalori, catatan]
  const RAW = [
    ['2026-09-02', '16:38', 5.29, '35:44', 157, 19, 355, ''],
    ['2026-09-05', '08:03', 5.30, '36:11', 150, 9, 343, ''],
    ['2026-09-07', '17:00', 3.16, '19:36', 153, 11, 196, ''],
    ['2026-09-09', '16:52', 5.05, '33:11', 147, 10, 315, '1/2 mil tercepat ke-3'],
    ['2026-09-11', '17:07', 4.33, '27:48', 155, 2, 278, ''],
    ['2026-09-12', '16:16', 10.02, '1:06:16', 153, 8, 649, 'PR 10K (-54 dtk)'],
    ['2026-09-14', '17:07', 2.94, '19:14', 150, 0, 186, ''],
    ['2026-09-19', '08:25', 5.01, '33:45', 147, 0, 314, ''],
    ['2026-09-22', '17:05', 3.31, '21:01', 149, 0, 205, ''],
    ['2026-09-25', '17:07', 3.25, '20:51', 150, 0, 203, ''],
    ['2026-09-26', '07:48', 6.93, '53:54', 137, 10, 650, 'HR terendah'],
    ['2026-09-30', '16:33', 2.99, '19:46', 160, 0, 204, ''],
    ['2026-10-01', '17:01', 2.22, '14:07', 159, 0, 148, ''],
    ['2026-10-02', '17:00', 3.05, '20:02', 146, 0, 191, ''],
    ['2026-10-06', '16:49', 3.30, '22:35', 154, 8, 209, 'Streak 10 minggu'],
    ['2026-10-09', '17:06', 3.03, '18:50', 169, 0, 207, ''],
    ['2026-10-10', '07:39', 5.00, '36:16', 158, 8, 356, ''],
    ['2026-10-15', '16:43', 3.98, '26:45', 165, 0, 272, ''],
    ['2026-10-18', '07:33', 2.24, '15:46', 151, 0, 152, ''],
    ['2026-10-24', '08:13', 2.30, '14:04', 170, 0, 216, 'Pace tercepat'],
    ['2026-10-27', '16:52', 3.00, '18:20', 164, 0, 194, 'Pace tercepat'],
    ['2026-11-01', '08:08', 5.06, '37:59', 163, 2, 378, ''],
    ['2026-11-12', '16:48', 2.94, '19:50', 154, 7, 199, 'Setelah jeda 11 hari'],
    ['2026-11-20', '17:00', 3.23, '21:49', 158, 0, 220, ''],
    ['2026-11-21', '04:58', 4.04, '28:22', 169, 0, 292, ''],
    ['2026-11-22', '07:39', 5.01, '34:59', 160, 0, 349, ''],
    ['2026-11-24', '17:00', 4.98, '33:25', 151, 0, 324, '~5 km tercepat sejak Sep'],
    ['2026-11-26', '16:48', 5.02, '35:16', 153, 0, 341, 'Bersama Luthfi R'],
    ['2026-11-27', '05:07', 4.13, '27:52', 156, 0, 282, ''],
  ];
  const HIGHLIGHT = new Set(['2026-09-12', '2026-11-24']);
  const ANNOTATE = { '2026-09-12': 'PR 10K', '2026-11-24': '24 Nov' };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const MONTH_COLOR = { 8: 'var(--m-sep)', 9: 'var(--m-okt)', 10: 'var(--m-nov)' };

  // ---------- Helpers ----------
  const pad = (n) => String(n).padStart(2, '0');
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const mondayOf = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const num = (n, p = 1) => n.toLocaleString('id-ID', { minimumFractionDigits: p, maximumFractionDigits: p });
  const int = (n) => Math.round(n).toLocaleString('id-ID');
  const parseDur = (s) => s.split(':').map(Number).reduce((a, v) => a * 60 + v, 0);
  const fmtDur = (sec) => {
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };
  const fmtPace = (secPerKm) => { const s = Math.round(secPerKm); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const runs = RAW.map(([date, time, km, dur, hr, elev, kcal, note]) => {
    const d = fromISO(date);
    const sec = parseDur(dur);
    return { date, d, time, km, sec, pace: sec / km, hr, elev, kcal, note, month: d.getMonth() };
  });

  function summarize(list) {
    const km = list.reduce((s, r) => s + r.km, 0);
    const sec = list.reduce((s, r) => s + r.sec, 0);
    return {
      count: list.length,
      km,
      sec,
      pace: sec / km,
      hr: list.reduce((s, r) => s + r.hr * r.sec, 0) / sec, // ditimbang waktu bergerak
      elev: list.reduce((s, r) => s + r.elev, 0),
      kcal: list.reduce((s, r) => s + r.kcal, 0),
    };
  }
  const total = summarize(runs);

  // ---------- KPI ----------
  function renderKpis() {
    const totalMin = Math.round(total.sec / 60);
    const items = [
      [total.count, 'lari'],
      [num(total.km), 'km total'],
      [`${Math.floor(totalMin / 60)} j ${totalMin % 60} m`, 'waktu bergerak'],
      [fmtPace(total.pace), 'pace rata-rata /km'],
      [Math.round(total.hr), 'HR rata-rata (bpm)'],
      [int(total.kcal), 'kalori'],
    ];
    document.getElementById('kpis').innerHTML = items
      .map(([v, l]) => `<div class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div></div>`)
      .join('');
  }

  function renderLegend() {
    document.getElementById('legend').innerHTML = [8, 9, 10]
      .map((m) => `<li><i style="background:${MONTH_COLOR[m]}"></i>${MONTHS_LONG[m]}</li>`)
      .join('');
  }

  // ---------- Weekly series ----------
  function weeklySeries() {
    const first = mondayOf(runs[0].d), last = mondayOf(runs[runs.length - 1].d);
    const out = [];
    for (let w = first; w <= last; w = addDays(w, 7)) {
      const startISO = toISO(w), endISO = toISO(addDays(w, 7));
      const list = runs.filter((r) => r.date >= startISO && r.date < endISO);
      // Warna mengikuti bulan hari Kamis minggu itu (minggu ISO).
      out.push({ start: w, km: list.reduce((s, r) => s + r.km, 0), count: list.length, month: addDays(w, 3).getMonth() });
    }
    return out;
  }

  function niceStep(max, targetTicks = 5) {
    const raw = max / targetTicks;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function setupTooltip(el, targets, contentFor, anchorFor) {
    const tip = el.querySelector('.chart-tooltip');
    const W = el.clientWidth;
    const show = (t) => {
      tip.innerHTML = contentFor(t);
      tip.hidden = false;
      const [cx, cy] = anchorFor(t);
      const tw = tip.offsetWidth;
      tip.style.left = `${Math.min(Math.max(cx, tw / 2 + 4), W - tw / 2 - 4)}px`;
      tip.style.top = `${Math.max(cy, tip.offsetHeight + 14)}px`;
    };
    const hide = () => { tip.hidden = true; };
    targets.forEach((t) => {
      t.addEventListener('mouseenter', () => show(t));
      t.addEventListener('focus', () => show(t));
      t.addEventListener('mouseleave', hide);
      t.addEventListener('blur', hide);
    });
  }

  // ---------- Weekly bar chart ----------
  function renderWeekly() {
    const el = document.getElementById('weekly-chart');
    el.querySelectorAll('svg').forEach((n) => n.remove());
    const data = weeklySeries();
    const W = el.clientWidth || 600, H = el.clientHeight || 260;
    const band0 = (W - 44) / data.length;
    const rotate = band0 < 52;
    const m = { t: 20, r: 6, b: rotate ? 44 : 26, l: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxVal = Math.max(...data.map((d) => d.km));
    const step = niceStep(maxVal);
    const top = Math.ceil(maxVal / step) * step;
    const y = (v) => m.t + ih - (v / top) * ih;
    const band = iw / data.length;
    const bw = Math.min(28, band * 0.7);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram batang jarak mingguan dalam kilometer, ${data.length} minggu">`;
    svg += '<g class="grid">';
    for (let v = 0; v <= top + 1e-9; v += step) {
      const yy = Math.round(y(v)) + 0.5;
      if (v > 0) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`;
      svg += `<text class="tick" x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${v}</text>`;
    }
    svg += '</g>';
    svg += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${Math.round(y(0)) + 0.5}" y2="${Math.round(y(0)) + 0.5}"/>`;

    data.forEach((d, i) => {
      const cx = m.l + band * (i + 0.5), x = cx - bw / 2, base = y(0), h = base - y(d.km);
      svg += `<rect class="hit" data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" tabindex="0"
                aria-label="Minggu ${shortDate(d.start)}: ${num(d.km)} km, ${d.count} lari"/>`;
      svg += `<rect class="bar-hover" x="${m.l + band * i + 1}" y="${m.t}" width="${band - 2}" height="${ih}" rx="6"/>`;
      if (h >= 0.5) {
        const r = Math.min(4, h, bw / 2), yt = base - h;
        svg += `<path class="mbar" style="fill:${MONTH_COLOR[d.month]}" d="M${x},${base} L${x},${yt + r} Q${x},${yt} ${x + r},${yt} L${x + bw - r},${yt} Q${x + bw},${yt} ${x + bw},${yt + r} L${x + bw},${base} Z"/>`;
      }
      svg += `<text class="bar-label" x="${cx}" y="${y(d.km) - 5}" text-anchor="middle">${d.km ? num(d.km) : '0'}</text>`;
      svg += rotate
        ? `<text class="tick" transform="translate(${cx + 4},${H - m.b + 14}) rotate(-40)" text-anchor="end">${shortDate(d.start)}</text>`
        : `<text class="tick" x="${cx}" y="${H - 6}" text-anchor="middle">${shortDate(d.start)}</text>`;
    });
    svg += '</svg>';
    el.insertAdjacentHTML('beforeend', svg);

    setupTooltip(el, el.querySelectorAll('.hit'), (t) => {
      const d = data[Number(t.dataset.i)];
      return `<strong>Minggu ${shortDate(d.start)} – ${shortDate(addDays(d.start, 6))}</strong>
        <div class="tt-row">Jarak <b>${num(d.km)} km</b></div>
        <div class="tt-row">Lari <b>${d.count}</b></div>`;
    }, (t) => {
      const i = Number(t.dataset.i);
      return [m.l + band * (i + 0.5), y(data[i].km) - 16];
    });

    document.getElementById('weekly-table').innerHTML = `
      <table>
        <thead><tr><th>Minggu mulai</th><th class="num">Jarak (km)</th><th class="num">Lari</th></tr></thead>
        <tbody>${data.map((d) => `<tr><td>${shortDate(d.start)}</td><td class="num">${num(d.km)}</td><td class="num">${d.count}</td></tr>`).join('')}</tbody>
      </table>`;
  }

  // ---------- Pace vs HR scatter ----------
  function renderScatter() {
    const el = document.getElementById('scatter-chart');
    el.querySelectorAll('svg').forEach((n) => n.remove());
    const W = el.clientWidth || 600, H = el.clientHeight || 260;
    const m = { t: 14, r: 12, b: 26, l: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const x0 = 355, x1 = 475, y0 = 134, y1 = 173; // detik/km dan bpm
    const x = (v) => m.l + ((v - x0) / (x1 - x0)) * iw;
    const y = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
    const rad = (km) => 2.5 + km * 0.55;

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram sebar pace terhadap detak jantung rata-rata untuk ${runs.length} lari">`;
    svg += '<g class="grid">';
    for (let v = 140; v <= 170; v += 5) {
      const yy = Math.round(y(v)) + 0.5;
      svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/><text class="tick" x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${v}</text>`;
    }
    for (let v = 360; v <= 450; v += 30) {
      const xx = Math.round(x(v)) + 0.5;
      svg += `<line x1="${xx}" x2="${xx}" y1="${m.t}" y2="${m.t + ih}"/><text class="tick" x="${xx}" y="${H - 6}" text-anchor="middle">${fmtPace(v)}</text>`;
    }
    svg += '</g>';
    svg += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${Math.round(m.t + ih) + 0.5}" y2="${Math.round(m.t + ih) + 0.5}"/>`;

    // Lari jauh digambar dulu supaya titik kecil tetap terlihat di atasnya.
    const order = runs.map((r, i) => i).sort((a, b) => runs[b].km - runs[a].km);
    order.forEach((i) => {
      const r = runs[i];
      svg += `<circle class="dot" data-i="${i}" cx="${x(r.pace)}" cy="${y(r.hr)}" r="${rad(r.km)}" style="fill:${MONTH_COLOR[r.month]}" tabindex="0"
                aria-label="${shortDate(r.d)}: ${num(r.km, 2)} km, pace ${fmtPace(r.pace)} per km, HR ${r.hr}"/>`;
    });
    runs.forEach((r) => {
      const label = ANNOTATE[r.date];
      if (!label) return;
      const cx = x(r.pace), cy = y(r.hr);
      const left = label === 'PR 10K';
      const lx = cx + (left ? -40 : 30), ly = cy + (left ? 46 : 30);
      svg += `<line class="annot-line" x1="${cx + (left ? -5 : 4)}" y1="${cy + 6}" x2="${lx + (left ? 6 : -6)}" y2="${ly - 11}"/>`;
      svg += `<text class="annot" x="${lx}" y="${ly}" text-anchor="${left ? 'end' : 'start'}">${label}</text>`;
    });
    svg += '</svg>';
    el.insertAdjacentHTML('beforeend', svg);

    setupTooltip(el, el.querySelectorAll('.dot'), (t) => {
      const r = runs[Number(t.dataset.i)];
      return `<strong>${DAYS[r.d.getDay()]}, ${shortDate(r.d)} · ${r.time.replace(':', '.')}</strong>
        <div class="tt-row">Jarak <b>${num(r.km, 2)} km</b></div>
        <div class="tt-row">Pace <b>${fmtPace(r.pace)} /km</b></div>
        <div class="tt-row">HR <b>${r.hr} bpm</b></div>`;
    }, (t) => {
      const r = runs[Number(t.dataset.i)];
      return [x(r.pace), y(r.hr) - rad(r.km) - 4];
    });
  }

  // ---------- Detail table ----------
  function renderTable() {
    const head = `<thead><tr>
      <th class="num">#</th><th>Tanggal</th><th>Hari</th><th>Mulai</th>
      <th class="num">Jarak (km)</th><th class="num">Waktu</th><th class="num">Pace (/km)</th>
      <th class="num">HR (bpm)</th><th class="num">Elev (m)</th><th class="num">Kalori</th><th>Catatan</th>
    </tr></thead>`;
    const sumRow = (label, s, cls) => `<tr class="${cls}">
      <td></td><td colspan="3">${label}</td>
      <td class="num">${num(s.km, 2)}</td><td class="num">${fmtDur(s.sec)}</td><td class="num">${fmtPace(s.pace)}</td>
      <td class="num">${Math.round(s.hr)}</td><td class="num">${s.elev}</td><td class="num">${int(s.kcal)}</td><td></td>
    </tr>`;
    let body = '';
    let n = 0;
    [8, 9, 10].forEach((month) => {
      const list = runs.filter((r) => r.month === month);
      list.forEach((r) => {
        n += 1;
        body += `<tr class="${HIGHLIGHT.has(r.date) ? 'is-highlight' : ''}">
          <td class="num">${n}</td><td>${shortDate(r.d)}</td><td>${DAYS[r.d.getDay()]}</td><td>${r.time.replace(':', '.')}</td>
          <td class="num">${num(r.km, 2)}</td><td class="num">${fmtDur(r.sec)}</td><td class="num">${fmtPace(r.pace)}</td>
          <td class="num">${r.hr}</td><td class="num">${r.elev}</td><td class="num">${int(r.kcal)}</td><td>${escapeHTML(r.note)}</td>
        </tr>`;
      });
      const s = summarize(list);
      body += sumRow(`Subtotal ${MONTHS_LONG[month]} · ${s.count} lari`, s, 'is-subtotal');
    });
    document.getElementById('runs-table').innerHTML = `${head}<tbody>${body}</tbody><tfoot>${sumRow(`TOTAL · ${total.count} lari`, total, 'is-total')}</tfoot>`;
  }

  // ---------- Impor ke Stride ----------
  const RUNS_KEY = 'stride.runs.v1';
  function importToStride() {
    let existing = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]');
      if (Array.isArray(parsed)) existing = parsed;
    } catch { /* abaikan data rusak */ }
    const incoming = runs.map((r) => ({
      id: `mcu-${r.date}-${r.time.replace(':', '')}`,
      date: r.date,
      time: r.time,
      type: r.km >= 6.5 ? 'long' : 'easy',
      status: 'completed',
      plannedKm: r.km,
      actualKm: r.km,
      durationSec: r.sec,
      notes: [r.note, `HR ${r.hr} bpm`].filter(Boolean).join(' · '),
      updatedAt: Date.now(), // so sync treats the import as the newest version
    }));
    const ids = new Set(incoming.map((r) => r.id));
    const already = existing.filter((r) => r && ids.has(r.id)).length;
    const merged = existing.filter((r) => !(r && ids.has(r.id))).concat(incoming);
    try {
      localStorage.setItem(RUNS_KEY, JSON.stringify(merged));
    } catch {
      toast('Gagal menyimpan. Penyimpanan browser mungkin penuh atau dinonaktifkan.');
      return;
    }
    toast(already ? `${incoming.length} lari diperbarui di Stride` : `${incoming.length} lari ditambahkan ke Stride`, 'Buka jadwal', () => { location.href = 'index.html'; });
  }

  let toastTimer;
  function toast(msg, actionLabel, action) {
    const el = document.getElementById('toast');
    clearTimeout(toastTimer);
    el.innerHTML = `<span>${escapeHTML(msg)}</span>${action ? `<button type="button">${escapeHTML(actionLabel)}</button>` : ''}`;
    el.hidden = false;
    if (action) el.querySelector('button').addEventListener('click', action, { once: true });
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 6000 : 3000);
  }

  // ---------- Init ----------
  renderKpis();
  renderLegend();
  renderWeekly();
  renderScatter();
  renderTable();
  document.getElementById('import-mcu').addEventListener('click', importToStride);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { renderWeekly(); renderScatter(); }, 120);
  });
})();

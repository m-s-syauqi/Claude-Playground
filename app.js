(() => {
  'use strict';

  // ---------- Constants ----------
  const RUNS_KEY = 'stride.runs.v1';
  const SETTINGS_KEY = 'stride.settings.v1';
  const KM_PER_MI = 1.609344;
  const CHART_WEEKS = 8;
  const RANGE_DAYS = 30;

  const TYPES = [
    { id: 'easy', label: 'Easy run' },
    { id: 'long', label: 'Long run' },
    { id: 'tempo', label: 'Tempo' },
    { id: 'intervals', label: 'Intervals' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'race', label: 'Race' },
  ];
  const typeLabel = (id) => (TYPES.find((t) => t.id === id) || TYPES[0]).label;
  const typeColor = (id) => `var(--type-${TYPES.some((t) => t.id === id) ? id : 'easy'})`;

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ICON_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_SKIP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // ---------- Date helpers (all local time, ISO yyyy-mm-dd strings) ----------
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const mondayOf = (d) => { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
  const todayISO = () => toISO(new Date());
  const shortDate = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

  // ---------- Unit / format helpers ----------
  const toUnit = (km) => (state.unit === 'mi' ? km / KM_PER_MI : km);
  const fromUnit = (v) => (state.unit === 'mi' ? v * KM_PER_MI : v);
  const round = (n, p = 1) => { const f = 10 ** p; return Math.round(n * f) / f; };
  const fmtNum = (n, p = 1) => round(n, p).toLocaleString(undefined, { maximumFractionDigits: p });
  const fmtDist = (km, p = 1) => `${fmtNum(toUnit(km), p)} ${state.unit}`;

  function parseDuration(str) {
    if (str == null) return null;
    const s = String(str).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) return Number(s) * 60; // bare number = minutes
    const parts = s.split(':').map(Number);
    if (parts.some((p) => Number.isNaN(p)) || parts.length < 2 || parts.length > 3) return NaN;
    const [h, m, sec] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
    if (sec >= 60 || (parts.length === 3 && m >= 60)) return NaN;
    return h * 3600 + m * 60 + sec;
  }
  function fmtDuration(sec) {
    if (sec == null || Number.isNaN(sec)) return '';
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function fmtPace(sec, km) {
    if (!sec || !km) return null;
    const perUnit = sec / toUnit(km);
    const m = Math.floor(perUnit / 60), s = Math.round(perUnit % 60);
    return s === 60 ? `${m + 1}:00 /${state.unit}` : `${m}:${pad(s)} /${state.unit}`;
  }
  function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

  // A run's distance for "done" purposes: actual if recorded, otherwise planned.
  const doneKm = (r) => (r.status === 'completed' ? (r.actualKm ?? r.plannedKm ?? 0) : 0);

  // ---------- State & storage ----------
  const state = {
    runs: [],
    unit: 'km',
    view: 'week', // 'week' | 'days30'
    weekStart: mondayOf(new Date()),
    rangeStart: fromISO(todayISO()),
    editingId: null,
  };

  function load() {
    try {
      const runs = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]');
      state.runs = Array.isArray(runs) ? runs.map(normalizeRun).filter(Boolean) : [];
    } catch { state.runs = []; }
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (s.unit === 'mi' || s.unit === 'km') state.unit = s.unit;
      if (s.view === 'week' || s.view === 'days30') state.view = s.view;
    } catch { /* ignore */ }
  }
  function save() {
    try {
      localStorage.setItem(RUNS_KEY, JSON.stringify(state.runs));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ unit: state.unit, view: state.view }));
    } catch {
      toast('Could not save. Browser storage may be full or disabled.');
    }
  }

  function normalizeRun(r) {
    if (!r || typeof r !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return null;
    const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Math.max(0, Number(v)));
    return {
      id: typeof r.id === 'string' && r.id ? r.id : uid(),
      date: r.date,
      time: typeof r.time === 'string' && /^\d{2}:\d{2}$/.test(r.time) ? r.time : '',
      type: TYPES.some((t) => t.id === r.type) ? r.type : 'easy',
      status: ['planned', 'completed', 'skipped'].includes(r.status) ? r.status : 'planned',
      plannedKm: num(r.plannedKm),
      actualKm: num(r.actualKm),
      durationSec: num(r.durationSec),
      notes: typeof r.notes === 'string' ? r.notes.slice(0, 2000) : '',
    };
  }

  // The span of days currently on screen: one Mon–Sun week, or 30 days.
  const period = () => (state.view === 'week'
    ? { start: state.weekStart, days: 7 }
    : { start: state.rangeStart, days: RANGE_DAYS });

  const sortRuns = (a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99');
  const runsBetween = (startISO, endISO) => state.runs.filter((r) => r.date >= startISO && r.date < endISO);

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const els = {
    weekLabel: $('#week-label'), weekRange: $('#week-range'),
    stats: $('#stats'), grid: $('#week-grid'),
    chart: $('#chart'), tooltip: $('#chart-tooltip'), chartTable: $('#chart-table'), chartSub: $('#chart-sub'),
    upcoming: $('#upcoming'),
    dialog: $('#run-dialog'), form: $('#run-form'), dialogTitle: $('#dialog-title'),
    deleteBtn: $('#delete-btn'), repeatField: $('#repeat-field'), formError: $('#form-error'),
    paceOut: $('#pace-output'), typeSelect: $('#type-select'),
    toast: $('#toast'),
  };

  // ---------- Rendering ----------
  function render() {
    renderHeader();
    renderStats();
    renderWeek();
    renderChart();
    renderUpcoming();
  }

  function renderHeader() {
    const { start, days } = period(), end = addDays(start, days - 1);
    if (state.view === 'week') {
      const thisMonday = toISO(mondayOf(new Date()));
      const diff = Math.round((start - fromISO(thisMonday)) / (7 * 864e5));
      els.weekLabel.textContent =
        diff === 0 ? 'This week' : diff === -1 ? 'Last week' : diff === 1 ? 'Next week' :
        diff < 0 ? `${-diff} weeks ago` : `In ${diff} weeks`;
    } else {
      const diff = Math.round((start - fromISO(todayISO())) / 864e5);
      els.weekLabel.textContent =
        diff === 0 ? 'Next 30 days' : diff === -RANGE_DAYS ? 'Previous 30 days' : '30 days';
    }
    const thisYear = new Date().getFullYear();
    const sameYear = start.getFullYear() === end.getFullYear() && start.getFullYear() === thisYear;
    els.weekRange.textContent = `${shortDate(start)} – ${shortDate(end)}${sameYear ? '' : `, ${end.getFullYear()}`}`;
    const unitWord = state.view === 'week' ? 'week' : '30 days';
    $('#prev-week').setAttribute('aria-label', `Previous ${unitWord}`);
    $('#next-week').setAttribute('aria-label', `Next ${unitWord}`);
    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    document.querySelectorAll('[data-unit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === state.unit)));
    document.querySelectorAll('.unit-label').forEach((el) => { el.textContent = state.unit; });
  }

  function renderStats() {
    const { start, days } = period();
    const runs = runsBetween(toISO(start), toISO(addDays(start, days)));
    const active = runs.filter((r) => r.status !== 'skipped');
    const done = runs.filter((r) => r.status === 'completed');
    const plannedKm = active.reduce((s, r) => s + (r.plannedKm ?? r.actualKm ?? 0), 0);
    const completedKm = done.reduce((s, r) => s + doneKm(r), 0);
    const pct = plannedKm > 0 ? Math.min(100, (completedKm / plannedKm) * 100) : (completedKm > 0 ? 100 : 0);

    const timed = done.filter((r) => r.durationSec && doneKm(r));
    const totalSec = timed.reduce((s, r) => s + r.durationSec, 0);
    const timedKm = timed.reduce((s, r) => s + doneKm(r), 0);
    const avgPace = fmtPace(totalSec, timedKm);
    const longest = done.reduce((m, r) => Math.max(m, doneKm(r)), 0);
    const totalTime = done.reduce((s, r) => s + (r.durationSec || 0), 0);

    els.stats.innerHTML = `
      <div class="card stat">
        <div class="stat-label">Distance</div>
        <div class="stat-value">${fmtNum(toUnit(completedKm))}<small>/ ${fmtNum(toUnit(plannedKm))} ${state.unit}</small></div>
        <div class="meter" role="progressbar" aria-label="Distance progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>
      </div>
      <div class="card stat">
        <div class="stat-label">Runs done</div>
        <div class="stat-value">${done.length}<small>/ ${active.length}</small></div>
        <div class="stat-note">${runs.length - active.length ? `${runs.length - active.length} skipped` : (active.length ? `${Math.round(active.length ? (done.length / active.length) * 100 : 0)}% complete` : 'Nothing planned yet')}</div>
      </div>
      <div class="card stat">
        <div class="stat-label">Time on feet</div>
        <div class="stat-value">${totalTime ? fmtDuration(totalTime) : '–'}</div>
        <div class="stat-note">${longest ? `Longest run ${fmtDist(longest)}` : 'No runs logged'}</div>
      </div>
      <div class="card stat">
        <div class="stat-label">Average pace</div>
        <div class="stat-value">${avgPace ? avgPace.replace(` /${state.unit}`, '') : '–'}${avgPace ? `<small>/${state.unit}</small>` : ''}</div>
        <div class="stat-note">${avgPace ? `Across ${timed.length} timed run${timed.length === 1 ? '' : 's'}` : 'Log a duration to see pace'}</div>
      </div>`;
  }

  function runCard(r) {
    const dist = r.status === 'completed' ? (r.actualKm ?? r.plannedKm) : r.plannedKm;
    const pace = r.status === 'completed' ? fmtPace(r.durationSec, doneKm(r)) : null;
    const meta = [fmtTime(r.time), r.status === 'completed' && r.durationSec ? fmtDuration(r.durationSec) : '', pace].filter(Boolean).join(' · ');
    const badge = r.status === 'completed'
      ? `<span class="badge badge-done">${ICON_CHECK}Done</span>`
      : r.status === 'skipped' ? `<span class="badge badge-skipped">${ICON_SKIP}Skipped</span>` : '';
    const done = r.status === 'completed';
    return `
      <div class="run ${r.status === 'skipped' ? 'is-skipped' : ''}" style="--type-color:${typeColor(r.type)}" data-edit="${r.id}" role="button" tabindex="0"
           aria-label="${escapeHTML(`${typeLabel(r.type)}${dist != null ? `, ${fmtDist(dist)}` : ''}, ${r.status === 'completed' ? 'done' : r.status}. Edit`)}">
        <div class="run-top">
          <span class="run-type">${typeLabel(r.type)}</span>
          ${r.status !== 'skipped' ? `<button type="button" class="run-check" data-toggle="${r.id}" aria-pressed="${done}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}" title="${done ? 'Mark as not done' : 'Mark as done'}">${ICON_CHECK}</button>` : ''}
        </div>
        <span class="run-dist">${dist != null ? fmtDist(dist, 2) : 'No distance'}</span>
        ${meta ? `<span class="run-meta">${escapeHTML(meta)}</span>` : ''}
        ${badge}
      </div>`;
  }

  function welcomeCard() {
    return `
        <div class="card welcome">
          <h3>Plan your first week</h3>
          <p>Add runs to any day below, or start with a sample beginner 10K plan you can edit.</p>
          <button type="button" class="btn btn-primary" data-action="sample">Load sample plan</button>
          <button type="button" class="btn btn-ghost" data-action="add">Add a run</button>
        </div>`;
  }

  function renderWeek() {
    els.grid.classList.toggle('is-calendar', state.view === 'days30');
    if (state.view === 'days30') { renderCalendar(); return; }
    els.grid.setAttribute('aria-label', 'Runs this week');
    const today = todayISO();
    let html = '';
    if (!state.runs.length) html += welcomeCard();
    for (let i = 0; i < 7; i++) {
      const d = addDays(state.weekStart, i), iso = toISO(d);
      const runs = state.runs.filter((r) => r.date === iso).sort(sortRuns);
      html += `
        <div class="day ${iso === today ? 'is-today' : ''} ${iso < today ? 'is-past' : ''}">
          <div class="day-head">
            <span class="day-name">${DAY_NAMES[i]}</span>
            ${iso === today ? '<span class="today-pill">Today</span>' : `<span class="day-date">${shortDate(d)}</span>`}
          </div>
          <div class="day-runs">
            ${runs.length ? runs.map(runCard).join('') : '<span class="day-empty">Rest day</span>'}
          </div>
          <button type="button" class="day-add" data-add-date="${iso}" aria-label="Add run on ${DAY_NAMES[i]} ${shortDate(d)}">+ Add</button>
        </div>`;
    }
    els.grid.innerHTML = html;
  }

  function calRun(r) {
    const done = r.status === 'completed', skipped = r.status === 'skipped';
    const dist = done ? (r.actualKm ?? r.plannedKm) : r.plannedKm;
    const distText = dist != null ? fmtNum(toUnit(dist), 1) : '–';
    const label = `${typeLabel(r.type)}${dist != null ? `, ${fmtDist(dist)}` : ''}, ${done ? 'done' : r.status}${r.time ? `, ${fmtTime(r.time)}` : ''}. Edit`;
    return `
      <button type="button" class="cal-run ${done ? 'is-done' : ''} ${skipped ? 'is-skipped' : ''}" style="--type-color:${typeColor(r.type)}"
              data-edit="${r.id}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label.replace(/\. Edit$/, ''))}">
        <span class="cal-type">${typeLabel(r.type)}</span>
        <span class="cal-dist">${distText}<small> ${state.unit}</small></span>
        ${done ? ICON_CHECK : ''}
      </button>`;
  }

  function renderCalendar() {
    const { start, days } = period();
    const today = todayISO();
    els.grid.setAttribute('aria-label', `Runs from ${shortDate(start)} to ${shortDate(addDays(start, days - 1))}`);
    let html = state.runs.length ? '' : welcomeCard();
    html += DAY_NAMES.map((d) => `<div class="cal-dow" aria-hidden="true">${d}</div>`).join('');
    const lead = (start.getDay() + 6) % 7; // grid columns run Monday to Sunday
    html += '<div class="cal-blank" aria-hidden="true"></div>'.repeat(lead);
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i), iso = toISO(d);
      const runs = state.runs.filter((r) => r.date === iso).sort(sortRuns);
      const showMonth = i === 0 || d.getDate() === 1;
      const weekday = DAY_NAMES[(d.getDay() + 6) % 7];
      html += `
        <div class="cal-day ${iso === today ? 'is-today' : ''} ${iso < today ? 'is-past' : ''}" data-add-date="${iso}">
          <div class="cal-head">
            <span class="cal-num">${d.getDate()}${showMonth ? ` <span class="cal-mon">${MONTHS[d.getMonth()]}</span>` : ''}</span>
            <button type="button" class="cal-add" data-add-date="${iso}" aria-label="Add run on ${weekday} ${shortDate(d)}">+</button>
          </div>
          <div class="cal-runs">${runs.map(calRun).join('')}</div>
        </div>`;
    }
    els.grid.innerHTML = html;
  }

  function niceStep(max, targetTicks = 4) {
    const raw = max / targetTicks;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function weeklySeries() {
    const out = [];
    const { start: pStart, days } = period();
    const lastWeek = mondayOf(addDays(pStart, days - 1));
    for (let i = CHART_WEEKS - 1; i >= 0; i--) {
      const start = addDays(lastWeek, -7 * i);
      const runs = runsBetween(toISO(start), toISO(addDays(start, 7)));
      const done = runs.filter((r) => r.status === 'completed');
      out.push({
        start,
        completed: toUnit(done.reduce((s, r) => s + doneKm(r), 0)),
        planned: toUnit(runs.filter((r) => r.status !== 'skipped').reduce((s, r) => s + (r.plannedKm ?? r.actualKm ?? 0), 0)),
        runs: done.length,
      });
    }
    return out;
  }

  function renderChart() {
    const data = weeklySeries();
    const el = els.chart;
    el.querySelectorAll('svg, .chart-empty').forEach((n) => n.remove());
    els.tooltip.hidden = true;
    els.chartSub.textContent = `${shortDate(data[0].start)} – ${shortDate(addDays(data[data.length - 1].start, 6))}`;

    const W = el.clientWidth || 600, H = el.clientHeight || 240;
    const m = { t: 22, r: 8, b: 26, l: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxVal = Math.max(...data.map((d) => d.completed));
    const step = niceStep(Math.max(maxVal, 1));
    const top = Math.max(step, Math.ceil(maxVal / step) * step);
    const y = (v) => m.t + ih - (v / top) * ih;
    const band = iw / data.length;
    const bw = Math.min(24, band * 0.55);
    const ns = 'http://www.w3.org/2000/svg';

    let svg = `<svg xmlns="${ns}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Column chart of weekly distance completed over the last ${CHART_WEEKS} weeks, in ${state.unit === 'km' ? 'kilometres' : 'miles'}">`;
    svg += '<g class="grid">';
    for (let v = 0; v <= top + 1e-9; v += step) {
      const yy = Math.round(y(v)) + 0.5;
      if (v > 0) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`;
      svg += `<text class="tick" x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${fmtNum(v, 1)}</text>`;
    }
    svg += '</g>';
    svg += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${Math.round(y(0)) + 0.5}" y2="${Math.round(y(0)) + 0.5}"/>`;

    const labelEvery = band < 44 ? 2 : 1;
    data.forEach((d, i) => {
      const cx = m.l + band * (i + 0.5);
      const x = cx - bw / 2;
      const base = y(0);
      const h = base - y(d.completed);
      svg += `<rect class="hit" data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" tabindex="0"
                aria-label="Week of ${shortDate(d.start)}: ${fmtNum(d.completed)} ${state.unit} completed of ${fmtNum(d.planned)} planned"/>`;
      svg += `<rect class="bar-hover" x="${m.l + band * i + 2}" y="${m.t}" width="${band - 4}" height="${ih}" rx="6"/>`;
      if (h >= 0.5) {
        const r = Math.min(4, h, bw / 2);
        const yt = base - h;
        svg += `<path class="bar" d="M${x},${base} L${x},${yt + r} Q${x},${yt} ${x + r},${yt} L${x + bw - r},${yt} Q${x + bw},${yt} ${x + bw},${yt + r} L${x + bw},${base} Z"/>`;
      }
      // Selective direct label: only the most recent week's value.
      if (i === data.length - 1 && d.completed > 0) {
        svg += `<text class="bar-label" x="${cx}" y="${y(d.completed) - 6}" text-anchor="middle">${fmtNum(d.completed)}</text>`;
      }
      if (i % labelEvery === (data.length - 1) % labelEvery) {
        svg += `<text class="tick" x="${cx}" y="${H - 6}" text-anchor="middle">${shortDate(d.start)}</text>`;
      }
    });
    svg += '</svg>';
    el.insertAdjacentHTML('beforeend', svg);

    if (data.every((d) => d.completed === 0)) {
      el.insertAdjacentHTML('beforeend', '<div class="chart-empty">Mark runs as done to see your weekly distance.</div>');
    }

    const showTip = (target) => {
      const i = Number(target.dataset.i), d = data[i];
      const cx = m.l + band * (i + 0.5);
      els.tooltip.innerHTML = `
        <strong>Week of ${shortDate(d.start)}</strong>
        <div class="tt-row">Completed <b>${fmtNum(d.completed)} ${state.unit}</b></div>
        <div class="tt-row">Planned <b>${fmtNum(d.planned)} ${state.unit}</b></div>
        <div class="tt-row">Runs done <b>${d.runs}</b></div>`;
      els.tooltip.hidden = false;
      const tw = els.tooltip.offsetWidth;
      const left = Math.min(Math.max(cx, tw / 2 + 4), W - tw / 2 - 4);
      els.tooltip.style.left = `${left}px`;
      els.tooltip.style.top = `${Math.max(y(d.completed), m.t + 40)}px`;
    };
    const hideTip = () => { els.tooltip.hidden = true; };
    el.querySelectorAll('.hit').forEach((h) => {
      h.addEventListener('mouseenter', () => showTip(h));
      h.addEventListener('focus', () => showTip(h));
      h.addEventListener('mouseleave', hideTip);
      h.addEventListener('blur', hideTip);
    });

    els.chartTable.innerHTML = `
      <table>
        <thead><tr><th>Week of</th><th class="num">Completed (${state.unit})</th><th class="num">Planned (${state.unit})</th><th class="num">Runs done</th></tr></thead>
        <tbody>${data.map((d) => `<tr><td>${shortDate(d.start)}</td><td class="num">${fmtNum(d.completed)}</td><td class="num">${fmtNum(d.planned)}</td><td class="num">${d.runs}</td></tr>`).join('')}</tbody>
      </table>`;
  }

  function renderUpcoming() {
    const today = todayISO();
    const next = state.runs.filter((r) => r.status === 'planned' && r.date >= today).sort(sortRuns).slice(0, 6);
    if (!next.length) {
      els.upcoming.innerHTML = '<li class="empty">No upcoming runs planned.</li>';
      return;
    }
    const tomorrow = toISO(addDays(new Date(), 1));
    els.upcoming.innerHTML = next.map((r) => {
      const d = fromISO(r.date);
      const when = r.date === today ? 'Today' : r.date === tomorrow ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });
      return `
        <li><button type="button" data-edit="${r.id}">
          <span class="up-date"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></span>
          <span>
            <span class="up-type" style="--type-color:${typeColor(r.type)}"><i aria-hidden="true"></i>${typeLabel(r.type)}</span>
            <span class="up-when">${when}${r.time ? ` · ${fmtTime(r.time)}` : ''}</span>
          </span>
          <span class="up-dist">${r.plannedKm != null ? fmtDist(r.plannedKm) : ''}</span>
        </button></li>`;
    }).join('');
  }

  // ---------- Dialog ----------
  const f = (name) => els.form.elements[name];

  function openDialog({ id = null, date = null } = {}) {
    state.editingId = id;
    els.form.reset();
    els.formError.hidden = true;
    const run = id ? state.runs.find((r) => r.id === id) : null;
    els.dialogTitle.textContent = run ? 'Edit run' : 'Add run';
    els.deleteBtn.hidden = !run;
    els.repeatField.hidden = !!run;

    const unitVal = (km, p) => (km == null ? '' : String(round(toUnit(km), p)));
    f('date').value = run ? run.date : (date || defaultDate());
    f('time').value = run ? run.time : '';
    f('type').value = run ? run.type : 'easy';
    f('status').value = run ? run.status : (f('date').value < todayISO() ? 'completed' : 'planned');
    f('planned').value = run ? unitVal(run.plannedKm, 2) : '';
    f('actual').value = run ? unitVal(run.actualKm, 2) : '';
    f('duration').value = run && run.durationSec ? fmtDuration(run.durationSec) : '';
    f('notes').value = run ? run.notes : '';
    f('repeat').value = '0';
    syncDialog();
    els.dialog.showModal();
    (run ? f('status') : f('planned')).focus();
  }

  function defaultDate() {
    const today = todayISO();
    const p = period();
    const start = toISO(p.start), end = toISO(addDays(p.start, p.days - 1));
    return today >= start && today <= end ? today : start;
  }

  function syncDialog() {
    const done = f('status').value === 'completed';
    document.querySelectorAll('[data-done-only]').forEach((n) => n.classList.toggle('is-hidden', !done));
    const sec = parseDuration(f('duration').value);
    const dist = Number(f('actual').value) || Number(f('planned').value) || 0;
    els.paceOut.textContent = (sec && dist && fmtPace(sec, fromUnit(dist))) || '–';
  }

  function submitDialog(e) {
    e.preventDefault();
    const err = (msg) => { els.formError.textContent = msg; els.formError.hidden = false; };
    const date = f('date').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err('Please choose a date.');
    const numOrNull = (v) => (v === '' ? null : Number(v));
    const planned = numOrNull(f('planned').value);
    const status = f('status').value;
    const actual = status === 'completed' ? numOrNull(f('actual').value) : null;
    if ([planned, actual].some((v) => v != null && (Number.isNaN(v) || v < 0))) return err('Distances must be positive numbers.');
    const durationSec = status === 'completed' ? parseDuration(f('duration').value) : null;
    if (Number.isNaN(durationSec)) return err('Duration should look like 45:30 or 1:05:00.');
    if (planned == null && actual == null && status !== 'skipped') return err('Add a planned or actual distance.');

    const base = {
      date,
      time: f('time').value,
      type: f('type').value,
      status,
      plannedKm: planned == null ? null : fromUnit(planned),
      actualKm: actual == null ? null : fromUnit(actual),
      durationSec,
      notes: f('notes').value.trim(),
    };

    if (state.editingId) {
      const i = state.runs.findIndex((r) => r.id === state.editingId);
      if (i >= 0) {
        const prev = state.runs[i];
        // Keep previously logged actuals if the run is moved back to planned/skipped.
        if (status !== 'completed') { base.actualKm = prev.actualKm; base.durationSec = prev.durationSec; }
        state.runs[i] = { ...prev, ...base };
      }
      toast('Run updated');
    } else {
      const repeat = Number(f('repeat').value) || 0;
      for (let w = 0; w <= repeat; w++) {
        const copy = { ...base, id: uid(), date: toISO(addDays(fromISO(date), 7 * w)) };
        if (w > 0) Object.assign(copy, { status: 'planned', actualKm: null, durationSec: null });
        state.runs.push(copy);
      }
      toast(repeat ? `Added ${repeat + 1} runs` : 'Run added');
    }
    save();
    els.dialog.close();
    render();
  }

  function deleteRun() {
    const i = state.runs.findIndex((r) => r.id === state.editingId);
    if (i < 0) return;
    const [removed] = state.runs.splice(i, 1);
    save();
    els.dialog.close();
    render();
    toast('Run deleted', () => { state.runs.push(removed); save(); render(); });
  }

  function toggleDone(id) {
    const r = state.runs.find((x) => x.id === id);
    if (!r) return;
    r.status = r.status === 'completed' ? 'planned' : 'completed';
    save();
    render();
    if (r.status === 'completed') toast(`Nice work! ${typeLabel(r.type)} logged.`, null, 'Add details', () => openDialog({ id }));
  }

  // ---------- Sample plan ----------
  function loadSamplePlan() {
    const monday = mondayOf(new Date());
    const thisMonday = toISO(monday);
    const today = todayISO();
    const weeks = [
      // [day offset, type, km, time]
      [[1, 'easy', 4, '07:00'], [3, 'intervals', 5, '07:00'], [5, 'long', 7, '08:30']],
      [[1, 'easy', 5, '07:00'], [3, 'tempo', 5, '07:00'], [5, 'long', 8, '08:30'], [6, 'recovery', 3, '']],
      [[1, 'easy', 5, '07:00'], [3, 'intervals', 6, '07:00'], [5, 'long', 9, '08:30'], [6, 'recovery', 3, '']],
      [[1, 'easy', 4, '07:00'], [3, 'tempo', 4, '07:00'], [6, 'race', 10, '08:00']],
    ];
    const runs = [];
    // Two past weeks of history so the chart has something to show.
    for (let w = -2; w < weeks.length; w++) {
      const plan = weeks[Math.max(0, w)];
      plan.forEach(([off, type, km, time]) => {
        const date = toISO(addDays(monday, w * 7 + off));
        const past = date < today;
        const skipped = past && w === -1 && type === 'recovery';
        const actual = past && !skipped ? round(km * (0.95 + Math.random() * 0.12), 2) : null;
        const paceSec = { easy: 390, long: 405, tempo: 330, intervals: 345, recovery: 420, race: 320 }[type];
        runs.push(normalizeRun({
          id: uid(), date, time, type, plannedKm: km,
          status: skipped ? 'skipped' : past ? 'completed' : 'planned',
          actualKm: actual,
          durationSec: actual ? Math.round(actual * paceSec) : null,
          notes: type === 'race' && date >= thisMonday ? 'Goal race – 10K' : '',
        }));
      });
    }
    state.runs = runs;
    save();
    render();
    toast('Sample plan loaded. Edit or delete anything.');
  }

  // ---------- Import / export ----------
  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'stride', version: 1, exportedAt: new Date().toISOString(), runs: [...state.runs].sort(sortRuns) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stride-runs-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.runs) ? parsed.runs : null;
        if (!list) throw new Error('bad');
        const runs = list.map(normalizeRun).filter(Boolean);
        if (state.runs.length && !confirm(`Replace your ${state.runs.length} current runs with ${runs.length} imported runs?`)) return;
        state.runs = runs;
        save();
        render();
        toast(`Imported ${runs.length} run${runs.length === 1 ? '' : 's'}`);
      } catch {
        toast('That file does not look like a Stride export.');
      }
    };
    reader.readAsText(file);
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg, undo = null, actionLabel = 'Undo', action = undo) {
    clearTimeout(toastTimer);
    els.toast.innerHTML = `<span>${escapeHTML(msg)}</span>${action ? `<button type="button">${escapeHTML(actionLabel)}</button>` : ''}`;
    els.toast.hidden = false;
    if (action) els.toast.querySelector('button').addEventListener('click', () => { els.toast.hidden = true; action(); }, { once: true });
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, action ? 6000 : 3000);
  }

  // ---------- Events ----------
  function bind() {
    els.typeSelect.innerHTML = TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');

    $('#add-btn').addEventListener('click', () => openDialog());
    const shift = (dir) => {
      if (state.view === 'week') state.weekStart = addDays(state.weekStart, 7 * dir);
      else state.rangeStart = addDays(state.rangeStart, RANGE_DAYS * dir);
      render();
    };
    $('#prev-week').addEventListener('click', () => shift(-1));
    $('#next-week').addEventListener('click', () => shift(1));
    $('#today-btn').addEventListener('click', () => {
      state.weekStart = mondayOf(new Date());
      state.rangeStart = fromISO(todayISO());
      render();
    });
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      if (state.view === b.dataset.view) return;
      // Keep roughly the same dates on screen when switching views.
      if (b.dataset.view === 'days30') {
        const thisWeek = toISO(state.weekStart) === toISO(mondayOf(new Date()));
        state.rangeStart = thisWeek ? fromISO(todayISO()) : new Date(state.weekStart);
      } else {
        const today = fromISO(todayISO());
        const inRange = today >= state.rangeStart && today < addDays(state.rangeStart, RANGE_DAYS);
        state.weekStart = mondayOf(inRange ? today : state.rangeStart);
      }
      state.view = b.dataset.view;
      save();
      render();
    }));
    document.querySelectorAll('[data-unit]').forEach((b) => b.addEventListener('click', () => { state.unit = b.dataset.unit; save(); render(); }));
    $('#export-btn').addEventListener('click', exportData);
    $('#import-input').addEventListener('change', (e) => { const file = e.target.files[0]; if (file) importData(file); e.target.value = ''; });

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle],[data-edit],[data-add-date],[data-action]');
      if (!t) return;
      if (t.dataset.toggle) { e.stopPropagation(); toggleDone(t.dataset.toggle); }
      else if (t.dataset.edit) openDialog({ id: t.dataset.edit });
      else if (t.dataset.addDate) openDialog({ date: t.dataset.addDate });
      else if (t.dataset.action === 'sample') loadSamplePlan();
      else if (t.dataset.action === 'add') openDialog();
    });
    els.grid.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.run[data-edit]')) { e.preventDefault(); openDialog({ id: e.target.dataset.edit }); }
    });

    els.form.addEventListener('submit', submitDialog);
    els.form.addEventListener('input', syncDialog);
    els.form.addEventListener('change', syncDialog);
    $('#cancel-btn').addEventListener('click', () => els.dialog.close());
    $('#dialog-close').addEventListener('click', () => els.dialog.close());
    els.deleteBtn.addEventListener('click', deleteRun);
    els.dialog.addEventListener('click', (e) => { if (e.target === els.dialog) els.dialog.close(); });

    document.addEventListener('keydown', (e) => {
      if (els.dialog.open || e.target.matches('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') $('#prev-week').click();
      else if (e.key === 'ArrowRight') $('#next-week').click();
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); openDialog(); }
      else if (e.key.toLowerCase() === 't') $('#today-btn').click();
    });

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderChart, 120); });
    window.addEventListener('storage', (e) => { if (e.key === RUNS_KEY || e.key === SETTINGS_KEY) { load(); render(); } });
  }

  load();
  bind();
  render();
})();

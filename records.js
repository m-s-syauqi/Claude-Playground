// Personal records, worked out from the runs logged in Stride.
//
// Stride keeps each run's total distance and time, not splits, so a distance
// record (5K, 10K, …) comes from runs of about that distance: from 2% short to
// 10% over, timed at that run's pace over the exact distance.
(function (root) {
  'use strict';

  const DAY = 864e5;
  const DISTANCES = [
    { key: '3k', label: '3K', km: 3 },
    { key: '5k', label: '5K', km: 5 },
    { key: '10k', label: '10K', km: 10 },
    { key: 'half', label: 'Half marathon', km: 21.0975 },
    { key: 'marathon', label: 'Marathon', km: 42.195 },
  ];
  const MIN_PACE_KM = 2; // fastest-pace record ignores very short runs

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const mondayOf = (s) => { const d = fromISO(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const kmOf = (r) => r.actualKm ?? r.plannedKm ?? 0;

  // Keeps the first run to reach a value: a tie doesn't take a record away.
  function best(list, score, better) {
    let top = null;
    for (const x of list) {
      const v = score(x);
      if (v == null || Number.isNaN(v)) continue;
      if (!top || better(v, top.value)) top = { value: v, item: x };
    }
    return top;
  }

  function compute(runs, today = iso(new Date())) {
    const done = runs.filter((r) => r.status === 'completed' && kmOf(r) > 0)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    const timed = done.filter((r) => r.durationSec > 0);
    const out = { count: done.length, totalKm: 0, totalSec: 0, distances: {} };
    for (const r of done) { out.totalKm += kmOf(r); out.totalSec += r.durationSec || 0; }

    for (const d of DISTANCES) {
      const fits = timed.filter((r) => kmOf(r) >= d.km * 0.98 && kmOf(r) <= d.km * 1.1);
      const top = best(fits, (r) => r.durationSec / kmOf(r), (a, b) => a < b);
      out.distances[d.key] = top && { ...d, run: top.item, pace: top.value, sec: top.value * d.km, tries: fits.length };
    }

    const longest = best(done, kmOf, (a, b) => a > b);
    const longestTime = best(timed, (r) => r.durationSec, (a, b) => a > b);
    const fastest = best(timed.filter((r) => kmOf(r) >= MIN_PACE_KM), (r) => r.durationSec / kmOf(r), (a, b) => a < b);
    out.longest = longest && { run: longest.item, km: longest.value };
    out.longestTime = longestTime && { run: longestTime.item, sec: longestTime.value };
    out.fastest = fastest && { run: fastest.item, pace: fastest.value };

    // Weeks (Monday to Sunday) and months.
    const weeks = new Map(), months = new Map();
    for (const r of done) {
      const w = mondayOf(r.date), m = r.date.slice(0, 7);
      const wk = weeks.get(w) || { start: w, km: 0, runs: 0 };
      wk.km += kmOf(r); wk.runs += 1; weeks.set(w, wk);
      const mo = months.get(m) || { month: m, km: 0, runs: 0 };
      mo.km += kmOf(r); mo.runs += 1; months.set(m, mo);
    }
    const wl = [...weeks.values()].sort((a, b) => a.start.localeCompare(b.start));
    const ml = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
    const bigWeek = best(wl, (w) => w.km, (a, b) => a > b + 1e-9);
    const busyWeek = best(wl, (w) => w.runs, (a, b) => a > b);
    const bigMonth = best(ml, (m) => m.km, (a, b) => a > b + 1e-9);
    out.bigWeek = bigWeek && bigWeek.item;
    out.busyWeek = busyWeek && busyWeek.item;
    out.bigMonth = bigMonth && bigMonth.item;

    // Streaks: days in a row, and weeks in a row with at least one run.
    const days = [...new Set(done.map((r) => r.date))];
    const run = (list, step) => {
      let longestRun = null, cur = null;
      for (const x of list) {
        if (cur && Math.round((fromISO(x) - fromISO(cur.end)) / DAY) === step) { cur.end = x; cur.len += 1; }
        else cur = { start: x, end: x, len: 1 };
        if (!longestRun || cur.len > longestRun.len) longestRun = { ...cur };
      }
      return { longest: longestRun, last: cur };
    };
    const ds = run(days, 1);
    const ws = run(wl.map((w) => w.start), 7);
    const yesterday = iso(new Date(fromISO(today).getTime() - DAY));
    const thisWeek = mondayOf(today), lastWeek = mondayOf(iso(new Date(fromISO(thisWeek).getTime() - DAY)));
    out.dayStreak = ds.longest;
    out.dayStreakNow = ds.last && (ds.last.end === today || ds.last.end === yesterday) ? ds.last.len : 0;
    out.weekStreak = ws.longest;
    out.weekStreakNow = ws.last && (ws.last.end === thisWeek || ws.last.end === lastWeek) ? ws.last.len : 0;
    return out;
  }

  // Records improved by the latest change (before → after), for a celebration toast.
  function improved(before, after) {
    if (!before) return [];
    const got = [];
    for (const d of DISTANCES) {
      const a = after.distances[d.key], b = before.distances[d.key];
      if (a && (!b || a.sec < b.sec - 0.5)) got.push(d.label);
    }
    if (after.longest && (!before.longest || after.longest.km > before.longest.km + 1e-9)) got.push('Longest run');
    if (after.fastest && (!before.fastest || after.fastest.pace < before.fastest.pace - 0.05)) got.push('Fastest pace');
    if (after.longestTime && (!before.longestTime || after.longestTime.sec > before.longestTime.sec)) got.push('Longest time');
    if (after.bigWeek && (!before.bigWeek || after.bigWeek.km > before.bigWeek.km + 1e-9)) got.push('Biggest week');
    return got;
  }

  const api = { compute, improved, DISTANCES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StrideRecords = api;
})(typeof window !== 'undefined' ? window : globalThis);

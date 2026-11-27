// Suggests the next run from the runs already logged, with the reasons behind it.
// Simple, explainable training rules; everything runs in the browser.
(function (root) {
  'use strict';

  const DAY = 864e5;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / DAY);
  const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const half = (km) => Math.max(1, Math.round(km * 2) / 2); // nearest 0.5 km
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);

  const kmOf = (r) => r.actualKm ?? r.plannedKm ?? 0;
  const paceOf = (r) => (r.durationSec && kmOf(r) ? r.durationSec / kmOf(r) : null);
  const hrOf = (r) => { const m = /\bHR\s*(\d{2,3})/i.exec(r.notes || ''); return m ? Number(m[1]) : null; };

  /**
   * runs: Stride runs. now: Date. fmt: { dist(km), pace(secPerKm), day(iso) } → strings.
   * Returns { kind, type, date, km, paceMin, paceMax, minutes, title, summary, reasons[] }.
   * kind: 'first' | 'rest' | 'recovery' | 'comeback' | 'easy' | 'long' | 'tempo'.
   */
  function suggest(runs, now, fmt) {
    const today = iso(now);
    const done = runs.filter((r) => r.status === 'completed' && kmOf(r) > 0 && r.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    const ranToday = done.some((r) => r.date === today);
    const date = ranToday ? iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)) : today;
    const when = fmt.day(date);
    const planned = runs.find((r) => r.status === 'planned' && r.date === date);
    const reasons = [];
    const out = (o) => {
      if (planned && o.kind !== 'first') reasons.push(`You already planned a ${fmt.dist(kmOf(planned))} run for ${when.toLowerCase()}. Treat this as a check on that plan.`);
      const mid = o.paceMin && o.paceMax ? (o.paceMin + o.paceMax) / 2 : null;
      return { date, when, minutes: o.km && mid ? Math.round((o.km * mid) / 60) : null, reasons, ...o };
    };

    if (!done.length) {
      reasons.push('There are no completed runs logged yet, so start gently.');
      reasons.push('Run at a pace where you can talk in full sentences. Walking breaks are fine.');
      return out({ kind: 'first', type: 'easy', km: 2.5, title: 'Easy first run', summary: '20–25 minutes, easy' });
    }

    const window = (days) => done.filter((r) => daysBetween(r.date, date) >= 1 && daysBetween(r.date, date) <= days);
    const last = done[done.length - 1];
    const sinceLast = daysBetween(last.date, date);
    const last7 = window(7), last28 = window(28);
    // Weekly average over the last 4 weeks, or over the history there is if shorter.
    const weeks = clamp(daysBetween(done[0].date, date) / 7, 1, 4);
    const vol7 = sum(last7.map(kmOf)), avg4 = sum(last28.map(kmOf)) / weeks;
    const recent = done.slice(-10);
    const typical = median(recent.map(kmOf));
    const longest28 = Math.max(...(last28.length ? last28 : recent).map(kmOf));
    const paces = recent.map(paceOf).filter(Boolean);
    const basePace = median(paces);
    const fastest = Math.min(...recent.filter((r) => kmOf(r) >= 2).map(paceOf).filter(Boolean), Infinity);
    const isLong = (r) => r.type === 'long' || kmOf(r) >= Math.max(typical * 1.3, typical + 1.5);
    const isFast = (r) => ['tempo', 'intervals', 'race'].includes(r.type) || (basePace && paceOf(r) && paceOf(r) <= basePace - 15);
    let streak = 0;
    for (let d = 1; done.some((r) => daysBetween(r.date, date) === d); d++) streak++;

    const range = (lo, hi) => (basePace ? { paceMin: Math.round(basePace + lo), paceMax: Math.round(basePace + hi) } : {});
    const ago = daysBetween(last.date, today);
    const lastLine = `Your last run was ${ago === 0 ? 'today' : ago === 1 ? 'yesterday' : `${ago} days ago`}: ${fmt.dist(kmOf(last))}${paceOf(last) ? ` at ${fmt.pace(paceOf(last))}` : ''}.`;
    const volLine = `Last 7 days: ${fmt.dist(vol7)} in ${last7.length} run${last7.length === 1 ? '' : 's'}. Your ${weeks >= 4 ? '4-week ' : ''}average is ${fmt.dist(avg4)} a week.`;
    const hrs = recent.map(hrOf).filter(Boolean);
    const hard = hrs.filter((h) => h >= 150).length;
    const hrLine = hrs.length >= 4 && hard / hrs.length >= 0.6
      ? `${hard === hrs.length ? 'All' : hard} of your last ${hrs.length} runs with heart rate logged averaged 150 bpm or more. Keep this one truly easy: if you can't talk in full sentences, slow down.`
      : null;

    // 1. Too much, too soon: several days in a row, or a sudden jump in weekly distance.
    if (streak >= 3) {
      reasons.push(`You've run ${streak} days in a row. A rest day lets your legs absorb the training.`);
      reasons.push(volLine);
      return out({ kind: 'rest', type: null, km: null, title: 'Rest day', summary: 'No run. A walk or light stretching is fine.' });
    }
    if (avg4 > 0 && last28.length >= 4 && vol7 > avg4 * 1.5) {
      const km = half(clamp(typical * 0.6, 2, 4));
      reasons.push(`${volLine} That's ${Math.round((vol7 / avg4) * 100 - 100)}% above your average, a big jump in one week.`);
      reasons.push('Sharp increases are a common cause of injury, so keep the next run short and very easy.');
      reasons.push(lastLine);
      if (hrLine) reasons.push(hrLine);
      return out({ kind: 'recovery', type: 'recovery', km, ...range(45, 75), title: 'Short recovery run', summary: 'Very easy, or take a rest day if your legs feel heavy' });
    }

    // 2. Coming back after a break.
    if (sinceLast >= 10) {
      const km = half(clamp(typical * 0.7, 2, 6));
      reasons.push(`${lastLine} After a break of ${sinceLast} days, ease back in.`);
      reasons.push(`This is about 70% of your usual ${fmt.dist(typical)}, at an easy pace.`);
      if (hrLine) reasons.push(hrLine);
      return out({ kind: 'comeback', type: 'easy', km, ...range(20, 45), title: 'Easy comeback run', summary: 'Shorter than usual, easy pace' });
    }

    // 3. Day after a hard or long run: easy.
    if (sinceLast <= 1 && (isFast(last) || isLong(last))) {
      const km = half(clamp(typical * 0.8, 2, 8));
      reasons.push(`${lastLine} That was a ${isLong(last) ? 'long' : 'fast'} run, so the next one should be easy.`);
      reasons.push(volLine);
      if (hrLine) reasons.push(hrLine);
      return out({ kind: 'easy', type: 'easy', km, ...range(20, 45), title: 'Easy run', summary: 'Relaxed, conversational pace' });
    }

    // 4. No long run this week.
    if (last28.length >= 3 && !last7.some(isLong) && sinceLast >= 1) {
      const km = half(clamp(longest28 * 1.1, typical * 1.3, longest28 + 1.5));
      reasons.push(`You haven't done a long run in the last 7 days. Your longest in the past 4 weeks is ${fmt.dist(longest28)}; this is about 10% further.`);
      reasons.push('A weekly long, slow run builds endurance more than anything else. Go slower than usual.');
      reasons.push(lastLine);
      if (hrLine) reasons.push(hrLine);
      return out({ kind: 'long', type: 'long', km, ...range(30, 60), title: 'Long, easy run', summary: 'Slow and steady, the furthest run of your week' });
    }

    // 5. No faster run this week.
    if (last28.length >= 4 && !last7.some(isFast) && sinceLast >= 1 && Number.isFinite(fastest)) {
      const km = half(clamp(typical * 0.7, 3, 5));
      reasons.push(`None of your runs in the last 7 days was faster than your usual ${fmt.pace(basePace)}. One quicker run a week improves speed.`);
      reasons.push(`Your fastest recent run of 2 km or more was at ${fmt.pace(fastest)}. Aim for about that, after 10 minutes of easy warm-up.`);
      reasons.push(lastLine);
      return out({ kind: 'tempo', type: 'tempo', km, paceMin: Math.round(fastest), paceMax: Math.round(fastest + 10), title: 'Tempo run', summary: 'Warm up, then comfortably hard' });
    }

    // 6. Default: an easy run sized to grow the week by about 10%.
    const target = avg4 * 1.1;
    const left = target - vol7;
    const km = half(clamp(left > 0 ? left : typical * 0.8, typical * 0.8, typical * 1.2));
    reasons.push(lastLine);
    reasons.push(left > 0
      ? `${volLine} ${fmt.dist(km)} brings your week close to ${fmt.dist(target)}, about 10% more than average.`
      : `${volLine} You're already above your usual week, so keep this one easy.`);
    if (hrLine) reasons.push(hrLine);
    return out({ kind: 'easy', type: 'easy', km, ...range(20, 45), title: 'Easy run', summary: 'Relaxed, conversational pace' });
  }

  const api = { suggest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StrideCoach = api;
})(typeof window !== 'undefined' ? window : globalThis);

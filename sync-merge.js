// Merge rules for syncing runs between devices. Used by the app (browser) and by
// the sync function (api/sync.js), so both sides agree.
//
// A document is { runs: [...], deleted: [{ id, updatedAt }] }. Every run carries
// updatedAt (ms). For each id the newest version wins; a deletion wins over a
// run that is not newer than it.
(function (root) {
  'use strict';

  const MAX_RUNS = 10000;
  const MAX_DELETED = 20000;
  const TYPES = ['easy', 'long', 'tempo', 'intervals', 'recovery', 'race'];
  const STATUSES = ['planned', 'completed', 'skipped'];

  const ts = (x) => (x && typeof x.updatedAt === 'number' && Number.isFinite(x.updatedAt) ? x.updatedAt : 0);
  // Newer wins; on an exact tie pick deterministically so every device ends up the same.
  const newer = (a, b) => ts(a) > ts(b) || (ts(a) === ts(b) && JSON.stringify(a) > JSON.stringify(b));

  function mergeDocs(...docs) {
    const runs = new Map(), dead = new Map();
    for (const d of docs) {
      if (!d) continue;
      for (const r of d.runs || []) {
        if (!r || typeof r.id !== 'string') continue;
        const cur = runs.get(r.id);
        if (!cur || newer(r, cur)) runs.set(r.id, r);
      }
      for (const t of d.deleted || []) {
        if (!t || typeof t.id !== 'string') continue;
        const cur = dead.get(t.id);
        if (!cur || ts(t) > ts(cur)) dead.set(t.id, { id: t.id, updatedAt: ts(t) });
      }
    }
    for (const [id, t] of dead) {
      const r = runs.get(id);
      if (r && ts(r) > ts(t)) dead.delete(id);
      else runs.delete(id);
    }
    return { runs: [...runs.values()], deleted: [...dead.values()] };
  }

  // Keep only known fields with the right types (used by the server on input).
  function cleanDoc(doc) {
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
    const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
    const runs = (Array.isArray(doc && doc.runs) ? doc.runs : []).slice(0, MAX_RUNS)
      .filter((r) => r && typeof r.id === 'string' && r.id.length <= 100 && /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .map((r) => ({
        id: r.id,
        date: r.date,
        time: /^\d{2}:\d{2}$/.test(r.time) ? r.time : '',
        type: TYPES.includes(r.type) ? r.type : 'easy',
        status: STATUSES.includes(r.status) ? r.status : 'planned',
        plannedKm: num(r.plannedKm),
        actualKm: num(r.actualKm),
        durationSec: num(r.durationSec),
        notes: str(r.notes, 2000),
        updatedAt: ts(r),
      }));
    const deleted = (Array.isArray(doc && doc.deleted) ? doc.deleted : []).slice(0, MAX_DELETED)
      .filter((t) => t && typeof t.id === 'string' && t.id.length <= 100)
      .map((t) => ({ id: t.id, updatedAt: ts(t) }));
    return { runs, deleted };
  }

  const api = { mergeDocs, cleanDoc, MAX_RUNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StrideMerge = api;
})(typeof window !== 'undefined' ? window : globalThis);

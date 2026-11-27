'use strict';
/* Gerak: agenda per jam yang disusun sehari sebelumnya, review tiap jam,
   hadiah, skill ber-level, dan peliharaan virtual. Semua data di localStorage. */
(() => {
  const STORE_KEY = 'gerak-v1';
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const REVIEW_OPEN_MIN = 50;   // review dibuka di menit ke-50
  const ON_TIME_MIN = 60;       // tepat waktu = paling lambat 60 menit setelah jam selesai
  const PLAN_DAYS_AHEAD = 7;

  // ---------- util ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const pad = (n) => String(n).padStart(2, '0');

  // ?now=2026-11-27T09:55 menggeser jam aplikasi (untuk mencoba alur review).
  let timeOffset = 0;
  const qNow = new URLSearchParams(location.search).get('now');
  if (qNow) { const t = new Date(qNow); if (!isNaN(t)) timeOffset = t.getTime() - Date.now(); }
  const now = () => new Date(Date.now() + timeOffset);

  const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const fmtDate = (k) => { const d = parseKey(k); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = (k) => { const d = parseKey(k); return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const fmtHour = (h) => `${pad(h)}:00`;
  const slotLabel = (h) => `${fmtHour(h)}–${fmtHour(h + 1)}`;
  const slotStart = (date, h) => { const d = parseKey(date); d.setHours(h, 0, 0, 0); return d.getTime(); };
  const fmtTime = (iso) => { const d = new Date(iso); return `${fmtShort(dkey(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  // ---------- game data ----------
  const DEFAULT_SKILLS = [
    { id: 'inggris', name: 'Bahasa Inggris', icon: '🌐' },
    { id: 'excel', name: 'Excel', icon: '📊' },
    { id: 'bicara', name: 'Berbicara', icon: '🎤' },
    { id: 'menulis', name: 'Menulis', icon: '✍️' },
    { id: 'olahraga', name: 'Olahraga', icon: '🏃' },
    { id: 'teknik', name: 'Process Engineering', icon: '⚙️' },
  ];
  const ICONS = ['🌐', '🗣️', '📊', '🎤', '✍️', '🏃', '⚙️', '💻', '📚', '🧮', '🧠', '💼', '🎨', '🎸', '📷', '🍳', '🧘', '🏊', '🚴', '♟️', '🕌', '💰', '🔬', '🎯'];
  const COLORS = {
    hijau: { body: '#5fc98d', shade: '#3ea86c', belly: '#d2f3df', name: 'Hijau' },
    biru: { body: '#5ea9ef', shade: '#3a86cf', belly: '#d8ebfd', name: 'Biru' },
    oranye: { body: '#f4a35e', shade: '#d6813c', belly: '#fde5cd', name: 'Oranye' },
    ungu: { body: '#a98cf0', shade: '#8667d6', belly: '#e9e0fd', name: 'Ungu' },
    pink: { body: '#f28db6', shade: '#d46a96', belly: '#fde3ee', name: 'Pink' },
  };
  const REWARD = {
    sesuai: { xp: 20, coins: 10, senang: 6, label: 'Sesuai' },
    sebagian: { xp: 8, coins: 4, senang: 2, label: 'Sebagian' },
    meleset: { xp: 0, coins: 0, senang: -6, label: 'Meleset' },
  };
  const ON_TIME_BONUS = 2;
  const STAGES = [
    { name: 'Telur', min: 0, desc: 'Menunggu menetas' },
    { name: 'Bayi', min: 40, desc: 'Baru menetas, masih mungil' },
    { name: 'Anak', min: 300, desc: 'Tumbuh tunas di kepala' },
    { name: 'Remaja', min: 1000, desc: 'Mulai punya tangan, makin lincah' },
    { name: 'Dewasa', min: 2500, desc: 'Atlet sejati dengan ikat kepala' },
    { name: 'Legenda', min: 5000, desc: 'Bermahkota, bersinar' },
  ];
  const SHOP = [
    { id: 'buah', name: 'Buah Segar', icon: '🍎', price: 8, kind: 'food', kenyang: 15, senang: 5, desc: 'Kenyang +15 · Senang +5' },
    { id: 'nasi', name: 'Nasi Uduk', icon: '🍚', price: 15, kind: 'food', kenyang: 35, senang: 0, desc: 'Kenyang +35' },
    { id: 'kue', name: 'Kue Lapis', icon: '🍰', price: 20, kind: 'food', kenyang: 20, senang: 15, desc: 'Kenyang +20 · Senang +15' },
    { id: 'bola', name: 'Main Bola', icon: '⚽', price: 20, kind: 'play', kenyang: -5, senang: 30, desc: 'Senang +30 · Kenyang −5' },
    { id: 'obat', name: 'Obat', icon: '💊', price: 40, kind: 'med', desc: 'Menyembuhkan sakit' },
    { id: 'kacamata', name: 'Kacamata Hitam', icon: '🕶️', price: 120, kind: 'wear', desc: 'Aksesori, dipakai selamanya' },
    { id: 'topi', name: 'Topi', icon: '🧢', price: 150, kind: 'wear', desc: 'Aksesori, dipakai selamanya' },
    { id: 'syal', name: 'Syal', icon: '🧣', price: 200, kind: 'wear', desc: 'Aksesori, dipakai selamanya' },
  ];
  const RANKS = [[1, 'Pemula'], [3, 'Pelajar'], [5, 'Terampil'], [8, 'Mahir'], [12, 'Ahli'], [16, 'Master'], [20, 'Grandmaster']];
  const PLAYER_TITLES = [[1, 'Pemalas Insaf'], [3, 'Penjadwal'], [5, 'Disiplin'], [8, 'Konsisten'], [12, 'Produktif'], [16, 'Mesin Waktu'], [20, 'Legenda Gerak']];
  const skillCost = (L) => 60 + 40 * (L - 1);
  const playerCost = (L) => 100 + 60 * (L - 1);
  function levelInfo(xp, cost) {
    let L = 1; let rem = xp;
    while (rem >= cost(L)) { rem -= cost(L); L++; }
    return { level: L, into: rem, need: cost(L), pct: rem / cost(L) };
  }
  const pick = (table, L) => table.filter((r) => L >= r[0]).pop()[1];
  const stageOf = (xp) => { let i = 0; STAGES.forEach((s, j) => { if (xp >= s.min) i = j; }); return i; };

  // ---------- state ----------
  function defaultState() {
    const t = now();
    return {
      version: 1,
      onboarded: false,
      createdAt: t.toISOString(),
      settings: { startHour: 5, endHour: 22, notify: false },
      plans: {},
      reviews: {},
      days: {},
      skills: DEFAULT_SKILLS.map((s) => ({ ...s, xp: 0 })),
      xp: 0,
      coins: 20,
      pet: { name: 'Gerak', color: 'hijau', kenyang: 80, senang: 80, sick: false, born: dkey(t), hatchedAt: null, lastTick: t.toISOString(), owned: [], worn: [] },
      streak: { current: 0, best: 0, lastDay: null },
      log: [],
      notified: {},
    };
  }
  function hydrate(raw) {
    const base = defaultState();
    return { ...base, ...raw, settings: { ...base.settings, ...raw.settings }, pet: { ...base.pet, ...raw.pet }, streak: { ...base.streak, ...raw.streak } };
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && raw.version === 1) return hydrate(raw);
    } catch (e) { /* data rusak: mulai baru */ }
    return defaultState();
  }
  let state = load();
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast('Gagal menyimpan data di perangkat ini.', 'bad'); } };
  // Perubahan dari tindakan pengguna: simpan lalu kirim ke cloud jika sinkron aktif.
  const commit = () => { save(); markDirty(); };

  const isAwake = (h) => h >= state.settings.startHour && h < state.settings.endHour;
  const activeHours = () => { const a = []; for (let h = state.settings.startHour; h < state.settings.endHour; h++) a.push(h); return a; };
  const plannedHours = (date) => Object.keys(state.plans[date] || {}).map(Number).sort((a, b) => a - b);
  const hoursFor = (date) => [...new Set([...activeHours(), ...plannedHours(date)])].sort((a, b) => a - b);
  const skillById = (id) => state.skills.find((s) => s.id === id);
  const dayRec = (date) => (state.days[date] ||= { coins: 0, xp: 0 });

  function addLog(text, icon = '•') {
    state.log.unshift({ at: now().toISOString(), text, icon });
    state.log.length = Math.min(state.log.length, 80);
  }

  function slotState(date, h, t) {
    const plan = state.plans[date]?.[h];
    const rev = state.reviews[date]?.[h];
    const start = slotStart(date, h); const end = start + HOUR; const tm = t.getTime();
    if (rev) return 'reviewed';
    if (!plan) return tm >= end ? 'free-past' : tm >= start ? 'free-now' : 'free';
    if (tm < start) return 'upcoming';
    if (tm < start + REVIEW_OPEN_MIN * MIN) return 'now';
    if (tm <= end + ON_TIME_MIN * MIN) return 'due';
    return 'late';
  }
  const pendingSlots = (t) => { const d = dkey(t); return plannedHours(d).filter((h) => ['due', 'late'].includes(slotState(d, h, t))); };

  function comboBefore(date, hour) {
    let c = 0;
    const hs = plannedHours(date).filter((h) => h < hour).reverse();
    for (const h of hs) { if (state.reviews[date]?.[h]?.status === 'sesuai') c++; else break; }
    return c;
  }
  function currentCombo(date) {
    let c = 0;
    const hs = plannedHours(date).filter((h) => state.reviews[date]?.[h]).reverse();
    for (const h of hs) { if (state.reviews[date][h].status === 'sesuai') c++; else break; }
    return c;
  }
  function streakNow(t) {
    const s = state.streak; const y = addDays(dkey(t), -1);
    return s.lastDay && s.lastDay >= y ? s.current : 0;
  }

  // ---------- simulation ----------
  function tickPet(t) {
    const p = state.pet;
    const stage = stageOf(state.xp);
    let cur = new Date(p.lastTick).getTime();
    if (isNaN(cur) || stage === 0) { p.lastTick = t.toISOString(); return; }
    cur = Math.max(cur, t.getTime() - 72 * HOUR);
    const STEP = 10 * MIN;
    let changed = false;
    while (cur + STEP <= t.getTime()) {
      const awake = isAwake(new Date(cur).getHours());
      p.kenyang = clamp(p.kenyang - (awake ? 3 : 0.5) / 6);
      p.senang = clamp(p.senang - (awake ? 2 : 0.5) / 6);
      cur += STEP; changed = true;
      if (p.kenyang <= 0 && !p.sick) { p.sick = true; addLog(`${p.name} jatuh sakit karena kelaparan.`, '🤒'); }
    }
    if (changed) p.lastTick = new Date(cur).toISOString();
  }

  function finalizeDays(t) {
    const today = dkey(t);
    const pend = Object.keys(state.plans).filter((d) => d < today && !state.days[d]?.finalized).sort();
    for (const d of pend) {
      const hours = plannedHours(d);
      const c = { sesuai: 0, sebagian: 0, meleset: 0, terlewat: 0 };
      hours.forEach((h) => { const r = state.reviews[d]?.[h]; c[r ? r.status : 'terlewat']++; });
      const rec = dayRec(d);
      rec.finalized = true; rec.counts = c; rec.finalBonus = 0;
      if (c.terlewat && stageOf(state.xp) > 0) {
        const pen = Math.min(c.terlewat * 4, 30);
        state.pet.senang = clamp(state.pet.senang - pen);
        addLog(`${c.terlewat} jam tidak direview pada ${fmtShort(d)}. Senang ${state.pet.name} −${pen}.`, '😞');
      }
      const planned = hours.length;
      const qualifies = planned >= 3 && c.sesuai / planned >= 0.7;
      if (qualifies) {
        state.streak.current = state.streak.lastDay === addDays(d, -1) ? state.streak.current + 1 : 1;
        state.streak.lastDay = d;
        state.streak.best = Math.max(state.streak.best, state.streak.current);
        const bonus = 5 * Math.min(state.streak.current, 10);
        state.coins += bonus; rec.coins += bonus; rec.finalBonus += bonus;
        addLog(`Streak ${state.streak.current} hari! Bonus +${bonus} koin.`, '🔥');
        toast(`🔥 Streak ${state.streak.current} hari · +${bonus} koin`, 'good');
      } else {
        state.streak.current = 0;
      }
      if (planned >= 4 && c.sesuai === planned) {
        state.coins += 30; rec.coins += 30; rec.finalBonus += 30;
        addLog(`Hari sempurna (${fmtShort(d)}): semua jam sesuai. Bonus +30 koin.`, '🏆');
        toast('🏆 Hari sempurna kemarin · +30 koin', 'good');
      }
    }
    const tp = plannedHours(today).length;
    if (tp >= 3 && !state.days[today]?.planBonus) {
      const rec = dayRec(today);
      rec.planBonus = true; rec.coins += 10; state.coins += 10;
      addLog(`Agenda hari ini sudah disiapkan kemarin (${tp} jam). +10 koin.`, '🗓');
      toast(`🗓 Agenda hari ini siap sejak kemarin · +10 koin`, 'good');
    }
  }

  function tick() {
    const t = now();
    tickPet(t);
    finalizeDays(t);
    save();
    maybeNotify(t);
  }

  // ---------- rewards ----------
  function snapshot() {
    return { player: levelInfo(state.xp, playerCost).level, stage: stageOf(state.xp), skills: Object.fromEntries(state.skills.map((s) => [s.id, levelInfo(s.xp, skillCost).level])) };
  }
  function announceGrowth(before) {
    const after = snapshot();
    if (after.player > before.player) { const msg = `Level Gerak naik ke ${after.player}!`; toast(`⬆️ ${msg}`, 'level'); addLog(msg, '⬆️'); confetti(); }
    state.skills.forEach((s) => {
      if (before.skills[s.id] && after.skills[s.id] > before.skills[s.id]) {
        const L = after.skills[s.id];
        const msg = `${s.name} naik ke Level ${L} (${pick(RANKS, L)})!`;
        toast(`${s.icon} ${msg}`, 'level'); addLog(msg, s.icon); confetti();
      }
    });
    if (after.stage > before.stage) {
      const st = STAGES[after.stage];
      if (after.stage === 1) {
        state.pet.hatchedAt = now().toISOString(); state.pet.lastTick = now().toISOString();
        state.pet.kenyang = 80; state.pet.senang = 85;
      }
      const msg = after.stage === 1 ? `Telur menetas! Halo, ${state.pet.name}!` : `${state.pet.name} berevolusi menjadi ${st.name}!`;
      toast(`✨ ${msg}`, 'level'); addLog(msg, '✨'); confetti(40);
    }
  }

  function rewardPreview(status, date, hour) {
    const b = REWARD[status];
    const onTime = now().getTime() <= slotStart(date, hour) + HOUR + ON_TIME_MIN * MIN;
    let coins = b.coins + (onTime ? ON_TIME_BONUS : 0);
    let xp = b.xp;
    if (status === 'sesuai') coins += Math.min(comboBefore(date, hour) * 2, 10);
    if (state.pet.sick) xp = Math.round(xp / 2);
    return { xp, coins, onTime };
  }

  function submitReview(date, hour, status, actual) {
    const plan = state.plans[date]?.[hour];
    if (!plan || state.reviews[date]?.[hour]) return;
    const before = snapshot();
    const b = REWARD[status];
    const { xp, coins, onTime } = rewardPreview(status, date, hour);
    const combo = status === 'sesuai' ? comboBefore(date, hour) + 1 : 0;
    const skill = skillById(plan.skill);
    (state.reviews[date] ||= {})[hour] = { status, actual: actual.trim(), at: now().toISOString(), onTime, xp, coins, skill: plan.skill || null };
    state.xp += xp; state.coins += coins;
    if (skill) skill.xp += xp;
    const rec = dayRec(date); rec.coins += coins; rec.xp += xp;
    if (stageOf(state.xp) > 0 && !(state.pet.sick && b.senang > 0)) state.pet.senang = clamp(state.pet.senang + b.senang);
    const parts = [];
    if (xp) parts.push(`+${xp} XP${skill ? ' ' + skill.name : ''}`);
    if (coins) parts.push(`+${coins} koin`);
    addLog(`${slotLabel(hour)} “${plan.title}”: ${b.label}${parts.length ? ' (' + parts.join(', ') + ')' : ''}.`, status === 'sesuai' ? '✅' : status === 'sebagian' ? '🟡' : '❌');
    announceGrowth(before);
    commit();
    render();
    const msg = status === 'meleset' ? `Tercatat. Tidak apa-apa, jam berikutnya pasti bisa!${onTime ? ` (+${coins} koin karena jujur tepat waktu)` : ''}`
      : `${b.label}! ${parts.join(' · ')}${combo > 1 ? ` · Combo ×${combo}` : ''}`;
    toast(msg, status === 'meleset' ? 'bad' : 'good');
    if (coins) floatText(`+${coins} 🪙`);
    petReact(status === 'meleset' ? 'sad' : 'jump');
  }

  // ---------- pet ----------
  function petMood(t) {
    const p = state.pet;
    if (stageOf(state.xp) === 0) return 'telur';
    if (p.sick) return 'sakit';
    if (!isAwake(t.getHours())) return 'tidur';
    if (p.kenyang < 25) return 'lapar';
    if (p.senang < 25) return 'sedih';
    if (p.senang >= 70 && p.kenyang >= 50) return 'gembira';
    return 'biasa';
  }
  const MOOD_LABEL = { telur: 'Di dalam telur', sakit: 'Sakit', tidur: 'Tidur', lapar: 'Lapar', sedih: 'Sedih', gembira: 'Gembira', biasa: 'Santai' };

  function petSpeech(t) {
    const p = state.pet; const today = dkey(t); const stage = stageOf(state.xp);
    if (stage === 0) {
      const need = STAGES[1].min - state.xp;
      return plannedHours(today).length ? `Aku masih di dalam telur. ${need} XP lagi dan aku menetas!` : `Aku menetas setelah ${need} XP. Susun agenda besok dan jalani sesuai rencana ya!`;
    }
    if (p.sick) return 'Aku sakit… tolong belikan obat 🤒';
    if (!isAwake(t.getHours())) return 'Zzz…';
    const pend = pendingSlots(t).length;
    if (pend) return `Ada ${pend} jam yang belum kamu review!`;
    if (p.kenyang < 25) return 'Perutku keroncongan… 🍚';
    if (p.senang < 25) return 'Aku bosan… ajak main dong ⚽';
    if (t.getHours() >= 17 && plannedHours(addDays(today, 1)).length < 3) return 'Agenda besok belum siap. Yuk susun sekarang!';
    const cur = state.plans[today]?.[t.getHours()];
    if (cur) return `Sekarang: ${cur.title}. Semangat!`;
    const next = plannedHours(today).find((h) => h > t.getHours());
    if (next !== undefined) return `Nanti jam ${fmtHour(next)}: ${state.plans[today][next].title}.`;
    const cheers = ['Gerak terus, jangan kasih kendor!', 'Satu jam yang sesuai rencana itu kemenangan kecil.', 'Aku tumbuh bersamamu 🌱', 'Rencana kemarin, aksi hari ini!'];
    return cheers[t.getHours() % cheers.length];
  }

  function eggSVG(c, pct) {
    const cracks = pct > 0.66
      ? '<path d="M70 112 l10 -8 l8 10 l10 -12 l9 9 l10 -10 l12 8" class="crack"/><path d="M88 150 l8 -7 l7 6" class="crack"/>'
      : pct > 0.33 ? '<path d="M78 112 l10 -8 l8 10 l10 -12 l9 9" class="crack"/>' : '';
    return `<ellipse class="pet-shadow" cx="100" cy="185" rx="44" ry="6"/>
      <g class="egg-g${pct > 0.66 ? ' egg-hot' : ''}">
        <path d="M100 50 C138 50 152 116 152 138 C152 167 130 183 100 183 C70 183 48 167 48 138 C48 116 62 50 100 50 Z" fill="#fbf6ea" stroke="#e4d8bf" stroke-width="3"/>
        <circle cx="82" cy="92" r="9" fill="${c.body}" opacity=".75"/><circle cx="118" cy="120" r="12" fill="${c.body}" opacity=".75"/>
        <circle cx="80" cy="146" r="7" fill="${c.body}" opacity=".75"/><circle cx="122" cy="80" r="5" fill="${c.body}" opacity=".75"/>
        ${cracks}
      </g>`;
  }

  function petSVG(stage, mood, colorKey, worn, hatchPct) {
    const c = COLORS[colorKey] || COLORS.hijau;
    const label = `${state.pet.name}, ${STAGES[stage].name}, ${MOOD_LABEL[mood]}`;
    if (stage === 0) return `<svg viewBox="0 0 200 200" class="pet-svg mood-telur" role="img" aria-label="${esc(label)}">${eggSVG(c, hatchPct)}</svg>`;
    const G = [null, { rx: 40, ry: 34, cy: 148 }, { rx: 47, ry: 41, cy: 139 }, { rx: 51, ry: 50, cy: 130 }, { rx: 57, ry: 55, cy: 126 }, { rx: 59, ry: 57, cy: 124 }][stage];
    const { rx, ry, cy } = G; const top = cy - ry;
    const eyeY = cy - ry * 0.16; const eyeDX = rx * 0.38; const er = Math.max(5.5, rx * 0.13);
    const mY = cy + ry * 0.2; const mw = rx * 0.2;
    const ink = '#1f1f29';
    const hasHat = worn.includes('topi');
    let s = `<ellipse class="pet-shadow" cx="100" cy="186" rx="${rx * 0.9}" ry="6"/><g class="pet-g">`;
    if (stage >= 2) {
      s += `<ellipse cx="${100 - rx * 0.45}" cy="${cy + ry - 3}" rx="${rx * 0.27}" ry="9" fill="${c.shade}"/><ellipse cx="${100 + rx * 0.45}" cy="${cy + ry - 3}" rx="${rx * 0.27}" ry="9" fill="${c.shade}"/>`;
    }
    if (stage >= 3) {
      s += `<g class="arm arm-l"><ellipse cx="${100 - rx - 2}" cy="${cy + ry * 0.12}" rx="9" ry="17" transform="rotate(25 ${100 - rx - 2} ${cy + ry * 0.12})" fill="${c.shade}"/></g>`;
      s += `<g class="arm arm-r"><ellipse cx="${100 + rx + 2}" cy="${cy + ry * 0.12}" rx="9" ry="17" transform="rotate(-25 ${100 + rx + 2} ${cy + ry * 0.12})" fill="${c.shade}"/></g>`;
    }
    if (stage >= 2 && !hasHat && stage < 5) {
      s += `<g class="sprout"><path d="M100 ${top + 4} Q98 ${top - 8} 101 ${top - 16}" stroke="#3b9b5a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="111" cy="${top - 19}" rx="11" ry="6" transform="rotate(-25 111 ${top - 19})" fill="#59c06f"/>
        ${stage >= 3 ? `<ellipse cx="90" cy="${top - 15}" rx="9" ry="5" transform="rotate(30 90 ${top - 15})" fill="#4fb064"/>` : ''}</g>`;
    }
    s += `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.body}"/>`;
    s += `<ellipse cx="100" cy="${cy + ry * 0.38}" rx="${rx * 0.62}" ry="${ry * 0.5}" fill="${c.belly}"/>`;
    s += `<ellipse cx="${100 - rx * 0.5}" cy="${cy - ry * 0.55}" rx="${rx * 0.18}" ry="${ry * 0.1}" fill="#fff" opacity=".35" transform="rotate(-30 ${100 - rx * 0.5} ${cy - ry * 0.55})"/>`;
    if (stage >= 4 && !hasHat) {
      s += `<path d="M${100 - rx * 0.8} ${cy - ry * 0.6} Q100 ${cy - ry * 0.86} ${100 + rx * 0.8} ${cy - ry * 0.6}" stroke="#e5484d" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M${100 + rx * 0.78} ${cy - ry * 0.6} l14 -4 M${100 + rx * 0.78} ${cy - ry * 0.6} l12 8" stroke="#e5484d" stroke-width="5" stroke-linecap="round"/>`;
    }
    if (mood === 'sakit') s += `<ellipse cx="100" cy="${cy - ry * 0.1}" rx="${rx * 0.75}" ry="${ry * 0.45}" fill="#9fd36b" opacity=".35"/>`;
    if (['gembira', 'biasa'].includes(mood)) {
      s += `<ellipse cx="${100 - eyeDX - 6}" cy="${eyeY + er + 6}" rx="${er * 0.9}" ry="${er * 0.5}" fill="#ff7aa2" opacity=".45"/><ellipse cx="${100 + eyeDX + 6}" cy="${eyeY + er + 6}" rx="${er * 0.9}" ry="${er * 0.5}" fill="#ff7aa2" opacity=".45"/>`;
    }
    // eyes
    const eye = (x) => {
      switch (mood) {
        case 'gembira': return `<path d="M${x - er} ${eyeY + 2} Q${x} ${eyeY - er * 1.3} ${x + er} ${eyeY + 2}" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
        case 'tidur': return `<path d="M${x - er} ${eyeY} Q${x} ${eyeY + er} ${x + er} ${eyeY}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
        case 'sakit': return `<path d="M${x - er} ${eyeY + 1} L${x + er} ${eyeY + 1}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M${x - er * 0.8} ${eyeY + 1} Q${x} ${eyeY + er * 1.2} ${x + er * 0.8} ${eyeY + 1}" fill="${ink}"/>`;
        case 'sedih': return `<circle cx="${x}" cy="${eyeY + 2}" r="${er * 0.85}" fill="${ink}"/><circle cx="${x - er * 0.3}" cy="${eyeY}" r="${er * 0.3}" fill="#fff"/>`;
        default: return `<circle cx="${x}" cy="${eyeY}" r="${er}" fill="${ink}"/><circle cx="${x - er * 0.35}" cy="${eyeY - er * 0.35}" r="${er * 0.38}" fill="#fff"/>`;
      }
    };
    s += `<g class="eyes">${eye(100 - eyeDX)}${eye(100 + eyeDX)}</g>`;
    if (mood === 'sedih') {
      s += `<path d="M${100 - eyeDX - er} ${eyeY - er - 5} L${100 - eyeDX + er} ${eyeY - er - 1} M${100 + eyeDX + er} ${eyeY - er - 5} L${100 + eyeDX - er} ${eyeY - er - 1}" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
      s += `<path class="tear" d="M${100 + eyeDX + 2} ${eyeY + er + 2} q-4 7 0 10 q4 -3 0 -10z" fill="#6cb8f5"/>`;
    }
    // mouth
    switch (mood) {
      case 'gembira': s += `<path d="M${100 - mw} ${mY} Q100 ${mY + mw * 1.4} ${100 + mw} ${mY} Z" fill="#b8344f"/><path d="M${100 - mw * 0.5} ${mY + mw * 0.55} Q100 ${mY + mw * 0.9} ${100 + mw * 0.5} ${mY + mw * 0.55}" fill="#ff8fa6"/>`; break;
      case 'sedih': case 'sakit': s += `<path d="M${100 - mw * 0.8} ${mY + 5} Q100 ${mY - 3} ${100 + mw * 0.8} ${mY + 5}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`; break;
      case 'lapar': s += `<ellipse cx="100" cy="${mY + 3}" rx="${mw * 0.55}" ry="${mw * 0.7}" fill="#8c2a3f"/><path class="drool" d="M${100 + mw * 0.3} ${mY + 8} q2 8 0 12 q-3 -3 0 -12z" fill="#9fd4f7"/>`; break;
      case 'tidur': s += `<ellipse cx="100" cy="${mY + 2}" rx="${mw * 0.3}" ry="${mw * 0.25}" fill="${ink}" opacity=".7"/>`; break;
      default: s += `<path d="M${100 - mw} ${mY} Q100 ${mY + mw * 0.9} ${100 + mw} ${mY}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    // aksesori
    if (worn.includes('kacamata') && mood !== 'tidur') {
      const gw = er * 2.3; const gh = er * 1.7;
      s += `<g class="acc"><rect x="${100 - eyeDX - gw / 2}" y="${eyeY - gh / 2}" width="${gw}" height="${gh}" rx="${gh * 0.45}" fill="#1b1b24"/><rect x="${100 + eyeDX - gw / 2}" y="${eyeY - gh / 2}" width="${gw}" height="${gh}" rx="${gh * 0.45}" fill="#1b1b24"/>
        <path d="M${100 - eyeDX + gw / 2} ${eyeY - 2} Q100 ${eyeY - 6} ${100 + eyeDX - gw / 2} ${eyeY - 2}" stroke="#1b1b24" stroke-width="3" fill="none"/>
        <path d="M${100 - eyeDX - gw / 4} ${eyeY - gh / 4} l5 0" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>`;
    }
    if (worn.includes('syal')) {
      const y = cy + ry * 0.42; const hw = rx * 0.9;
      s += `<g class="acc"><path d="M${100 - hw} ${y} Q100 ${y + ry * 0.24} ${100 + hw} ${y}" stroke="#e5484d" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M${100 + rx * 0.35} ${y + ry * 0.1} l6 26 l10 -3 l-4 -24z" fill="#c93a3f"/>
        <path d="M${100 - hw + 8} ${y + 3} Q100 ${y + ry * 0.24 + 3} ${100 + hw - 8} ${y + 3}" stroke="#fff" stroke-width="2" stroke-dasharray="4 6" fill="none" opacity=".6"/></g>`;
    }
    if (hasHat) {
      s += `<g class="acc"><path d="M${100 - rx * 0.62} ${top + ry * 0.3} Q${100 - rx * 0.6} ${top - ry * 0.32} 100 ${top - ry * 0.32} Q${100 + rx * 0.6} ${top - ry * 0.32} ${100 + rx * 0.62} ${top + ry * 0.3} Z" fill="#3e63dd"/>
        <path d="M${100 + rx * 0.3} ${top + ry * 0.26} Q${100 + rx * 1.05} ${top + ry * 0.2} ${100 + rx * 1.1} ${top + ry * 0.36} Q${100 + rx * 0.7} ${top + ry * 0.42} ${100 + rx * 0.3} ${top + ry * 0.34} Z" fill="#2f4fbf"/>
        <circle cx="100" cy="${top - ry * 0.3}" r="4" fill="#2f4fbf"/></g>`;
    }
    if (stage === 5 && !hasHat) {
      s += `<g class="crown"><path d="M${100 - 22} ${top + 6} L${100 - 24} ${top - 18} L${100 - 10} ${top - 6} L100 ${top - 24} L${100 + 10} ${top - 6} L${100 + 24} ${top - 18} L${100 + 22} ${top + 6} Z" fill="#f2c14e" stroke="#d59f1f" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="100" cy="${top - 4}" r="3.5" fill="#e5484d"/></g>`;
    }
    s += '</g>';
    if (stage === 5) s += '<g class="sparkles"><path d="M30 60 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z"/><path d="M168 48 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z"/><path d="M170 130 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z"/></g>';
    if (mood === 'tidur') s += `<g class="zzz"><text x="${100 + rx * 0.7}" y="${top + 4}">z</text><text x="${100 + rx * 0.7 + 14}" y="${top - 12}">Z</text></g>`;
    if (mood === 'sakit') s += `<g class="thermo"><rect x="${100 + mw + 2}" y="${mY - 2}" width="22" height="5" rx="2.5" fill="#fff" stroke="#ccc"/><circle cx="${100 + mw + 24}" cy="${mY + 0.5}" r="4" fill="#e5484d"/></g>`;
    return `<svg viewBox="0 0 200 200" class="pet-svg mood-${mood} stage-${stage}" role="img" aria-label="${esc(label)}">${s}</svg>`;
  }

  function meter(label, value, opts = {}) {
    const v = Math.round(value);
    const low = opts.low && v < opts.low;
    return `<div class="meter${low ? ' is-low' : ''}">
      <div class="meter-top"><span>${opts.icon || ''} ${esc(label)}</span><span class="meter-val">${low ? '⚠ ' : ''}${opts.text || v}</span></div>
      <div class="meter-track" role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${clamp(Math.round(opts.pct ?? v))}"><div class="meter-fill" style="width:${clamp(opts.pct ?? v)}%"></div></div>
    </div>`;
  }

  const petSig = {};
  function renderPetCard(el, big) {
    const t = now(); const p = state.pet;
    const stage = stageOf(state.xp); const mood = petMood(t);
    const hatchPct = clamp(state.xp / STAGES[1].min, 0, 1);
    const sig = [stage, mood, p.color, p.worn.join(','), Math.floor(hatchPct * 3), p.name].join('|');
    const speech = petSpeech(t);
    const night = !isAwake(t.getHours());
    if (petSig[el.id] !== sig) {
      petSig[el.id] = sig;
      el.innerHTML = `
        <div class="pet-scene${night ? ' night' : ''}">
          <div class="bubble" data-bubble></div>
          <button type="button" class="pet-btn" data-pet-tap aria-label="Elus ${esc(p.name)}">${petSVG(stage, mood, p.color, p.worn, hatchPct)}</button>
          <div class="float-layer" data-float></div>
        </div>
        <div class="pet-info">
          <div class="pet-name-row"><h2 class="pet-name">${esc(p.name)}</h2><span class="chip">${STAGES[stage].name}</span><span class="chip chip-mood">${MOOD_LABEL[mood]}</span></div>
          <div data-pet-meters></div>
          ${big ? '<p class="muted small" data-pet-age></p>' : ''}
          ${!big ? '<button type="button" class="btn btn-ghost btn-sm" data-goto="pet">Rawat &amp; toko →</button>' : ''}
        </div>`;
    }
    el.querySelector('.pet-scene').classList.toggle('night', night);
    el.querySelector('[data-bubble]').textContent = speech;
    const nextStage = STAGES[stage + 1];
    let meters = '';
    if (stage === 0) {
      meters += meter('Menetas', hatchPct * 100, { icon: '🥚', text: `${state.xp}/${STAGES[1].min} XP` });
    } else {
      meters += meter('Kenyang', p.kenyang, { icon: '🍚', low: 25 });
      meters += meter('Senang', p.senang, { icon: '💛', low: 25 });
      if (nextStage) {
        const prev = STAGES[stage].min;
        meters += meter(`Menuju ${nextStage.name}`, ((state.xp - prev) / (nextStage.min - prev)) * 100, { icon: '✨', text: `${state.xp}/${nextStage.min} XP` });
      }
    }
    if (p.sick) meters += '<p class="warn-line">🤒 Sakit: XP dari review dibagi dua sampai diberi obat.</p>';
    el.querySelector('[data-pet-meters]').innerHTML = meters;
    const age = el.querySelector('[data-pet-age]');
    if (age) {
      const days = Math.floor((parseKey(dkey(t)) - parseKey(p.born)) / 864e5) + 1;
      age.textContent = `Umur ${days} hari · ${stage === 0 ? 'belum menetas' : 'menetas ' + fmtShort(dkey(new Date(p.hatchedAt || p.born)))}`;
    }
  }

  function petReact(kind) {
    $$('.pet-btn').forEach((b) => {
      b.classList.remove('react-jump', 'react-sad', 'react-eat');
      void b.offsetWidth;
      b.classList.add(`react-${kind}`);
    });
  }
  function floatText(text) {
    $$('[data-float]').forEach((layer) => {
      const s = document.createElement('span');
      s.className = 'float-txt'; s.textContent = text;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    });
  }
  function confetti(n = 24) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const cols = ['#5b5bd6', '#f2c14e', '#e5484d', '#3fbf74', '#5ea9ef', '#f28db6'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.style.left = `${Math.random() * 100}%`; c.style.background = cols[i % cols.length];
      c.style.animationDelay = `${Math.random() * 0.3}s`; c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2200);
  }

  // ---------- render: hari ini ----------
  let scrolledToNow = false;
  function renderToday() {
    const t = now(); const today = dkey(t); const tomorrow = addDays(today, 1);
    $('#today-date').textContent = fmtDate(today);
    const planned = plannedHours(today);
    const banners = [];
    const pend = pendingSlots(t);
    if (pend.length) banners.push(`<div class="banner banner-due"><span>⏰ <b>${pend.length} jam</b> menunggu review.</span><button type="button" class="btn btn-primary btn-sm" data-review="${pend[0]}">Review ${fmtHour(pend[0])}</button></div>`);
    if (!planned.length) banners.push(`<div class="banner"><span>Hari ini tidak ada agenda, karena agenda harus disiapkan <b>sehari sebelumnya</b>. Jangan sampai besok kosong juga.</span><button type="button" class="btn btn-primary btn-sm" data-goto="plan">Susun agenda besok</button></div>`);
    else if (t.getHours() >= 17 && plannedHours(tomorrow).length < 3) banners.push(`<div class="banner"><span>🗓 Agenda besok belum siap (${plannedHours(tomorrow).length} jam). Susun sebelum tengah malam.</span><button type="button" class="btn btn-ghost btn-sm" data-goto="plan">Susun sekarang</button></div>`);
    $('#today-banners').innerHTML = banners.join('');

    // stats
    const rev = state.reviews[today] || {};
    const cnt = { sesuai: 0, sebagian: 0, meleset: 0 };
    Object.values(rev).forEach((r) => { cnt[r.status]++; });
    const reviewed = Object.keys(rev).length;
    const rec = state.days[today] || { coins: 0, xp: 0 };
    const combo = currentCombo(today);
    const streak = streakNow(t);
    $('#today-stats').innerHTML = [
      tile('Sesuai rencana', `${cnt.sesuai}<small>/${planned.length}</small>`, reviewed ? `${cnt.sebagian} sebagian · ${cnt.meleset} meleset` : 'belum ada review'),
      tile('Hadiah hari ini', `+${rec.coins}<small> 🪙</small>`, `+${rec.xp} XP`),
      tile('Combo', `×${combo}`, combo >= 2 ? 'bonus koin tiap jam sesuai berturut-turut' : 'sesuai berturut-turut = bonus'),
      tile('Streak', `${streak}<small> hari</small>`, `terbaik ${state.streak.best} · syarat ≥70% sesuai`),
    ].join('');

    // timeline
    const hrs = hoursFor(today);
    $('#timeline').innerHTML = hrs.map((h) => slotRow(today, h, t)).join('');
    if (!scrolledToNow && !$('#panel-today').hidden) {
      const cur = $('#timeline .s-now, #timeline .s-due, #timeline .s-free-now');
      if (cur) { scrolledToNow = true; setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150); }
    }
    renderPetCard($('#today-pet'), false);
  }
  const tile = (label, value, sub) => `<div class="stat"><span class="stat-label">${esc(label)}</span><span class="stat-value">${value}</span><span class="stat-sub">${esc(sub)}</span></div>`;

  function skillChip(id) {
    const s = skillById(id);
    return s ? `<span class="chip chip-skill">${s.icon} ${esc(s.name)}</span>` : '';
  }
  function slotRow(date, h, t) {
    const st = slotState(date, h, t);
    const plan = state.plans[date]?.[h];
    const rev = state.reviews[date]?.[h];
    const title = plan ? esc(plan.title) : '<span class="muted">Tidak direncanakan</span>';
    let meta = plan ? skillChip(plan.skill) : '';
    let action = '';
    let extra = '';
    const startMs = slotStart(date, h);
    switch (st) {
      case 'reviewed': {
        const icons = { sesuai: '✓', sebagian: '~', meleset: '✗' };
        action = `<span class="badge b-${rev.status}">${icons[rev.status]} ${REWARD[rev.status].label}</span>`;
        const gains = [rev.xp ? `+${rev.xp} XP` : '', rev.coins ? `+${rev.coins} 🪙` : ''].filter(Boolean).join(' · ');
        if (gains) meta += `<span class="gain">${gains}</span>`;
        if (!rev.onTime) meta += '<span class="muted small">terlambat</span>';
        if (rev.actual) extra = `<p class="slot-actual">“${esc(rev.actual)}”</p>`;
        break;
      }
      case 'now': {
        const pct = clamp(((t.getTime() - startMs) / HOUR) * 100);
        const opens = new Date(startMs + REVIEW_OPEN_MIN * MIN);
        action = `<span class="muted small">Review ${pad(opens.getHours())}:${pad(opens.getMinutes())}</span>`;
        extra = `<div class="now-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>`;
        meta += '<span class="chip chip-now">Sedang berjalan</span>';
        break;
      }
      case 'due': action = `<button type="button" class="btn btn-primary btn-sm" data-review="${h}">Review</button>`; break;
      case 'late': action = `<button type="button" class="btn btn-ghost btn-sm" data-review="${h}">Review</button>`; meta += '<span class="late-tag">terlambat · tanpa bonus</span>'; break;
      case 'upcoming': action = '<span class="muted small">Nanti</span>'; break;
      case 'free-now': extra = `<div class="now-bar" aria-hidden="true"><i style="width:${clamp(((t.getTime() - startMs) / HOUR) * 100)}%"></i></div>`; break;
      default: break;
    }
    return `<li class="slot s-${st}${plan ? '' : ' is-free'}">
      <div class="slot-time">${fmtHour(h)}</div>
      <div class="slot-body"><div class="slot-title">${title}</div>${meta ? `<div class="slot-meta">${meta}</div>` : ''}${extra}</div>
      <div class="slot-action">${action}</div>
    </li>`;
  }

  // ---------- review dialog ----------
  let reviewing = null;
  function openReview(h) {
    const t = now(); const date = dkey(t);
    const plan = state.plans[date]?.[h];
    if (!plan || state.reviews[date]?.[h]) return;
    const st = slotState(date, h, t);
    if (!['due', 'late'].includes(st)) { toast('Review jam ini dibuka di menit ke-50.'); return; }
    reviewing = { date, h };
    $('#review-title').textContent = `Review ${slotLabel(h)}`;
    $('#review-plan').innerHTML = `<b>${esc(plan.title)}</b> ${skillChip(plan.skill)}`;
    $('#review-form').reset();
    ['sesuai', 'sebagian', 'meleset'].forEach((s) => {
      const r = rewardPreview(s, date, h);
      const parts = [r.xp ? `+${r.xp} XP` : '', r.coins ? `+${r.coins} 🪙` : ''].filter(Boolean);
      $(`[data-rw="${s}"]`).textContent = parts.length ? parts.join(' · ') : (s === 'meleset' ? 'Senang −6' : '');
    });
    const onTime = rewardPreview('sesuai', date, h).onTime;
    const combo = comboBefore(date, h);
    $('#review-hint').textContent = [
      onTime ? `Tepat waktu: +${ON_TIME_BONUS} koin bonus.` : 'Terlambat: tanpa bonus tepat waktu.',
      combo ? `Combo ×${combo} berjalan, sesuai lagi = bonus +${Math.min(combo * 2, 10)} koin.` : '',
      state.pet.sick ? 'Peliharaan sakit: XP dibagi dua.' : '',
    ].filter(Boolean).join(' ');
    $('#review-dialog').returnValue = '';
    $('#review-dialog').showModal();
  }
  $('#review-dialog').addEventListener('close', () => {
    const dlg = $('#review-dialog');
    if (dlg.returnValue === 'ok' && reviewing) {
      const status = $('#review-form').elements.status.value;
      if (status) submitReview(reviewing.date, reviewing.h, status, $('#review-actual').value);
    }
    reviewing = null;
  });

  // ---------- render: rencana ----------
  let planDate = null;
  function renderPlan() {
    const t = now(); const today = dkey(t); const tomorrow = addDays(today, 1);
    if (!planDate || planDate <= today) planDate = tomorrow;
    const maxDate = addDays(today, PLAN_DAYS_AHEAD);
    $('#plan-prev').disabled = planDate <= tomorrow;
    $('#plan-next').disabled = planDate >= maxDate;
    $('#plan-label').textContent = planDate === tomorrow ? 'Rencana besok' : 'Rencana';
    $('#plan-date').textContent = `${fmtDate(planDate)} · terkunci ${fmtShort(planDate)} 00:00`;
    $('#plan-copy').disabled = !plannedHours(today).length;
    const titles = new Set();
    Object.values(state.plans).forEach((p) => Object.values(p).forEach((s) => titles.add(s.title)));
    $('#title-suggest').innerHTML = [...titles].slice(0, 60).map((x) => `<option value="${esc(x)}">`).join('');
    const opts = (sel) => `<option value="">— tanpa skill —</option>${state.skills.map((s) => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${s.icon} ${esc(s.name)}</option>`).join('')}`;
    $('#plan-list').innerHTML = hoursFor(planDate).map((h) => {
      const p = state.plans[planDate]?.[h] || { title: '', skill: '' };
      return `<li class="plan-row${p.title ? ' has' : ''}" data-h="${h}">
        <label class="plan-time" for="pt-${h}">${fmtHour(h)}</label>
        <input id="pt-${h}" class="plan-input" list="title-suggest" maxlength="60" placeholder="Kegiatan jam ${fmtHour(h)}…" value="${esc(p.title)}" autocomplete="off">
        <select class="plan-skill" aria-label="Skill untuk jam ${fmtHour(h)}">${opts(p.skill)}</select>
        <button type="button" class="btn btn-ghost icon-btn plan-down" title="Salin ke jam berikutnya" aria-label="Salin ke jam berikutnya">↓</button>
      </li>`;
    }).join('');
    updatePlanSummary();
  }
  function updatePlanSummary() {
    const hs = plannedHours(planDate);
    const withSkill = hs.filter((h) => skillById(state.plans[planDate][h].skill)).length;
    $('#plan-summary').textContent = hs.length
      ? `${hs.length} jam terencana · ${withSkill} terhubung skill · potensi hadiah hingga ${hs.length * (REWARD.sesuai.coins + ON_TIME_BONUS)} koin · tersimpan otomatis`
      : 'Belum ada kegiatan. Isi minimal 3 jam untuk bonus “agenda siap”.';
  }
  function setPlanSlot(h, title, skill) {
    title = title.trim();
    const p = (state.plans[planDate] ||= {});
    if (title) p[h] = { title, skill: skill || '' };
    else delete p[h];
    if (!Object.keys(p).length) delete state.plans[planDate];
    commit();
  }
  function planEditable() { return planDate > dkey(now()); }
  $('#plan-list').addEventListener('input', (e) => {
    const row = e.target.closest('.plan-row'); if (!row) return;
    if (!planEditable()) { toast('Hari ini sudah dimulai, rencana terkunci.'); renderPlan(); return; }
    const h = Number(row.dataset.h);
    setPlanSlot(h, row.querySelector('.plan-input').value, row.querySelector('.plan-skill').value);
    row.classList.toggle('has', !!row.querySelector('.plan-input').value.trim());
    updatePlanSummary();
  });
  $('#plan-list').addEventListener('change', (e) => {
    const row = e.target.closest('.plan-row'); if (!row || !e.target.matches('.plan-input')) return;
    const inp = e.target; const sel = row.querySelector('.plan-skill');
    if (inp.value && !sel.value) {
      // pakai skill yang dulu dipakai untuk judul yang sama
      for (const p of Object.values(state.plans)) for (const s of Object.values(p)) if (s.title === inp.value.trim() && skillById(s.skill)) { sel.value = s.skill; }
      setPlanSlot(Number(row.dataset.h), inp.value, sel.value);
      updatePlanSummary();
    }
  });
  $('#plan-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.plan-down'); if (!btn) return;
    const row = btn.closest('.plan-row'); const next = row.nextElementSibling;
    if (!next) return;
    const ni = next.querySelector('.plan-input'); const ns = next.querySelector('.plan-skill');
    ni.value = row.querySelector('.plan-input').value; ns.value = row.querySelector('.plan-skill').value;
    ni.dispatchEvent(new Event('input', { bubbles: true }));
    ni.focus();
  });
  $('#plan-prev').addEventListener('click', () => { planDate = addDays(planDate, -1); renderPlan(); });
  $('#plan-next').addEventListener('click', () => { planDate = addDays(planDate, 1); renderPlan(); });
  $('#plan-copy').addEventListener('click', () => {
    const src = state.plans[dkey(now())]; if (!src) return;
    if (state.plans[planDate] && !confirm(`Timpa rencana ${fmtShort(planDate)} dengan agenda hari ini?`)) return;
    state.plans[planDate] = JSON.parse(JSON.stringify(src));
    commit(); renderPlan(); toast('Agenda hari ini disalin.');
  });
  $('#plan-clear').addEventListener('click', () => {
    if (!state.plans[planDate] || !confirm(`Kosongkan rencana ${fmtShort(planDate)}?`)) return;
    delete state.plans[planDate]; commit(); renderPlan();
  });

  // ---------- render: skill ----------
  function skillStats(id) {
    let hours = 0;
    Object.values(state.reviews).forEach((day) => Object.values(day).forEach((r) => { if (r.skill === id && r.status !== 'meleset') hours++; }));
    const tom = addDays(dkey(now()), 1);
    const planned = plannedHours(tom).filter((h) => state.plans[tom][h].skill === id).length;
    return { hours, planned };
  }
  function renderSkills() {
    const pl = levelInfo(state.xp, playerCost);
    $('#player-card').innerHTML = `
      <div class="player-lv"><span class="lv-ring" style="--p:${pl.pct}"><b>${pl.level}</b></span></div>
      <div class="player-info">
        <p class="muted small">Level Gerak</p>
        <h2>${esc(pick(PLAYER_TITLES, pl.level))}</h2>
        ${meter(`Menuju Level ${pl.level + 1}`, pl.pct * 100, { text: `${pl.into}/${pl.need} XP` })}
        <p class="muted small">Total ${state.xp} XP · ${state.coins} koin di dompet</p>
      </div>`;
    $('#skill-grid').innerHTML = state.skills.map((s) => {
      const li = levelInfo(s.xp, skillCost); const st = skillStats(s.id);
      return `<article class="card skill">
        <div class="skill-head">
          <span class="skill-ico" aria-hidden="true">${s.icon}</span>
          <div class="skill-title"><h3>${esc(s.name)}</h3><p class="muted small">Lv ${li.level} · ${pick(RANKS, li.level)}</p></div>
          <button type="button" class="btn btn-ghost icon-btn" data-edit-skill="${s.id}" aria-label="Ubah ${esc(s.name)}">✎</button>
        </div>
        ${meter(`Menuju Lv ${li.level + 1}`, li.pct * 100, { text: `${li.into}/${li.need} XP` })}
        <p class="muted small">${st.hours} jam latihan · ${st.planned ? `${st.planned} jam direncanakan besok` : 'belum ada di agenda besok'}</p>
      </article>`;
    }).join('') || '<p class="muted">Belum ada skill. Tambahkan satu!</p>';
  }

  let editingSkill = null; let pickedIcon = ICONS[0];
  function openSkill(id) {
    editingSkill = id ? skillById(id) : null;
    $('#skill-title').textContent = editingSkill ? 'Ubah skill' : 'Skill baru';
    $('#skill-name').value = editingSkill?.name || '';
    pickedIcon = editingSkill?.icon || ICONS[7];
    $('#skill-delete').hidden = !editingSkill;
    renderIconPick();
    $('#skill-dialog').returnValue = '';
    $('#skill-dialog').showModal();
  }
  function renderIconPick() {
    $('#icon-pick').innerHTML = '<legend>Ikon</legend>' + ICONS.map((ic) => `<button type="button" class="icon-opt" aria-pressed="${ic === pickedIcon}" data-icon="${ic}">${ic}</button>`).join('');
  }
  $('#icon-pick').addEventListener('click', (e) => { const b = e.target.closest('[data-icon]'); if (b) { pickedIcon = b.dataset.icon; renderIconPick(); } });
  $('#skill-dialog').addEventListener('close', () => {
    if ($('#skill-dialog').returnValue !== 'ok') return;
    const name = $('#skill-name').value.trim(); if (!name) return;
    if (editingSkill) { editingSkill.name = name; editingSkill.icon = pickedIcon; }
    else {
      let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skill';
      while (skillById(id)) id += '-2';
      state.skills.push({ id, name, icon: pickedIcon, xp: 0 });
      addLog(`Skill baru: ${name}.`, pickedIcon);
    }
    commit(); render();
  });
  $('#skill-delete').addEventListener('click', () => {
    if (!editingSkill || !confirm(`Hapus skill “${editingSkill.name}”? XP skill ini ikut hilang.`)) return;
    state.skills = state.skills.filter((s) => s !== editingSkill);
    commit(); $('#skill-dialog').close('cancel'); render();
  });
  $('#add-skill').addEventListener('click', () => openSkill(null));
  $('#skill-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-edit-skill]'); if (b) openSkill(b.dataset.editSkill); });

  // ---------- render: peliharaan ----------
  function renderPet() {
    renderPetCard($('#pet-main'), true);
    const stage = stageOf(state.xp);
    $('#evo-sub').textContent = STAGES[stage + 1] ? `${STAGES[stage + 1].min - state.xp} XP lagi menuju ${STAGES[stage + 1].name}` : 'Wujud tertinggi tercapai!';
    $('#evo').innerHTML = STAGES.map((s, i) => `<li class="${i < stage ? 'done' : i === stage ? 'cur' : 'locked'}">
      <span class="evo-pic">${i <= stage ? petSVG(i, i === 0 ? 'telur' : 'gembira', state.pet.color, [], 0) : '<span class="evo-q">?</span>'}</span>
      <span class="evo-name">${s.name}</span><span class="muted small">${s.min} XP</span></li>`).join('');
    const egg = stage === 0;
    $('#shop').innerHTML = SHOP.map((it) => {
      const owned = state.pet.owned.includes(it.id);
      let btn;
      if (it.kind === 'wear' && owned) {
        const on = state.pet.worn.includes(it.id);
        btn = `<button type="button" class="btn btn-ghost btn-sm" data-wear="${it.id}" aria-pressed="${on}">${on ? 'Lepas' : 'Pakai'}</button>`;
      } else {
        const blocked = (egg && it.kind !== 'wear') || (it.kind === 'med' && !state.pet.sick);
        const why = egg && it.kind !== 'wear' ? 'Masih telur' : it.kind === 'med' && !state.pet.sick ? 'Sehat' : '';
        btn = `<button type="button" class="btn ${state.coins >= it.price && !blocked ? 'btn-primary' : 'btn-ghost'} btn-sm" data-buy="${it.id}" ${state.coins < it.price || blocked ? 'disabled' : ''}>${why || `🪙 ${it.price}`}</button>`;
      }
      return `<div class="shop-item"><span class="shop-ico" aria-hidden="true">${it.icon}</span><div class="shop-txt"><b>${it.name}</b><span class="muted small">${it.desc}</span></div>${btn}</div>`;
    }).join('');
  }
  $('#shop').addEventListener('click', (e) => {
    const buy = e.target.closest('[data-buy]'); const wear = e.target.closest('[data-wear]');
    const p = state.pet;
    if (wear) {
      const id = wear.dataset.wear;
      p.worn = p.worn.includes(id) ? p.worn.filter((x) => x !== id) : [...p.worn, id];
      commit(); renderPet(); renderToday(); return;
    }
    if (!buy) return;
    const it = SHOP.find((x) => x.id === buy.dataset.buy);
    if (!it || state.coins < it.price) return;
    state.coins -= it.price;
    if (it.kind === 'wear') { p.owned.push(it.id); p.worn.push(it.id); toast(`${it.icon} ${p.name} memakai ${it.name}!`, 'good'); }
    else if (it.kind === 'med') { p.sick = false; p.kenyang = Math.max(p.kenyang, 30); toast(`💊 ${p.name} sudah sembuh!`, 'good'); }
    else {
      p.kenyang = clamp(p.kenyang + (it.kenyang || 0));
      if (!p.sick || (it.senang || 0) < 0) p.senang = clamp(p.senang + (it.senang || 0));
      toast(`${it.icon} ${it.kind === 'food' ? 'Nyam!' : 'Seru!'} ${p.name} ${it.kind === 'food' ? 'makan' : 'bermain'}.`, 'good');
    }
    addLog(`Membeli ${it.name} (−${it.price} koin).`, it.icon);
    commit(); render(); floatText(it.icon); petReact(it.kind === 'food' ? 'eat' : 'jump');
  });

  // ---------- render: riwayat ----------
  function daySummary(date, t) {
    const today = dkey(t);
    const c = { sesuai: 0, sebagian: 0, meleset: 0, terlewat: 0, belum: 0 };
    plannedHours(date).forEach((h) => {
      const r = state.reviews[date]?.[h];
      if (r) c[r.status]++;
      else if (date < today) c.terlewat++;
      else c.belum++;
    });
    return c;
  }
  function renderHistory() {
    const t = now(); const today = dkey(t);
    let totSesuai = 0; let totPlanned = 0; let bestDay = null;
    const rows = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(today, -i);
      if (d < state.pet.born) break;
      const c = daySummary(d, t);
      const planned = c.sesuai + c.sebagian + c.meleset + c.terlewat + c.belum;
      totSesuai += c.sesuai; totPlanned += planned - c.belum;
      if (planned && (!bestDay || c.sesuai > bestDay.n)) bestDay = { d, n: c.sesuai };
      const rec = state.days[d] || { coins: 0 };
      const seg = (k) => (c[k] ? `<i class="seg s-${k}" style="flex:${c[k]}" title="${c[k]} ${k}"></i>` : '');
      rows.push(`<li class="day-row">
        <span class="day-name">${i === 0 ? 'Hari ini' : i === 1 ? 'Kemarin' : fmtShort(d)}</span>
        <span class="day-bar">${planned ? ['sesuai', 'sebagian', 'meleset', 'terlewat', 'belum'].map(seg).join('') : '<i class="seg s-empty" style="flex:1"></i>'}</span>
        <span class="day-txt">${planned ? `<b>${c.sesuai}/${planned}</b> sesuai${rec.coins ? ` · +${rec.coins} 🪙` : ''}` : '<span class="muted">kosong</span>'}</span>
      </li>`);
    }
    $('#days').innerHTML = rows.join('');
    const rate = totPlanned ? Math.round((totSesuai / totPlanned) * 100) : 0;
    let allSesuai = 0;
    Object.values(state.reviews).forEach((d) => Object.values(d).forEach((r) => { if (r.status === 'sesuai') allSesuai++; }));
    $('#history-stats').innerHTML = [
      tile('Kesesuaian 14 hari', `${rate}<small>%</small>`, `${totSesuai} dari ${totPlanned} jam yang sudah lewat`),
      tile('Streak sekarang', `${streakNow(t)}<small> hari</small>`, `terbaik ${state.streak.best} hari`),
      tile('Total jam sesuai', `${allSesuai}`, 'sepanjang masa'),
      tile('Hari terbaik', bestDay ? `${bestDay.n}<small> jam</small>` : '–', bestDay ? fmtShort(bestDay.d) : 'belum ada'),
    ].join('');
    $('#log').innerHTML = state.log.slice(0, 40).map((l) => `<li><span class="log-ico" aria-hidden="true">${l.icon}</span><span>${esc(l.text)}</span><time class="muted small">${fmtTime(l.at)}</time></li>`).join('') || '<li class="muted">Belum ada aktivitas.</li>';
  }

  // ---------- global render ----------
  function render() {
    const t = now();
    $('#hud-coins').textContent = state.coins;
    $('#hud-level').textContent = levelInfo(state.xp, playerCost).level;
    const pend = pendingSlots(t).length;
    $('#tab-dot').hidden = !pend;
    document.title = pend ? `(${pend}) Gerak` : 'Gerak: rencana per jam, skill & peliharaan';
    $('#tab-pet-label').textContent = state.pet.name;
    $('[data-tab="pet"] .tab-ico').textContent = stageOf(state.xp) === 0 ? '🥚' : '🐣';
    renderToday();
    if (!$('#panel-plan').hidden && !$('#panel-plan').contains(document.activeElement)) renderPlan();
    renderSkills();
    renderPet();
    renderHistory();
  }

  // ---------- tabs ----------
  function showTab(name) {
    $$('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $$('.tab-panel').forEach((p) => { p.hidden = p.id !== `panel-${name}`; });
    if (name === 'plan') renderPlan();
    if (name === 'today') { scrolledToNow = false; renderToday(); }
    window.scrollTo({ top: 0 });
  }
  $('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]'); if (g) { showTab(g.dataset.goto); return; }
    const r = e.target.closest('[data-review]'); if (r) { openReview(Number(r.dataset.review)); return; }
    const pet = e.target.closest('[data-pet-tap]');
    if (pet) {
      petReact('jump');
      const lines = ['Hehe, geli!', 'Ayo gerak!', '💛', 'Aku sayang kamu!', 'Semangat ya!'];
      const b = pet.parentElement.querySelector('[data-bubble]');
      if (b && stageOf(state.xp) > 0 && petMood(now()) !== 'tidur') { b.textContent = lines[Math.floor(Math.random() * lines.length)]; setTimeout(() => { b.textContent = petSpeech(now()); }, 2200); }
    }
  });

  // ---------- toast ----------
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind ? 'toast-' + kind : ''}`;
    el.textContent = msg;
    const box = $('#toasts');
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => el.remove(), 4000);
  }

  // ---------- notifications ----------
  async function notify(title, body, tag) {
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
      else new Notification(title, { body, tag });
    } catch (e) { /* abaikan */ }
  }
  function maybeNotify(t) {
    if (!state.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    const today = dkey(t);
    plannedHours(today).forEach((h) => {
      const key = `${today}-${h}`;
      if (slotState(today, h, t) === 'due' && !state.notified[key]) {
        state.notified[key] = 1;
        notify(`Review ${slotLabel(h)}`, `Rencana: ${state.plans[today][h].title}. Sesuai, sebagian, atau meleset?`, key);
      }
    });
    const pk = `plan-${today}`;
    if (t.getHours() >= 20 && plannedHours(addDays(today, 1)).length < 3 && !state.notified[pk]) {
      state.notified[pk] = 1;
      notify('Agenda besok belum siap', `${state.pet.name} menunggu rencanamu untuk besok.`, pk);
    }
    // bersihkan kunci lama
    Object.keys(state.notified).forEach((k) => { if (!k.includes(today)) delete state.notified[k]; });
    save();
  }

  // ---------- sinkron cloud (Upstash Redis via /api/sync) ----------
  const SYNC_KEY = 'gerak-sync';
  const BASE_KEY = 'gerak-sync-base';
  // Hanya di versi online, dan tidak saat jam digeser dengan ?now= (supaya data asli tidak tercampur).
  const syncAvailable = location.protocol.startsWith('http') && !timeOffset;
  const newId = (n, alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789') => {
    const b = new Uint8Array(n); crypto.getRandomValues(b);
    return [...b].map((x) => alpha[x % alpha.length]).join('');
  };
  function loadSync() {
    try { const s = JSON.parse(localStorage.getItem(SYNC_KEY)); if (s && s.code) return s; } catch (e) { /* abaikan */ }
    return { code: null, device: newId(12), rev: 0, seq: 0, sentSeq: 0, pushedSeq: 0, lastSync: null, lastError: null };
  }
  let sync = loadSync();
  let syncStatus = 'idle';
  let syncBusy = false;
  let pushTimer = null;
  const saveSync = () => { if (sync.code) localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); else localStorage.removeItem(SYNC_KEY); };
  const setBase = (data) => { try { localStorage.setItem(BASE_KEY, JSON.stringify(data)); } catch (e) { /* abaikan */ } };
  const getBase = () => { try { return JSON.parse(localStorage.getItem(BASE_KEY)); } catch (e) { return null; } };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  function markDirty() {
    if (!sync.code) return;
    sync.seq++; saveSync();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => syncNow(), 1500);
    renderSyncBadge();
  }

  async function syncApi(method, body) {
    const res = await fetch('/api/sync', {
      method, cache: 'no-store',
      headers: { 'X-Gerak-Code': sync.code, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }
  const syncError = (r) => {
    const msg = { 401: 'Kode sinkron tidak valid.', 413: 'Data terlalu besar untuk disinkron.', 429: 'Terlalu sering, coba lagi sebentar.', 503: 'Database belum terhubung ke project Vercel.' }[r.status];
    return new Error(msg || `Server menjawab ${r.status}${r.json?.error ? ' (' + r.json.error + ')' : ''}.`);
  };

  // Gabungan 3 arah: B = data terakhir yang sama-sama diketahui, L = perangkat ini, R = cloud.
  function mergeStates(B, L, R) {
    B = B || R;
    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    const pickChanged = (b, l, r) => (same(l, b) ? r : l);
    const delta = (b, l, r) => (r || 0) + ((l || 0) - (b || 0));
    const keys = (...objs) => [...new Set(objs.flatMap((o) => Object.keys(o || {})))];
    const out = clone(R);

    out.plans = {};
    for (const d of keys(B.plans, L.plans, R.plans)) {
      const day = {};
      for (const h of keys(B.plans?.[d], L.plans?.[d], R.plans?.[d])) {
        const v = pickChanged(B.plans?.[d]?.[h], L.plans?.[d]?.[h], R.plans?.[d]?.[h]);
        if (v) day[h] = v;
      }
      if (Object.keys(day).length) out.plans[d] = day;
    }

    // Review: gabungkan; jam yang direview di dua perangkat sekaligus memakai versi cloud.
    out.reviews = clone(L.reviews || {});
    let dupXp = 0; let dupCoins = 0; const dupSkill = {};
    for (const [d, day] of Object.entries(R.reviews || {})) {
      for (const [h, r] of Object.entries(day)) {
        const l = L.reviews?.[d]?.[h];
        if (l && !B.reviews?.[d]?.[h] && !same(l, r)) {
          dupXp += l.xp || 0; dupCoins += l.coins || 0;
          if (l.skill) dupSkill[l.skill] = (dupSkill[l.skill] || 0) + (l.xp || 0);
        }
        (out.reviews[d] ||= {})[h] = r;
      }
    }

    out.days = {};
    for (const d of keys(L.days, R.days)) {
      const b = B.days?.[d] || {}; const l = L.days?.[d] || {}; const r = R.days?.[d] || {};
      const m = { ...l, ...r };
      m.coins = delta(b.coins, l.coins, r.coins); m.xp = delta(b.xp, l.xp, r.xp);
      if (l.finalized && r.finalized && !b.finalized) { m.coins -= l.finalBonus || 0; dupCoins += l.finalBonus || 0; }
      if (l.planBonus && r.planBonus && !b.planBonus) { m.coins -= 10; dupCoins += 10; }
      m.finalized = !!(l.finalized || r.finalized); m.planBonus = !!(l.planBonus || r.planBonus);
      out.days[d] = m;
    }
    out.coins = Math.max(0, delta(B.coins, L.coins, R.coins) - dupCoins);
    out.xp = Math.max(0, delta(B.xp, L.xp, R.xp) - dupXp);

    const bs = Object.fromEntries((B.skills || []).map((s) => [s.id, s]));
    const ls = Object.fromEntries((L.skills || []).map((s) => [s.id, s]));
    const rs = Object.fromEntries((R.skills || []).map((s) => [s.id, s]));
    out.skills = [];
    for (const id of [...new Set([...(R.skills || []).map((s) => s.id), ...(L.skills || []).map((s) => s.id)])]) {
      const b = bs[id]; const l = ls[id]; const r = rs[id];
      if (b && (!l || !r)) continue; // dihapus di salah satu perangkat
      const m = { ...(r || l) };
      if (l && r) { m.name = pickChanged(b?.name, l.name, r.name); m.icon = pickChanged(b?.icon, l.icon, r.icon); }
      m.xp = Math.max(0, delta(b?.xp, l?.xp, r?.xp) - (dupSkill[id] || 0));
      out.skills.push(m);
    }

    const bp = B.pet || {}; const lp = L.pet || {}; const rp = R.pet || {};
    const p = { ...rp };
    p.name = pickChanged(bp.name, lp.name, rp.name); p.color = pickChanged(bp.color, lp.color, rp.color);
    for (const k of ['kenyang', 'senang']) p[k] = clamp((rp[k] ?? 0) + Math.max(0, (lp[k] ?? 0) - (bp[k] ?? lp[k] ?? 0)));
    p.sick = bp.sick && !lp.sick ? false : !!rp.sick;
    p.owned = [...new Set([...(rp.owned || []), ...(lp.owned || [])])];
    p.worn = (pickChanged(bp.worn, lp.worn, rp.worn) || []).filter((x) => p.owned.includes(x));
    const earliest = (a, b) => (!a ? b : !b ? a : a < b ? a : b);
    p.hatchedAt = earliest(lp.hatchedAt, rp.hatchedAt); p.born = earliest(lp.born, rp.born);
    p.lastTick = (lp.lastTick || '') > (rp.lastTick || '') ? lp.lastTick : rp.lastTick;
    out.pet = p;

    out.settings = { ...R.settings };
    for (const k of keys(L.settings, R.settings)) out.settings[k] = pickChanged(B.settings?.[k], L.settings?.[k], R.settings?.[k]);
    const ls2 = L.streak || {}; const rs2 = R.streak || {};
    out.streak = ((ls2.lastDay || '') > (rs2.lastDay || '') || (ls2.lastDay === rs2.lastDay && ls2.current > rs2.current)) ? { ...ls2 } : { ...rs2 };
    out.streak.best = Math.max(ls2.best || 0, rs2.best || 0);
    const seen = new Set();
    out.log = [...(L.log || []), ...(R.log || [])]
      .filter((x) => { const k = x.at + x.text; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 80);
    out.notified = { ...(L.notified || {}), ...(R.notified || {}) };
    out.onboarded = !!(L.onboarded || R.onboarded);
    out.createdAt = earliest(L.createdAt, R.createdAt);
    return out;
  }

  function adoptRemote(remote, quiet) {
    state = hydrate(remote.data); save();
    sync.rev = remote.rev; sync.pushedSeq = sync.seq; setBase(remote.data);
    tickPet(now()); finalizeDays(now()); save();
    scrolledToNow = false;
    render();
    if (!quiet) toast('☁ Data diperbarui dari perangkat lain.');
  }

  async function pushLocal() {
    const sentSeq = sync.seq; const snapshot = clone(state);
    sync.sentSeq = sentSeq; saveSync();
    const r = await syncApi('PUT', { baseRev: sync.rev, data: snapshot, device: sync.device, seq: sentSeq });
    if (r.status === 200) { sync.rev = r.json.rev; sync.pushedSeq = sentSeq; setBase(snapshot); return true; }
    if (r.status !== 409) throw syncError(r);
    const remote = r.json;
    if (remote.device === sync.device && remote.seq === sentSeq) {
      // Kiriman kita sebelumnya ternyata sudah sampai.
      sync.rev = remote.rev; sync.pushedSeq = sentSeq; setBase(remote.data); return true;
    }
    if (!remote.data) { sync.rev = remote.rev; return false; }
    const before = snapshot.coins;
    state = hydrate(mergeStates(getBase(), state, remote.data)); save();
    sync.rev = remote.rev; setBase(remote.data); sync.seq++;
    render();
    toast(`☁ Perubahan dari perangkat lain digabungkan${state.coins !== before ? ` (koin ${before} → ${state.coins})` : ''}.`);
    return false;
  }

  async function syncNow() {
    if (!sync.code || !syncAvailable || syncBusy) return;
    if (!navigator.onLine) { syncStatus = 'offline'; renderSyncBadge(); return; }
    syncBusy = true; syncStatus = 'syncing'; renderSyncBadge();
    try {
      for (let i = 0; i < 3 && sync.seq > sync.pushedSeq; i++) await pushLocal();
      if (sync.seq <= sync.pushedSeq) {
        const r = await syncApi('GET');
        if (r.status !== 200) throw syncError(r);
        if (r.json.rev > sync.rev && r.json.data) adoptRemote(r.json);
        else if (r.json.rev === 0 && sync.rev > 0) { sync.rev = 0; sync.seq++; }
      }
      sync.lastSync = new Date().toISOString(); sync.lastError = null; syncStatus = 'idle';
    } catch (e) {
      sync.lastError = e.message || 'Gagal terhubung.'; syncStatus = 'error';
    } finally {
      syncBusy = false; saveSync(); renderSyncBadge(); renderSyncBox();
      if (sync.seq > sync.pushedSeq && !sync.lastError) { clearTimeout(pushTimer); pushTimer = setTimeout(() => syncNow(), 1500); }
    }
  }

  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''); }
  async function linkWithCode(code, { fromOnboarding } = {}) {
    code = normCode(code);
    if (code.length < 16) { toast('Kode sinkron terlalu pendek (min. 16 karakter).', 'bad'); return false; }
    const prev = sync;
    sync = { ...loadSync(), code, device: prev.device || newId(12) };
    try {
      const r = await syncApi('GET');
      if (r.status !== 200) throw syncError(r);
      if (r.json.data) {
        const d = r.json.data;
        const reviews = Object.values(d.reviews || {}).reduce((n, x) => n + Object.keys(x).length, 0);
        const summary = `${d.pet?.name || 'Peliharaan'} · ${d.xp || 0} XP · ${d.coins || 0} koin · ${reviews} jam direview`;
        const hasLocal = state.onboarded && (state.xp > 0 || Object.keys(state.plans).length);
        if (!fromOnboarding && hasLocal && !confirm(`Data di cloud: ${summary}.\n\nPakai data cloud? Data di perangkat ini akan diganti.`)) { sync = prev; return false; }
        saveSync(); adoptRemote(r.json, true);
        toast(`☁ Terhubung. Data dimuat: ${summary}.`, 'good');
      } else {
        if (fromOnboarding) { sync = prev; toast('Belum ada data untuk kode ini. Periksa lagi kodenya.', 'bad'); return false; }
        if (!confirm('Belum ada data untuk kode ini. Mulai sinkron memakai data di perangkat ini?')) { sync = prev; return false; }
        sync.seq = 1; sync.pushedSeq = 0; saveSync();
        await syncNow();
        toast('☁ Sinkron aktif. Masukkan kode yang sama di perangkat lain.', 'good');
      }
      sync.lastSync = new Date().toISOString(); saveSync(); renderSyncBadge(); renderSyncBox();
      return true;
    } catch (e) {
      sync = prev; toast(e.message || 'Gagal terhubung ke server.', 'bad'); return false;
    }
  }
  async function createCode() {
    const code = `GRK-${newId(5)}-${newId(5)}-${newId(5)}-${newId(5)}`;
    sync = { ...loadSync(), code, device: sync.device, seq: 1, pushedSeq: 0, rev: 0 };
    saveSync(); renderSyncBox();
    await syncNow();
    if (sync.lastError) toast(`Kode dibuat, tapi belum tersinkron: ${sync.lastError}`, 'bad');
    else toast('☁ Sinkron aktif. Simpan kodenya dan masukkan di perangkat lain.', 'good');
    renderSyncBox();
  }
  function unlink() {
    if (!confirm('Putuskan sinkron di perangkat ini? Data tetap ada di perangkat ini dan di cloud.')) return;
    sync = { ...loadSync(), code: null, device: sync.device }; saveSync(); localStorage.removeItem(BASE_KEY);
    syncStatus = 'idle'; renderSyncBadge(); renderSyncBox();
  }

  function agoText(iso) {
    if (!iso) return 'belum pernah';
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    return m < 1 ? 'baru saja' : m < 60 ? `${m} menit lalu` : m < 1440 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu`;
  }
  function syncState() {
    if (!sync.code) return 'off';
    if (!syncAvailable) return 'paused';
    if (syncStatus === 'syncing') return 'syncing';
    if (!navigator.onLine) return 'offline';
    if (sync.lastError) return 'error';
    return sync.seq > sync.pushedSeq ? 'pending' : 'ok';
  }
  const SYNC_TEXT = { ok: 'Tersinkron', syncing: 'Menyinkron…', pending: 'Menunggu kirim', offline: 'Offline, disimpan di perangkat', error: 'Gagal sinkron', paused: 'Sinkron dijeda' };
  function renderSyncBadge() {
    const b = $('#sync-badge'); if (!b) return;
    const st = syncState();
    b.hidden = st === 'off';
    b.dataset.state = st;
    b.querySelector('b').textContent = { ok: '✓', syncing: '…', pending: '•', offline: '✕', error: '!', paused: '⏸', off: '' }[st];
    b.title = `${SYNC_TEXT[st] || ''}${sync.lastSync ? ' · ' + agoText(sync.lastSync) : ''}`;
    b.setAttribute('aria-label', `Sinkron: ${b.title}`);
  }
  function renderSyncBox() {
    const box = $('#sync-box'); if (!box || !$('#settings-dialog').open) return;
    if (!syncAvailable) {
      box.innerHTML = `<span>Sinkron antar perangkat</span><span class="muted small">${timeOffset ? 'Dijeda karena jam aplikasi digeser dengan ?now=.' : 'Hanya tersedia di versi online (Vercel).'}${sync.code ? ' Kode tetap tersimpan.' : ''}</span>`;
      return;
    }
    if (!sync.code) {
      box.innerHTML = `<span>Sinkron antar perangkat</span>
        <span class="muted small">Simpan data di cloud dan pakai Gerak di HP dan laptop sekaligus. Dikunci dengan kode rahasia, jadi siapa pun yang memegang kode bisa membuka datamu.</span>
        <div class="btn-row"><button type="button" class="btn btn-primary" data-sync="create">Buat kode sinkron</button></div>
        <div class="code-row"><input id="sync-code-input" placeholder="Punya kode? GRK-XXXXX-…" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" class="btn btn-ghost" data-sync="link">Hubungkan</button></div>`;
      return;
    }
    const st = syncState();
    box.innerHTML = `<span>Sinkron antar perangkat</span>
      <span class="sync-line" data-state="${st}"><i></i>${SYNC_TEXT[st]} · terakhir ${agoText(sync.lastSync)}</span>
      ${sync.lastError ? `<span class="small warn-line">${esc(sync.lastError)}</span>` : ''}
      <details class="code-reveal"><summary>Tampilkan kode sinkron</summary>
        <div class="code-row"><code id="sync-code">${esc(sync.code)}</code><button type="button" class="btn btn-ghost btn-sm" data-sync="copy">Salin</button></div>
        <span class="muted small">Masukkan kode ini di perangkat lain (Pengaturan → Sinkron, atau saat pertama membuka Gerak). Jangan bagikan ke orang lain.</span>
      </details>
      <div class="btn-row"><button type="button" class="btn btn-ghost" data-sync="now">Sinkron sekarang</button><button type="button" class="btn btn-danger" data-sync="unlink">Putuskan</button></div>`;
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-sync]'); if (!b) return;
    const act = b.dataset.sync;
    if (act === 'create') { b.disabled = true; await createCode(); }
    if (act === 'link') { b.disabled = true; const ok = await linkWithCode($('#sync-code-input').value); b.disabled = false; if (ok) $('#settings-dialog').close('cancel'); }
    if (act === 'now') { await syncNow(); renderSyncBox(); }
    if (act === 'unlink') unlink();
    if (act === 'copy') { try { await navigator.clipboard.writeText(sync.code); toast('Kode disalin.'); } catch (err) { toast('Salin manual: pilih teks kodenya.'); } }
  });
  $('#sync-badge').addEventListener('click', () => { $('#settings-btn').click(); });
  window.addEventListener('online', () => syncNow());
  window.addEventListener('offline', () => renderSyncBadge());

  // ---------- settings & onboarding ----------
  const hourOpts = (sel, from, to) => { let s = ''; for (let h = from; h <= to; h++) s += `<option value="${h}"${h === sel ? ' selected' : ''}>${fmtHour(h)}</option>`; return s; };
  function colorPick(el, sel) {
    el.innerHTML = el.querySelector('legend').outerHTML + Object.entries(COLORS).map(([k, c]) => `<label class="swatch"><input type="radio" name="${el.id}" value="${k}"${k === sel ? ' checked' : ''}><i style="background:${c.body}"></i><span>${c.name}</span></label>`).join('');
  }
  function updateNotifyState() {
    const ok = 'Notification' in window;
    const perm = ok ? Notification.permission : 'unsupported';
    $('#set-notify').textContent = state.settings.notify && perm === 'granted' ? 'Matikan notifikasi' : 'Aktifkan notifikasi';
    $('#notify-state').textContent = !ok ? 'Browser ini tidak mendukung notifikasi.'
      : perm === 'denied' ? 'Izin notifikasi ditolak di browser.'
        : state.settings.notify && perm === 'granted' ? 'Aktif. Muncul saat aplikasi terbuka atau berjalan di latar.' : 'Mati.';
  }
  $('#settings-btn').addEventListener('click', () => {
    $('#set-petname').value = state.pet.name;
    colorPick($('#set-color'), state.pet.color);
    $('#set-start').innerHTML = hourOpts(state.settings.startHour, 0, 12);
    $('#set-end').innerHTML = hourOpts(state.settings.endHour, 13, 24);
    updateNotifyState();
    $('#settings-dialog').returnValue = '';
    $('#settings-dialog').showModal();
    renderSyncBox();
  });
  $('#set-notify').addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    if (state.settings.notify && Notification.permission === 'granted') state.settings.notify = false;
    else { const p = await Notification.requestPermission(); state.settings.notify = p === 'granted'; if (p === 'granted') notify('Pengingat Gerak aktif', 'Kamu akan diingatkan untuk review tiap jam.', 'gerak-on'); }
    save(); updateNotifyState();
  });
  $('#settings-dialog').addEventListener('close', () => {
    if ($('#settings-dialog').returnValue !== 'ok') return;
    state.pet.name = $('#set-petname').value.trim() || state.pet.name;
    const col = $('#settings-form').querySelector('input[name="set-color"]:checked'); if (col) state.pet.color = col.value;
    state.settings.startHour = Number($('#set-start').value); state.settings.endHour = Number($('#set-end').value);
    commit(); render();
  });
  $('#export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `gerak-${dkey(now())}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#import-input').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data?.version !== 1 || !data.pet || !data.plans) throw new Error('format');
      if (!confirm('Ganti semua data di perangkat ini dengan file ini?')) return;
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      state = load(); commit(); $('#settings-dialog').close('cancel'); render(); toast('Data berhasil diimpor.', 'good');
    } catch (err) { toast('File tidak valid.', 'bad'); }
    e.target.value = '';
  });
  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Hapus semua rencana, review, skill, dan peliharaan? Tidak bisa dibatalkan.')) return;
    localStorage.removeItem(STORE_KEY); location.reload();
  });

  function onboard() {
    $('#onboard-egg').innerHTML = petSVG(0, 'telur', 'hijau', [], 0);
    colorPick($('#ob-color'), 'hijau');
    $('#ob-start').innerHTML = hourOpts(5, 0, 12);
    $('#ob-end').innerHTML = hourOpts(22, 13, 24);
    $('#ob-color').addEventListener('change', (e) => { $('#onboard-egg').innerHTML = petSVG(0, 'telur', e.target.value, [], 0); });
    const dlg = $('#onboard-dialog');
    dlg.addEventListener('cancel', (e) => e.preventDefault());
    const obLink = $('#ob-link');
    if (!syncAvailable) $('#ob-sync').hidden = true;
    obLink.addEventListener('click', async () => {
      obLink.disabled = true;
      const ok = await linkWithCode($('#ob-code').value, { fromOnboarding: true });
      obLink.disabled = false;
      if (ok) dlg.close('linked');
    });
    dlg.addEventListener('close', () => {
      if (dlg.returnValue === 'linked') {
        if (!state.onboarded) { state.onboarded = true; commit(); }
        render(); showTab(state.plans[dkey(now())] ? 'today' : 'plan');
        return;
      }
      state.pet.name = $('#ob-name').value.trim() || 'Gerak';
      const col = $('#onboard-form').querySelector('input[name="ob-color"]:checked'); if (col) state.pet.color = col.value;
      state.settings.startHour = Number($('#ob-start').value); state.settings.endHour = Number($('#ob-end').value);
      state.onboarded = true;
      addLog(`${state.pet.name} lahir sebagai telur. Selamat datang di Gerak!`, '🥚');
      commit(); render(); showTab('plan');
      toast('Mulai dengan menyusun agenda besok, jam per jam.', 'good');
    });
    dlg.showModal();
  }

  // ---------- start ----------
  tick();
  render();
  if (!state.onboarded) onboard();
  setInterval(() => { tick(); render(); }, 30 * 1000);
  setInterval(() => { if (!document.hidden) syncNow(); }, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { tick(); render(); syncNow(); }
    else if (sync.seq > sync.pushedSeq) syncNow(); // kirim perubahan sebelum aplikasi ditinggal
  });
  renderSyncBadge();
  syncNow();
})();

// Account and portfolio numbers computed from a "Neraca Pribadi" data file
// (the data.js behind the artifact). The calculations follow the artifact's
// own Akun view. The data itself is never committed: it is imported in the
// app and kept in the database.

export type TxRow = [
  date: string, // YYYY-MM-DD
  account: string,
  categoryOrTarget: string, // category, or target account for transfers
  note: string,
  amount: number,
  type: "I" | "E" | "T" | "R",
  description: string,
];

type Owned = { owner?: string; plat?: string };
type Stock = Owned & { tk: string; name: string; lots: number; avg: number; price: number };
type UsStock = Owned & { tk: string; name: string; sh: number; price: number; costIdr?: number };
type Other = Owned & { name: string; kind: string; value: number; cost?: number };
type Fund = Owned & { name: string; kind: string; units?: number; nav?: number; value?: number; cost?: number };
type Bond = Owned & { code: string; cost: number; units: number; maturity: string };
type Gold = { grams: number; pricePerGram: number; owner?: string };

export type Seed = {
  builtAt?: string;
  tx: { rows: TxRow[]; at?: string };
  portfolio: {
    priceDate?: string;
    stocks: Stock[];
    us?: UsStock[];
    others: Other[];
    funds: Fund[];
    bonds: Bond[];
    gold: Gold;
    fx?: { rate: number };
    titip?: { items?: { person: string; amount: number }[] };
  };
};

export type Group = "bank" | "tunai" | "ewallet" | "kredit" | "invest" | "lain";

const GROUPS: Record<string, Group> = {
  BNI: "bank", Jago: "bank", BRI: "bank", BCA: "bank", Mandiri: "bank",
  Cash: "tunai",
  Gopay: "ewallet", ShopeePay: "ewallet", OVO: "ewallet", Dana: "ewallet",
  Card: "kredit",
  Bibit: "invest", Ajaib: "invest", Stockbit: "invest", Pluang: "invest", Pegadaian: "invest",
};

export const GROUP_NAME: Record<Group, string> = {
  bank: "Rekening bank",
  tunai: "Tunai",
  ewallet: "Dompet digital",
  kredit: "Kartu kredit",
  invest: "Platform investasi",
  lain: "Lainnya",
};

export function groupOf(account: string): Group {
  return GROUPS[account] ?? "lain";
}

/** Parse the artifact's data.js ("window.SEED={...}") or plain JSON. */
export function parseSeed(text: string): Seed {
  const json = text
    .trim()
    .replace(/^window\.SEED\s*=\s*/, "")
    .replace(/;\s*$/, "");
  const seed = JSON.parse(json) as Seed;
  if (!Array.isArray(seed?.tx?.rows) || !seed.portfolio) {
    throw new Error("Berkas tidak berisi data Neraca Pribadi.");
  }
  return seed;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type Account = {
  name: string;
  group: Group;
  balance: number;
  in30: number;
  out30: number;
  moved30: number;
  last: string;
};

export type Holding = {
  name: string;
  kind: string;
  value: number;
  cost: number;
  owner: string;
};

export type Platform = {
  name: string;
  value: number;
  own: number;
  holdings: Holding[];
};

export type Installment = {
  name: string;
  account: string;
  perMonth: number;
  left: number;
  total: number;
  end: string;
  of: number;
};

export function summarize(seed: Seed, today: string) {
  const rows = seed.tx.rows;
  const d30 = addDays(today, -30);
  const bal = new Map<string, number>();
  const io = new Map<string, [number, number, number]>();
  const last = new Map<string, string>();
  const add = (k: string, v: number) => bal.set(k, (bal.get(k) ?? 0) + v);
  const addIo = (k: string, i: 0 | 1 | 2, v: number) => {
    const x = io.get(k) ?? [0, 0, 0];
    x[i] += v;
    io.set(k, x);
  };
  const touch = (k: string, d: string) => {
    if (!last.has(k) || d > last.get(k)!) last.set(k, d);
  };

  let scheduled = 0;
  const inst = new Map<string, Installment>();

  for (const r of rows) {
    const [date, acc, acc2, note, amount, type] = r;
    if (date > today) {
      if (type === "E") {
        if (groupOf(acc) === "kredit") scheduled += amount;
        const m = /^(.*)\((\d+)\/(\d+)\)\s*$/.exec(note);
        const name = m ? m[1].trim() : note || acc2;
        const o = inst.get(name) ?? {
          name, account: acc, perMonth: amount, left: 0, total: 0, end: date, of: m ? +m[3] : 0,
        };
        o.left++;
        o.total += amount;
        if (date > o.end) o.end = date;
        inst.set(name, o);
      }
      continue;
    }
    if (type === "I") add(acc, amount);
    else if (type === "E") add(acc, -amount);
    else if (type === "T") { add(acc, -amount); add(acc2, amount); }
    else if (type === "R") { add(acc, amount); add(acc2, -amount); }

    touch(acc, date);
    if (type === "T") touch(acc2, date);
    if (date < d30) continue;
    if (type === "I") addIo(acc, 0, amount);
    else if (type === "E") addIo(acc, 1, amount);
    else if (type === "T") { addIo(acc, 2, -amount); addIo(acc2, 2, amount); }
  }

  const accounts: Account[] = [...bal.entries()].map(([name, balance]) => {
    const x = io.get(name) ?? [0, 0, 0];
    return {
      name, group: groupOf(name), balance,
      in30: x[0], out30: x[1], moved30: x[2], last: last.get(name) ?? "",
    };
  });

  const cash = { bank: 0, tunai: 0, ewallet: 0, lain: 0 };
  let owed = 0;
  for (const a of accounts) {
    if (a.group === "kredit") {
      if (a.balance < 0) owed += -a.balance;
      else cash.lain += a.balance;
    } else if (a.group !== "invest") {
      cash[a.group] += a.balance;
    }
  }

  // Investments, per platform. Items with an owner are held for someone else.
  const pf = seed.portfolio;
  const fx = pf.fx?.rate ?? 0;
  const plats = new Map<string, Platform>();
  let investOwn = 0;
  let held = 0;
  const put = (plat: string | undefined, h: Holding) => {
    const name = plat || "Lainnya";
    const p = plats.get(name) ?? { name, value: 0, own: 0, holdings: [] };
    p.value += h.value;
    if (!h.owner) p.own += h.value;
    p.holdings.push(h);
    plats.set(name, p);
    if (h.owner) held += h.value;
    else investOwn += h.value;
  };
  for (const s of pf.stocks) {
    put(s.plat, { name: `${s.tk} · ${s.name}`, kind: "Saham", value: s.lots * 100 * s.price, cost: s.lots * 100 * s.avg, owner: s.owner ?? "" });
  }
  for (const u of pf.us ?? []) {
    put(u.plat, { name: `${u.tk} · ${u.name}`, kind: "Saham AS", value: u.sh * u.price * fx, cost: u.costIdr ?? 0, owner: u.owner ?? "" });
  }
  for (const o of pf.others) {
    put(o.plat, { name: o.kind === "cash" ? "Kas sekuritas" : o.name, kind: o.kind === "cash" ? "Kas" : "Saham AS", value: o.value, cost: o.cost ?? o.value, owner: o.owner ?? "" });
  }
  for (const f of pf.funds) {
    const value = f.units ? f.units * (f.nav ?? 0) : (f.value ?? 0);
    put(f.plat, { name: f.name, kind: f.kind === "mm" ? "Reksa dana pasar uang" : "Reksa dana saham", value, cost: f.cost ?? value, owner: f.owner ?? "" });
  }
  for (const b of pf.bonds) {
    put(b.plat, { name: b.code, kind: "Obligasi negara", value: b.cost, cost: b.cost, owner: b.owner ?? "" });
  }
  const goldValue = pf.gold.grams * pf.gold.pricePerGram;
  if (goldValue > 0) {
    put("Emas fisik", { name: `Emas ${pf.gold.grams} gram`, kind: "Emas", value: goldValue, cost: goldValue, owner: pf.gold.owner ?? "" });
  }
  const titipManual = (pf.titip?.items ?? []).reduce((s, x) => s + (+x.amount || 0), 0);

  const liquid = cash.bank + cash.tunai + cash.ewallet + cash.lain;
  const debt = owed + scheduled;

  return {
    asOf: seed.tx.at ?? seed.builtAt ?? "",
    priceDate: pf.priceDate ?? "",
    accounts,
    cash,
    liquid,
    owed,
    scheduled,
    debt,
    investOwn,
    held: held + titipManual,
    net: liquid + investOwn - debt - titipManual,
    platforms: [...plats.values()].sort((a, b) => b.value - a.value),
    installments: [...inst.values()].sort((a, b) => b.total - a.total),
  };
}

export type Summary = ReturnType<typeof summarize>;

export type AccountTx = {
  date: string;
  title: string;
  detail: string;
  amount: number; // signed, from this account's point of view
  scheduled: boolean;
};

export function accountTransactions(seed: Seed, account: string, today: string): AccountTx[] {
  const out: AccountTx[] = [];
  for (const [date, acc, acc2, note, amount, type, desc] of seed.tx.rows) {
    const isTransfer = type === "T" || type === "R";
    if (acc !== account && !(isTransfer && acc2 === account)) continue;
    let sign = type === "I" ? 1 : -1;
    if (type === "T") sign = acc === account ? -1 : 1;
    if (type === "R") sign = acc === account ? 1 : -1;
    out.push({
      date,
      title: note || (isTransfer ? "Transfer" : acc2),
      detail: [isTransfer ? `${acc} → ${acc2}` : acc2, desc].filter(Boolean).join(" · "),
      amount: sign * amount,
      scheduled: date > today,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

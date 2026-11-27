const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(n: number): string {
  return rupiah.format(n);
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today in Asia/Jakarta as YYYY-MM-DD. */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Short form for tight spaces: Rp1,2 jt, Rp850 rb. */
export function formatCompact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  const f1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  const f2 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
  if (a >= 1e9) return `${sign}Rp${f2.format(a / 1e9)} M`;
  if (a >= 1e6) return `${sign}Rp${f1.format(a / 1e6)} jt`;
  if (a >= 1e3) return `${sign}Rp${Math.round(a / 1e3)} rb`;
  return `${sign}Rp${Math.round(a)}`;
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

import Link from "next/link";
import { AddTransactionSheet } from "@/components/add-sheet";
import { Amount } from "@/components/amount";
import { HideToggle, PageHeader } from "@/components/app-shell";
import { DeleteButton } from "@/components/delete-button";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { requireAuth } from "@/lib/auth";
import { listTransactions } from "@/lib/db";
import { formatDate, formatMonth, shiftMonth, todayJakarta } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default async function NotesPage({ searchParams }: PageProps<"/catatan">) {
  await requireAuth();

  const today = todayJakarta();
  const currentMonth = today.slice(0, 7);
  const raw = (await searchParams).month;
  const month =
    typeof raw === "string" && /^\d{4}-\d{2}$/.test(raw) && raw <= currentMonth
      ? raw
      : currentMonth;

  const all = await listTransactions();
  const inMonth = all.filter((t) => t.date.startsWith(month));
  const sum = (list: Transaction[], type: Transaction["type"]) =>
    list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const income = sum(inMonth, "income");
  const expense = sum(inMonth, "expense");

  const byCategory = new Map<string, number>();
  for (const t of inMonth) {
    if (t.type === "expense") {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const byDate = new Map<string, Transaction[]>();
  for (const t of inMonth) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const monthHref = (m: string) => (m === currentMonth ? "/catatan" : `/catatan?month=${m}`);

  return (
    <>
      <PageHeader
        title="Catatan"
        right={<HideToggle className="text-slate-500 active:bg-slate-100" />}
      />

      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between px-4">
          <Link href={monthHref(prev)} aria-label="Bulan sebelumnya" className="rounded-full p-2 text-slate-600 active:bg-slate-200">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-semibold text-slate-900">{formatMonth(month)}</h2>
          {month < currentMonth ? (
            <Link href={monthHref(next)} aria-label="Bulan berikutnya" className="rounded-full p-2 text-slate-600 active:bg-slate-200">
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span className="w-9" />
          )}
        </div>

        <div className="mx-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs text-slate-500">Pemasukan</p>
            <p className="mt-1 font-semibold text-emerald-700"><Amount value={income} /></p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs text-slate-500">Pengeluaran</p>
            <p className="mt-1 font-semibold text-rose-600"><Amount value={expense} /></p>
          </div>
        </div>

        {categories.length > 0 && (
          <section className="mx-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <h3 className="mb-3 text-sm font-semibold text-slate-500">Pengeluaran per kategori</h3>
            <ul className="space-y-3">
              {categories.map(([name, total]) => {
                const pct = expense ? (total / expense) * 100 : 0;
                return (
                  <li key={name}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span className="text-slate-700">{name}</span>
                      <span className="text-slate-500">
                        <Amount value={total} /> · {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h3 className="px-6 pb-2 text-sm font-semibold text-slate-500">Riwayat</h3>
          {byDate.size === 0 ? (
            <p className="mx-4 rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">
              Belum ada transaksi di bulan ini.
              <br />
              Ketuk tombol + untuk menambah.
            </p>
          ) : (
            <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
              {[...byDate.entries()].map(([date, items]) => (
                <div key={date}>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500">{formatDate(date)}</p>
                  <ul className="divide-y divide-slate-100">
                    {items.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 py-2.5 pr-2 pl-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{t.note || t.category}</p>
                          {t.note && <p className="text-xs text-slate-500">{t.category}</p>}
                        </div>
                        <Amount
                          value={t.type === "income" ? t.amount : -t.amount}
                          signed
                          className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-700" : "text-rose-600"}`}
                        />
                        <DeleteButton id={t.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddTransactionSheet defaultDate={month === currentMonth ? today : `${month}-01`} />
    </>
  );
}

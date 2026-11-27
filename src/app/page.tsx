import Link from "next/link";
import { logout } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { TransactionForm } from "@/components/transaction-form";
import { WalletIcon } from "@/components/wallet-icon";
import { requireAuth } from "@/lib/auth";
import { listTransactions } from "@/lib/db";
import {
  formatDate,
  formatMonth,
  formatRupiah,
  shiftMonth,
  todayJakarta,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default async function Home({ searchParams }: PageProps<"/">) {
  await requireAuth();

  const today = todayJakarta();
  const currentMonth = today.slice(0, 7);
  const raw = (await searchParams).month;
  const month =
    typeof raw === "string" && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonth;

  const all = await listTransactions();
  const inMonth = all.filter((t) => t.date.startsWith(month));

  const sum = (list: Transaction[], type: Transaction["type"]) =>
    list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const income = sum(inMonth, "income");
  const expense = sum(inMonth, "expense");
  const balance = sum(all, "income") - sum(all, "expense");

  const byCategory = new Map<string, number>();
  for (const t of inMonth) {
    if (t.type === "expense") {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const byDate = new Map<string, Transaction[]>();
  for (const t of inMonth) {
    byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
  }

  const defaultDate = month === currentMonth ? today : `${month}-01`;
  const nextMonth = shiftMonth(month, 1);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <WalletIcon className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">My Wallet</h1>
        </div>
        <form action={logout}>
          <button className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            Keluar
          </button>
        </form>
      </header>

      <section className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-sm">
        <p className="text-sm text-emerald-100">Total saldo</p>
        <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
          {formatRupiah(balance)}
        </p>
      </section>

      <nav className="mb-4 flex items-center justify-between">
        <Link
          href={`/?month=${shiftMonth(month, -1)}`}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          ‹ Sebelumnya
        </Link>
        <h2 className="font-semibold text-slate-900">{formatMonth(month)}</h2>
        {month < currentMonth ? (
          <Link
            href={nextMonth === currentMonth ? "/" : `/?month=${nextMonth}`}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Berikutnya ›
          </Link>
        ) : (
          <span className="w-[6.5rem]" />
        )}
      </nav>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pemasukan</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700 tabular-nums sm:text-xl">
            {formatRupiah(income)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pengeluaran</p>
          <p className="mt-1 text-lg font-semibold text-red-600 tabular-nums sm:text-xl">
            {formatRupiah(expense)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-slate-900">
              Tambah transaksi
            </h3>
            <TransactionForm defaultDate={defaultDate} />
          </section>

          {categories.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">
                Pengeluaran per kategori
              </h3>
              <ul className="space-y-3">
                {categories.map(([name, total]) => {
                  const pct = expense ? (total / expense) * 100 : 0;
                  return (
                    <li key={name}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="text-slate-700">{name}</span>
                        <span className="text-slate-500 tabular-nums">
                          {formatRupiah(total)} · {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white">
          <h3 className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">
            Riwayat transaksi
          </h3>
          {byDate.size === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              Belum ada transaksi di bulan ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {[...byDate.entries()].map(([date, items]) => (
                <div key={date}>
                  <p className="bg-slate-50 px-5 py-2 text-xs font-medium text-slate-500">
                    {formatDate(date)}
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {items.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {t.note || t.category}
                          </p>
                          {t.note && (
                            <p className="text-xs text-slate-500">
                              {t.category}
                            </p>
                          )}
                        </div>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            t.type === "income"
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {formatRupiah(t.amount)}
                        </p>
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
    </div>
  );
}

import { notFound } from "next/navigation";
import { Amount } from "@/components/amount";
import { HideToggle, PageHeader } from "@/components/app-shell";
import { Avatar } from "@/components/account-row";
import { requireAuth } from "@/lib/auth";
import { loadAccounts } from "@/lib/accounts";
import { formatDate, formatShortDate } from "@/lib/format";
import { decodeParam } from "@/lib/params";
import {
  GROUP_NAME,
  accountTransactions,
  type AccountTx,
} from "@/lib/neraca";

const HISTORY_LIMIT = 150;

export default async function AccountPage({ params }: PageProps<"/akun/[name]">) {
  await requireAuth();
  const name = decodeParam((await params).name);
  const data = await loadAccounts();
  if (!data) notFound();
  const { seed, today, summary: s } = data;
  const account = s.accounts.find((a) => a.name === name);
  if (!account) notFound();

  const isCard = account.group === "kredit";
  const txs = accountTransactions(seed, name, today);
  const upcoming = txs.filter((t) => t.scheduled).reverse().slice(0, 24);
  const history = txs.filter((t) => !t.scheduled).slice(0, HISTORY_LIMIT);
  const installments = s.installments.filter((i) => i.account === name);

  const byDate = new Map<string, AccountTx[]>();
  for (const t of history) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);

  return (
    <>
      <PageHeader
        title={name}
        back="/"
        right={<HideToggle className="text-slate-500 active:bg-slate-100" />}
      />

      <div className="space-y-4 py-4">
        <section className="mx-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-3">
            <Avatar name={name} tone={account.group} />
            <div>
              <p className="text-sm text-slate-500">
                {isCard ? "Tagihan berjalan" : `Saldo · ${GROUP_NAME[account.group]}`}
              </p>
              <p className={`text-2xl font-bold ${isCard || account.balance < 0 ? "text-rose-600" : "text-slate-900"}`}>
                <Amount value={isCard ? Math.max(0, -account.balance) : account.balance} />
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Chip label="Masuk 30 hr" value={<Amount value={account.in30} className="text-emerald-700" />} />
            <Chip label="Keluar 30 hr" value={<Amount value={account.out30} className="text-rose-600" />} />
            <Chip label="Pindah dana" value={<Amount value={account.moved30} signed />} />
          </div>
          {isCard && (
            <p className="mt-3 text-xs text-slate-500">
              Cicilan terjadwal <Amount value={s.scheduled} className="font-semibold text-slate-700" />, termasuk cicilan titipan bila ada.
            </p>
          )}
        </section>

        {installments.length > 0 && (
          <Card title="Cicilan berjalan">
            {installments.map((i) => (
              <li key={i.name} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{i.name}</p>
                  <p className="text-xs text-slate-500">
                    Sisa {i.left}
                    {i.of ? ` dari ${i.of}` : ""} kali · selesai {formatShortDate(i.end)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold"><Amount value={i.perMonth} /></p>
                  <p className="text-xs text-slate-500">per bulan</p>
                </div>
              </li>
            ))}
          </Card>
        )}

        {upcoming.length > 0 && !isCard && (
          <Card title="Terjadwal">
            {upcoming.map((t, i) => <TxItem key={i} t={t} showDate />)}
          </Card>
        )}

        <section>
          <h2 className="px-6 pb-2 text-sm font-semibold text-slate-500">Riwayat transaksi</h2>
          {byDate.size === 0 ? (
            <p className="mx-4 rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">
              Belum ada transaksi.
            </p>
          ) : (
            <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
              {[...byDate.entries()].map(([date, items]) => (
                <div key={date}>
                  <p className="bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500">
                    {formatDate(date)}
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {items.map((t, i) => <TxItem key={i} t={t} />)}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {txs.length - upcoming.length > HISTORY_LIMIT && (
            <p className="px-6 pt-2 text-center text-xs text-slate-400">
              Menampilkan {HISTORY_LIMIT} transaksi terakhir.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Chip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-semibold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-6 pb-2 text-sm font-semibold text-slate-500">{title}</h2>
      <ul className="mx-4 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        {children}
      </ul>
    </section>
  );
}

function TxItem({ t, showDate = false }: { t: AccountTx; showDate?: boolean }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
        <p className="truncate text-xs text-slate-500">
          {showDate ? `${formatShortDate(t.date)} · ` : ""}
          {t.detail}
        </p>
      </div>
      <Amount
        value={t.amount}
        signed
        className={`text-sm font-semibold ${t.amount > 0 ? "text-emerald-700" : "text-slate-900"}`}
      />
    </li>
  );
}

import Link from "next/link";
import { AccountRow, Section } from "@/components/account-row";
import { Amount } from "@/components/amount";
import { HideToggle } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { loadAccounts } from "@/lib/accounts";
import { formatCompact, formatShortDate } from "@/lib/format";
import { GROUP_NAME, type Group } from "@/lib/neraca";

const CASH_GROUPS: Group[] = ["bank", "ewallet", "tunai", "lain"];

export default async function AccountsPage() {
  await requireAuth();
  const data = await loadAccounts();

  if (!data) {
    return (
      <>
        <Hero />
        <div className="mx-4 -mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
          <h2 className="font-semibold text-slate-900">Belum ada data akun</h2>
          <p className="mt-1 text-sm text-slate-500">
            Impor berkas data.js dari Neraca Pribadi untuk melihat saldo semua
            akun Anda.
          </p>
          <Link
            href="/pengaturan"
            className="mt-4 inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Impor data
          </Link>
        </div>
      </>
    );
  }

  const s = data.summary;
  const cards = s.accounts.filter((a) => a.group === "kredit");

  return (
    <>
      <Hero>
        <p className="text-sm text-emerald-100">Total bersih</p>
        <p className="mt-0.5 text-[2rem] leading-tight font-bold tracking-tight">
          <Amount value={s.net} />
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Stat label="Kas" value={formatCompact(s.liquid)} />
          <Stat label="Investasi" value={formatCompact(s.investOwn)} />
          <Stat label="Utang" value={formatCompact(s.debt)} />
        </div>
      </Hero>

      <div className="-mt-6 space-y-4">
        {CASH_GROUPS.map((g) => {
          const list = s.accounts
            .filter((a) => a.group === g && Math.abs(a.balance) >= 1)
            .sort((a, b) => b.balance - a.balance);
          if (!list.length) return null;
          const total = list.reduce((t, a) => t + a.balance, 0);
          return (
            <Section key={g} title={GROUP_NAME[g]} total={<Amount value={total} />}>
              {list.map((a) => (
                <AccountRow
                  key={a.name}
                  href={`/akun/${encodeURIComponent(a.name)}`}
                  name={a.name}
                  tone={g}
                  sub={a.last ? `Terakhir ${formatShortDate(a.last)}` : undefined}
                  right={<Amount value={a.balance} className={a.balance < 0 ? "text-rose-600" : ""} />}
                />
              ))}
            </Section>
          );
        })}

        {(cards.length > 0 || s.scheduled > 0) && (
          <Section title="Kartu kredit" total={<Amount value={s.debt} className="text-rose-600" />}>
            {cards.map((a) => (
              <AccountRow
                key={a.name}
                href={`/akun/${encodeURIComponent(a.name)}`}
                name={a.name}
                tone="kredit"
                sub={`Cicilan terjadwal ${formatCompact(s.scheduled)}`}
                right={<Amount value={Math.max(0, -a.balance)} className="text-rose-600" />}
                rightSub="tagihan"
              />
            ))}
          </Section>
        )}

        {s.platforms.length > 0 && (
          <Section title="Investasi" total={<Amount value={s.investOwn} />}>
            {s.platforms.map((p) => (
              <AccountRow
                key={p.name}
                href={`/platform/${encodeURIComponent(p.name)}`}
                name={p.name}
                tone="invest"
                sub={`${p.holdings.length} aset${p.value - p.own > 0.5 ? ` · titipan ${formatCompact(p.value - p.own)}` : ""}`}
                right={<Amount value={p.own} />}
              />
            ))}
          </Section>
        )}

        <p className="px-6 pb-2 text-center text-xs leading-relaxed text-slate-400">
          Data transaksi per {formatShortDate(s.asOf)}, harga saham per{" "}
          {formatShortDate(s.priceDate)}.
          {s.held > 0.5 && ` Titipan ${formatCompact(s.held)} tidak dihitung.`}{" "}
          <Link href="/pengaturan" className="underline">
            Perbarui data
          </Link>
        </p>
      </div>
    </>
  );
}

function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-10 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Akun saya</h1>
        <HideToggle className="-mr-2 text-white/90 active:bg-white/15" />
      </div>
      {children}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-emerald-100">{label}</p>
      <p className="amt mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { Amount } from "@/components/amount";
import { Avatar } from "@/components/account-row";
import { HideToggle, PageHeader } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { getSeed } from "@/lib/db";
import { formatShortDate, todayJakarta } from "@/lib/format";
import { decodeParam } from "@/lib/params";
import { summarize } from "@/lib/neraca";

export default async function PlatformPage({ params }: PageProps<"/platform/[name]">) {
  await requireAuth();
  const name = decodeParam((await params).name);
  const seed = await getSeed();
  if (!seed) notFound();
  const s = summarize(seed, todayJakarta());
  const p = s.platforms.find((x) => x.name === name);
  if (!p) notFound();

  const holdings = [...p.holdings].sort((a, b) => b.value - a.value);
  const own = holdings.filter((h) => !h.owner);
  const gain = own.reduce((t, h) => t + h.value - h.cost, 0);
  const cost = own.reduce((t, h) => t + h.cost, 0);

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
            <Avatar name={name} tone="invest" />
            <div>
              <p className="text-sm text-slate-500">Milik sendiri</p>
              <p className="text-2xl font-bold text-slate-900"><Amount value={p.own} /></p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-slate-500">Untung/rugi</p>
              <p className={`mt-0.5 font-semibold ${gain < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                <Amount value={gain} signed />
                {cost > 0 && (
                  <span className="ml-1 font-normal">
                    ({gain < 0 ? "−" : "+"}
                    {Math.abs((gain / cost) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%)
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-slate-500">Titipan</p>
              <p className="mt-0.5 font-semibold"><Amount value={p.value - p.own} /></p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="px-6 pb-2 text-sm font-semibold text-slate-500">Aset</h2>
          <ul className="mx-4 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            {holdings.map((h, i) => {
              const pl = h.value - h.cost;
              return (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{h.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {h.kind}
                      {h.owner && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          Titipan {h.owner}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold"><Amount value={h.value} /></p>
                    {Math.abs(pl) >= 1 && (
                      <p className={`text-xs ${pl < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        <Amount value={pl} signed />
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="px-6 pt-2 text-center text-xs text-slate-400">
            Harga per {formatShortDate(s.priceDate)}. Obligasi dinilai sebesar modal.
          </p>
        </section>
      </div>
    </>
  );
}

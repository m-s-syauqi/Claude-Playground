import { logout, removeNeraca } from "@/app/actions";
import { PageHeader } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { requireAuth } from "@/lib/auth";
import { loadAccounts } from "@/lib/accounts";
import { formatShortDate } from "@/lib/format";

export default async function SettingsPage() {
  await requireAuth();
  const seed = (await loadAccounts())?.seed;

  return (
    <>
      <PageHeader title="Pengaturan" />
      <div className="space-y-4 py-4">
        <Card title="Data akun (Neraca Pribadi)">
          {seed ? (
            <p className="mb-4 text-sm text-slate-600">
              Data transaksi per <b>{formatShortDate(seed.tx.at ?? seed.builtAt ?? "")}</b>,{" "}
              {seed.tx.rows.length.toLocaleString("id-ID")} transaksi. Harga
              saham per {formatShortDate(seed.portfolio.priceDate ?? "")}.
            </p>
          ) : (
            <p className="mb-4 text-sm text-slate-600">
              Belum ada data. Pilih berkas <b>data.js</b> dari artifact Neraca
              Pribadi untuk menampilkan saldo akun.
            </p>
          )}
          <ImportForm hasData={!!seed} />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Data disimpan di database aplikasi ini, tidak di GitHub. Impor ulang
            berkas terbaru kapan saja untuk memperbarui saldo.
          </p>
          {seed && (
            <form action={removeNeraca} className="mt-3">
              <button className="w-full rounded-full py-2.5 text-sm font-medium text-rose-600 active:bg-rose-50">
                Hapus data akun
              </button>
            </form>
          )}
        </Card>

        <Card title="Pasang di layar utama">
          <ul className="space-y-2 text-sm text-slate-600">
            <li><b>iPhone (Safari):</b> ketuk tombol Bagikan, lalu <i>Tambahkan ke Layar Utama</i>.</li>
            <li><b>Android (Chrome):</b> ketuk menu ⋮, lalu <i>Instal aplikasi</i> atau <i>Tambahkan ke layar utama</i>.</li>
          </ul>
        </Card>

        <Card title="Keamanan">
          <p className="text-sm text-slate-600">
            PIN 6 angka diatur lewat variabel <code className="rounded bg-slate-100 px-1">APP_PIN</code> di
            Vercel. PIN diminta setiap kali aplikasi dibuka, setelah keluar dari
            aplikasi lebih dari 30 detik, atau setelah 10 menit tidak dipakai.
            Setelah 5 kali salah, aplikasi terkunci 15 menit.
          </p>
          <form action={logout} className="mt-4">
            <button className="w-full rounded-full border border-slate-300 py-2.5 font-medium text-slate-700 active:bg-slate-50">
              Keluar
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

import type { Metadata } from "next";
import { PinPad } from "@/components/pin-pad";
import { configProblems } from "@/lib/auth";

// Read settings at request time so the warning below stays current.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Masuk · My Wallet" };

export default function LoginPage() {
  const problems = configProblems();
  const isPreview = process.env.VERCEL_ENV === "preview";
  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-emerald-700 to-emerald-900 px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      {(problems.length > 0 || isPreview) && (
        <div role="note" className="mb-6 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
          {isPreview && (
            <p>
              Ini deployment <b>Preview</b>. Variabel yang hanya dicentang untuk
              Production tidak terbaca di sini. Buka alamat Production, atau
              centang juga Preview.
            </p>
          )}
          {problems.length > 0 && (
            <>
              <p className={isPreview ? "mt-2" : ""}>
                Pengaturan di Vercel belum lengkap:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="mt-1">Tambahkan di Settings → Environment Variables, lalu redeploy.</p>
            </>
          )}
        </div>
      )}
      <PinPad />
    </main>
  );
}

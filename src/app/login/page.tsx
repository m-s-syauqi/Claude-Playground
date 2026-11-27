import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { WalletIcon } from "@/components/wallet-icon";

export const metadata: Metadata = { title: "Masuk · My Wallet" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <WalletIcon />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">My Wallet</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan password untuk melanjutkan
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

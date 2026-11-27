import type { Metadata } from "next";
import { PinPad } from "@/components/pin-pad";

export const metadata: Metadata = { title: "Masuk · My Wallet" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-emerald-700 to-emerald-900 px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <PinPad />
    </main>
  );
}

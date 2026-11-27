import type { Metadata } from "next";
import { PinPad } from "@/components/pin-pad";

export const metadata: Metadata = { title: "Masuk · My Wallet" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col bg-white px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <PinPad />
    </main>
  );
}

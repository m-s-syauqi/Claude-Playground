import { BottomNav } from "@/components/app-shell";
import { AutoLock } from "@/components/auto-lock";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
      <AutoLock />
    </>
  );
}

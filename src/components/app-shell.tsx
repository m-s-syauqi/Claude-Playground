"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, EyeIcon, GearIcon, ListIcon, WalletIcon } from "./icons";

const TABS = [
  { href: "/", label: "Akun", Icon: WalletIcon },
  { href: "/catatan", label: "Catatan", Icon: ListIcon },
  { href: "/pengaturan", label: "Pengaturan", Icon: GearIcon },
];

export function BottomNav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/"
      ? path === "/" || path.startsWith("/akun") || path.startsWith("/platform")
      : path.startsWith(href);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {TABS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active(href) ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const HIDE_EVENT = "mw-hide-change";

function subscribeHide(cb: () => void) {
  window.addEventListener(HIDE_EVENT, cb);
  return () => window.removeEventListener(HIDE_EVENT, cb);
}

export function HideToggle({ className = "" }: { className?: string }) {
  const hidden = useSyncExternalStore(
    subscribeHide,
    () => document.documentElement.classList.contains("hide-amt"),
    () => false,
  );
  function toggle() {
    const next = !hidden;
    document.documentElement.classList.toggle("hide-amt", next);
    try {
      localStorage.setItem("mw-hide", next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event(HIDE_EVENT));
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? "Tampilkan angka" : "Sembunyikan angka"}
      className={`rounded-full p-2 ${className}`}
    >
      <EyeIcon off={hidden} />
    </button>
  );
}

export function PageHeader({
  title,
  back,
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-slate-200 bg-white px-2 pt-[env(safe-area-inset-top)]">
      {back ? (
        <Link href={back} aria-label="Kembali" className="rounded-full p-2 text-slate-700">
          <ChevronLeft />
        </Link>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="min-w-0 flex-1 truncate py-3.5 text-lg font-semibold text-slate-900">
        {title}
      </h1>
      {right}
    </header>
  );
}

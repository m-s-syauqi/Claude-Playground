import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "./icons";

const TONES: Record<string, string> = {
  bank: "bg-sky-100 text-sky-700",
  tunai: "bg-amber-100 text-amber-700",
  ewallet: "bg-violet-100 text-violet-700",
  kredit: "bg-rose-100 text-rose-700",
  invest: "bg-emerald-100 text-emerald-700",
  lain: "bg-slate-200 text-slate-600",
};

export function Avatar({ name, tone }: { name: string; tone: string }) {
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${TONES[tone] ?? TONES.lain}`}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}

export function AccountRow({
  href,
  name,
  tone,
  sub,
  right,
  rightSub,
}: {
  href: string;
  name: string;
  tone: string;
  sub?: ReactNode;
  right: ReactNode;
  rightSub?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 active:bg-slate-50"
      >
        <Avatar name={name} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{name}</p>
          {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{right}</p>
          {rightSub && <p className="text-xs text-slate-500">{rightSub}</p>}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </Link>
    </li>
  );
}

export function Section({
  title,
  total,
  children,
}: {
  title: string;
  total?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <header className="flex items-baseline justify-between px-4 pt-3.5 pb-1">
        <h2 className="text-sm font-semibold text-slate-500">{title}</h2>
        {total && <span className="text-sm font-semibold text-slate-900">{total}</span>}
      </header>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </section>
  );
}

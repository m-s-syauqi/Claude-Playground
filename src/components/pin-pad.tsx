"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { login, type PinState } from "@/app/actions";
import { BackspaceIcon, WalletIcon } from "@/components/icons";

const LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinPad() {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<PinState>({});
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  const lockedFor = state.lockedUntil
    ? Math.max(0, Math.ceil((state.lockedUntil - now) / 1000))
    : 0;
  const locked = lockedFor > 0;

  useEffect(() => {
    if (!state.lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.lockedUntil]);

  const submit = useCallback((value: string) => {
    startTransition(async () => {
      let result: PinState;
      try {
        result = await login(value);
      } catch {
        result = { error: "Tidak bisa terhubung ke server. Coba lagi." };
      }
      // On success login() redirects, so we only get here on failure.
      setState(result);
      setNow(Date.now());
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    });
  }, []);

  const press = useCallback(
    (key: string) => {
      if (pending || locked) return;
      if (key === "del") {
        setPin((p) => p.slice(0, -1));
        return;
      }
      setPin((p) => {
        if (p.length >= LENGTH) return p;
        const next = p + key;
        if (next.length === LENGTH) submit(next);
        return next;
      });
    },
    [pending, locked, submit],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  let message = "Masukkan PIN Anda";
  if (locked) {
    const m = Math.floor(lockedFor / 60);
    const s = String(lockedFor % 60).padStart(2, "0");
    message = `Terlalu banyak percobaan. Coba lagi dalam ${m}:${s}`;
  } else if (state.error) {
    message =
      state.triesLeft !== undefined
        ? `${state.error} Sisa ${state.triesLeft} percobaan.`
        : state.error;
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
        <WalletIcon className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-semibold">My Wallet</h1>
      <p
        role="status"
        className={`mt-2 min-h-10 max-w-64 text-center text-sm ${
          state.error && !pending ? "text-amber-200" : "text-emerald-100"
        }`}
      >
        {pending ? "Memeriksa…" : message}
      </p>

      <div
        className={`my-8 flex gap-4 ${shake ? "shake" : ""}`}
        aria-label={`${pin.length} dari ${LENGTH} angka`}
      >
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-white transition ${
              i < pin.length ? "bg-white" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="mt-auto grid w-full max-w-72 grid-cols-3 gap-y-4">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              disabled={pending || locked}
              aria-label={k === "del" ? "Hapus" : k}
              className={`mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-2xl font-medium transition active:scale-95 disabled:opacity-40 ${
                k === "del" ? "" : "bg-white/10 active:bg-white/25"
              }`}
            >
              {k === "del" ? <BackspaceIcon /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

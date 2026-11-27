"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { login, type PinState } from "@/app/actions";
import { BackspaceIcon, WalletIcon } from "@/components/icons";

const LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinPad() {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<PinState>({});
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pinRef = useRef("");
  const busy = useRef(false);

  const lockedFor = state.lockedUntil
    ? Math.max(0, Math.ceil((state.lockedUntil - now) / 1000))
    : 0;
  const locked = lockedFor > 0;

  useEffect(() => {
    if (!state.lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.lockedUntil]);

  const submit = useCallback(async (value: string) => {
    busy.current = true;
    setChecking(true);
    let result: PinState;
    try {
      result = await login(value);
    } catch {
      result = { error: "Tidak bisa terhubung ke server. Coba lagi." };
    }
    // On success login() redirects, so we only get here on failure.
    busy.current = false;
    setChecking(false);
    setState(result);
    setNow(Date.now());
    pinRef.current = "";
    setPin("");
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }, []);

  const press = useCallback(
    (key: string) => {
      if (busy.current || locked) return;
      if (key === "del") {
        pinRef.current = pinRef.current.slice(0, -1);
      } else if (pinRef.current.length < LENGTH) {
        pinRef.current += key;
        try {
          navigator.vibrate?.(8);
        } catch {}
      }
      setPin(pinRef.current);
      if (pinRef.current.length === LENGTH) void submit(pinRef.current);
    },
    [locked, submit],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  let message = "Masukkan PIN";
  let warn = false;
  if (checking) {
    message = "Memeriksa…";
  } else if (locked) {
    const m = Math.floor(lockedFor / 60);
    const s = String(lockedFor % 60).padStart(2, "0");
    message = `Terlalu banyak percobaan. Coba lagi dalam ${m}:${s}`;
    warn = true;
  } else if (state.error) {
    message =
      state.triesLeft !== undefined
        ? `${state.error} Sisa ${state.triesLeft} percobaan.`
        : state.error;
    warn = true;
  }

  return (
    <div className="flex flex-1 flex-col items-center select-none">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <WalletIcon className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900">My Wallet</h1>
      <p
        role="status"
        className={`mt-1 min-h-10 max-w-72 text-center text-sm ${warn ? "text-rose-600" : "text-slate-500"}`}
      >
        {message}
      </p>

      <div
        className={`my-6 flex gap-4 ${shake ? "shake" : ""}`}
        aria-label={`${pin.length} dari ${LENGTH} angka`}
      >
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full ${
              i < pin.length ? "bg-emerald-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <div className="mt-auto grid w-full max-w-80 grid-cols-3 gap-3 [touch-action:manipulation]">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              aria-label={k === "del" ? "Hapus" : k}
              // React on touch-down so taps register instantly.
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                press(k);
              }}
              // Keyboard activation (Enter/Space) arrives as a click with detail 0.
              onClick={(e) => {
                if (e.detail === 0) press(k);
              }}
              disabled={locked}
              className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-medium text-slate-900 disabled:opacity-40 ${
                k === "del"
                  ? "text-slate-500 active:bg-slate-100"
                  : "bg-slate-100 active:bg-slate-300"
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

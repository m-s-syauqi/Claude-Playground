"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions";

// Leaving the app (switching apps, locking the phone) for longer than this
// asks for the PIN again on return.
const LOCK_AFTER_MS = 30_000;
const HIDDEN_KEY = "mw-hidden-at";
const PAUSE_KEY = "mw-lock-paused-at";

/** Call before opening the file picker, which hides the page for a while. */
export function pauseAutoLock() {
  try {
    localStorage.setItem(PAUSE_KEY, String(Date.now()));
  } catch {}
}

function read(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function AutoLock() {
  useEffect(() => {
    let locking = false;
    const lock = () => {
      if (locking) return;
      locking = true;
      void logout();
    };
    const checkReturn = () => {
      const hiddenAt = read(HIDDEN_KEY);
      try {
        localStorage.removeItem(HIDDEN_KEY);
      } catch {}
      const paused = Date.now() - read(PAUSE_KEY) < 5 * 60_000;
      if (hiddenAt && !paused && Date.now() - hiddenAt > LOCK_AFTER_MS) lock();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        try {
          localStorage.setItem(HIDDEN_KEY, String(Date.now()));
        } catch {}
      } else {
        checkReturn();
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // Restored from the back-forward cache: treat like a return.
      if (e.persisted) checkReturn();
    };

    // The app may have been closed while in the background.
    checkReturn();
    try {
      localStorage.removeItem(PAUSE_KEY);
    } catch {}
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  return null;
}

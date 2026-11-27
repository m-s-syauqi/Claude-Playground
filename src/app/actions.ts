"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import {
  checkPin,
  configProblems,
  endSession,
  requireAuth,
  startSession,
} from "@/lib/auth";
import {
  clearPinFail,
  deleteSeed,
  deleteTransaction,
  getPinFail,
  saveSeed,
  saveTransaction,
  setPinFail,
} from "@/lib/db";
import { cookies } from "next/headers";
import { SEED_VERSION_COOKIE } from "@/lib/accounts";
import { parseSeed } from "@/lib/neraca";
import { CATEGORIES, type TxType } from "@/lib/types";

export type FormState = { error?: string; ok?: number };

const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

export type PinState = { error?: string; triesLeft?: number; lockedUntil?: number };

export async function login(pin: string): Promise<PinState> {
  const problems = configProblems();
  if (problems.length) {
    return {
      error: `Pengaturan di Vercel belum lengkap: ${problems.join(", ")}. Lengkapi lalu redeploy.`,
    };
  }

  try {
    const fail = await getPinFail();
    if (fail.lockedUntil > Date.now()) {
      return { error: "Terlalu banyak percobaan.", lockedUntil: fail.lockedUntil };
    }

    if (typeof pin !== "string" || !checkPin(pin)) {
      // Slow down guessing, and lock after several wrong PINs in a row.
      await new Promise((r) => setTimeout(r, 800));
      const count = fail.count + 1;
      const lockedUntil =
        count % MAX_TRIES === 0 ? Date.now() + LOCK_MINUTES * 60_000 : 0;
      await setPinFail({ count, lockedUntil }, 24 * 60 * 60);
      if (lockedUntil) {
        return { error: "Terlalu banyak percobaan.", lockedUntil };
      }
      return { error: "PIN salah.", triesLeft: MAX_TRIES - (count % MAX_TRIES) };
    }

    await clearPinFail();
    await startSession();
  } catch (e) {
    console.error("login failed", e);
    return {
      error: `Gagal masuk: ${e instanceof Error ? e.message : "kesalahan server"}`,
    };
  }
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function addTransaction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const type = formData.get("type") as TxType;
  if (type !== "income" && type !== "expense") {
    return { error: "Jenis transaksi tidak valid." };
  }

  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, ""));
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { error: "Jumlah harus lebih dari 0." };
  }

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES[type].includes(category)) {
    return { error: "Pilih kategori." };
  }

  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Tanggal tidak valid." };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  await saveTransaction({
    id: randomUUID(),
    type,
    amount,
    category,
    note,
    date,
    createdAt: Date.now(),
  });
  refresh();
  return { ok: Date.now() };
}

export async function removeTransaction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteTransaction(id);
  refresh();
}

export async function importNeraca(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih berkas data.js dulu." };
  }
  try {
    const seed = parseSeed(await file.text());
    const version = await saveSeed(seed);
    (await cookies()).set(SEED_VERSION_COOKIE, version, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch (e) {
    return {
      error:
        e instanceof SyntaxError
          ? "Isi berkas tidak bisa dibaca. Pastikan ini data.js dari Neraca Pribadi."
          : e instanceof Error
            ? e.message
            : "Gagal mengimpor data.",
    };
  }
  refresh();
  return { ok: Date.now() };
}

export async function removeNeraca() {
  await requireAuth();
  await deleteSeed();
  // Make other server instances drop their cached copy for this device.
  (await cookies()).set(SEED_VERSION_COOKIE, "deleted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  refresh();
}

"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { checkPassword, endSession, requireAuth, startSession } from "@/lib/auth";
import { deleteTransaction, saveTransaction } from "@/lib/db";
import { CATEGORIES, type TxType } from "@/lib/types";

export type FormState = { error?: string; ok?: number };

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "Password salah." };
  }
  await startSession();
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

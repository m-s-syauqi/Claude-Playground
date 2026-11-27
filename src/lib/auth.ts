import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session";

export const PIN_LENGTH = 6;

export function getConfiguredPin(): string {
  const pin = process.env.APP_PIN ?? "";
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) {
    throw new Error(`APP_PIN belum diatur atau bukan ${PIN_LENGTH} angka.`);
  }
  return pin;
}

/** Settings the app needs on Vercel, named without revealing values. */
export function configProblems(): string[] {
  const env = process.env;
  const problems: string[] = [];
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(env.APP_PIN ?? "")) {
    problems.push(`APP_PIN (harus ${PIN_LENGTH} angka)`);
  }
  if ((env.SESSION_SECRET ?? "").length < 32) {
    problems.push("SESSION_SECRET (minimal 32 karakter)");
  }
  const hasRedis =
    (env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL) &&
    (env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN);
  if (env.VERCEL && !hasRedis) {
    problems.push("database Upstash Redis (KV_REST_API_URL dan KV_REST_API_TOKEN)");
  }
  return problems;
}

export function checkPin(input: string): boolean {
  // Hash both sides so lengths match and comparison is constant-time.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(getConfiguredPin()).digest();
  return timingSafeEqual(a, b);
}

export async function startSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Call at the start of every page and server action that touches data. */
export async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/login");
}

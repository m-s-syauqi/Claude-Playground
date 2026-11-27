import "server-only";
import { cookies } from "next/headers";
import { getSeed } from "./db";
import { todayJakarta } from "./format";
import { summarize, type Seed, type Summary } from "./neraca";

/** Cookie holding the version of the last import made from this device. */
export const SEED_VERSION_COOKIE = "mw_seed_v";

let summaryCache: { key: string; summary: Summary } | null = null;

/** Imported data plus its account summary for today, reusing cached work. */
export async function loadAccounts(): Promise<{
  seed: Seed;
  version: string;
  summary: Summary;
  today: string;
} | null> {
  const want = (await cookies()).get(SEED_VERSION_COOKIE)?.value;
  const stored = await getSeed(want);
  if (!stored) return null;
  const today = todayJakarta();
  const key = `${stored.version}|${today}`;
  if (summaryCache?.key !== key) {
    summaryCache = { key, summary: summarize(stored.seed, today) };
  }
  return { ...stored, summary: summaryCache.summary, today };
}

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { Seed } from "./neraca";
import type { Transaction } from "./types";

// Production: Upstash Redis (Vercel Marketplace) stores each transaction in
// one hash. Local development without Redis: a JSON file in .data/.

const HASH_KEY = "mywallet:transactions";

interface Store {
  all(): Promise<Transaction[]>;
  put(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
  getValue<T>(key: string): Promise<T | null>;
  setValue(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  deleteValue(key: string): Promise<void>;
}

function redisStore(url: string, token: string): Store {
  const redis = new Redis({ url, token });
  return {
    async all() {
      const data = await redis.hgetall<Record<string, Transaction>>(HASH_KEY);
      return data ? Object.values(data) : [];
    },
    async put(tx) {
      await redis.hset(HASH_KEY, { [tx.id]: tx });
    },
    async remove(id) {
      await redis.hdel(HASH_KEY, id);
    },
    async getValue<T>(key: string) {
      return (await redis.get<T>(key)) ?? null;
    },
    async setValue(key, value, ttlSeconds) {
      if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
      else await redis.set(key, value);
    },
    async deleteValue(key) {
      await redis.del(key);
    },
  };
}

function fileStore(): Store {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "transactions.json");
  const valueFile = (key: string) =>
    path.join(dir, `${key.replace(/[^a-z0-9-]/gi, "_")}.json`);
  async function read(): Promise<Record<string, Transaction>> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  }
  async function write(data: Record<string, Transaction>) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  }
  return {
    async all() {
      return Object.values(await read());
    },
    async put(tx) {
      const data = await read();
      data[tx.id] = tx;
      await write(data);
    },
    async remove(id) {
      const data = await read();
      delete data[id];
      await write(data);
    },
    async getValue<T>(key: string) {
      try {
        const { value, expiresAt } = JSON.parse(
          await fs.readFile(valueFile(key), "utf8"),
        );
        if (expiresAt && expiresAt < Date.now()) return null;
        return value as T;
      } catch {
        return null;
      }
    },
    async setValue(key, value, ttlSeconds) {
      await fs.mkdir(dir, { recursive: true });
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
      await fs.writeFile(valueFile(key), JSON.stringify({ value, expiresAt }));
    },
    async deleteValue(key) {
      await fs.rm(valueFile(key), { force: true });
    },
  };
}

let store: Store | null = null;

function getStore(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    store = redisStore(url, token);
  } else if (process.env.VERCEL) {
    throw new Error(
      "Database belum terhubung. Tambahkan Upstash Redis dari Vercel Marketplace ke project ini.",
    );
  } else {
    store = fileStore();
  }
  return store;
}

export async function listTransactions(): Promise<Transaction[]> {
  const items = await getStore().all();
  return items.sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
}

export async function saveTransaction(tx: Transaction) {
  await getStore().put(tx);
}

export async function deleteTransaction(id: string) {
  await getStore().remove(id);
}

// Neraca Pribadi data, imported from the artifact's data.js. It is about
// 200 KB, so each server instance keeps a copy in memory instead of reading
// it from Redis on every page. The version lets a page ask for a newer copy
// right after an import.
const SEED_KEY = "mywallet:neraca";
const SEED_CACHE_MS = 10 * 60_000;
type StoredSeed = { version: string; seed: Seed };
let seedCache: (StoredSeed & { loadedAt: number }) | null = null;

export async function getSeed(
  wantVersion?: string,
): Promise<StoredSeed | null> {
  if (
    seedCache &&
    Date.now() - seedCache.loadedAt < SEED_CACHE_MS &&
    (!wantVersion || seedCache.version === wantVersion)
  ) {
    return seedCache;
  }
  const raw = await getStore().getValue<StoredSeed | Seed>(SEED_KEY);
  // Data imported before versioning was stored as the bare seed.
  const stored = !raw ? null : "seed" in raw ? raw : { version: "0", seed: raw };
  seedCache = stored ? { ...stored, loadedAt: Date.now() } : null;
  return stored;
}

export async function saveSeed(seed: Seed): Promise<string> {
  const version = String(Date.now());
  await getStore().setValue(SEED_KEY, { version, seed });
  seedCache = { version, seed, loadedAt: Date.now() };
  return version;
}

export async function deleteSeed() {
  await getStore().deleteValue(SEED_KEY);
  seedCache = null;
}

// Failed PIN attempts, for the lockout.
const PIN_FAIL_KEY = "mywallet:pin-fail";
export type PinFail = { count: number; lockedUntil: number };

export async function getPinFail(): Promise<PinFail> {
  return (
    (await getStore().getValue<PinFail>(PIN_FAIL_KEY)) ?? {
      count: 0,
      lockedUntil: 0,
    }
  );
}

export async function setPinFail(value: PinFail, ttlSeconds: number) {
  await getStore().setValue(PIN_FAIL_KEY, value, ttlSeconds);
}

export async function clearPinFail() {
  await getStore().deleteValue(PIN_FAIL_KEY);
}

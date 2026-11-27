import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { Transaction } from "./types";

// Production: Upstash Redis (Vercel Marketplace) stores each transaction in
// one hash. Local development without Redis: a JSON file in .data/.

const HASH_KEY = "mywallet:transactions";

interface Store {
  all(): Promise<Transaction[]>;
  put(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
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
  };
}

function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "transactions.json");
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

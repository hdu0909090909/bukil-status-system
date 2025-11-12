// app/lib/redis.ts
type Json = any;

type KV = {
  get(key: string): Promise<Json | null>;
  set(key: string, value: Json): Promise<"OK">;
  del(key: string): Promise<number>;
  mget(keys: string[]): Promise<(Json | null)[]>;
  mset(pairs: Record<string, Json>): Promise<"OK">;
};

const g = globalThis as any;
if (!g.__kv) g.__kv = new Map<string, string>();

function toStr(v: Json) {
  return typeof v === "string" ? v : JSON.stringify(v);
}
function toJson(v: string | undefined): Json | null {
  if (v === undefined) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v ?? null;
  }
}

export const redis: KV = {
  async get(key) {
    return toJson(g.__kv.get(key));
  },
  async set(key, value) {
    g.__kv.set(key, toStr(value));
    return "OK";
  },
  async del(key) {
    return g.__kv.delete(key) ? 1 : 0;
  },
  async mget(keys) {
    return keys.map((k: string) => toJson(g.__kv.get(k)));
  },
  async mset(pairs) {
    for (const [k, v] of Object.entries(pairs)) g.__kv.set(k, toStr(v));
    return "OK";
  },
};

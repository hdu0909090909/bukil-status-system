// app/lib/redis.ts
import { Redis } from "@upstash/redis";

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const redis = {
  async get<T = unknown>(key: string): Promise<T | null> {
    return (await client.get(key)) as T | null;
  },

  async set<T = unknown>(key: string, value: T): Promise<"OK"> {
    await client.set(key, value);
    return "OK";
  },

  async del(key: string): Promise<number> {
    await client.del(key);
    return 1;
  },

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    return (await client.mget(...keys)) as (T | null)[];
  },

  async mset<T = unknown>(pairs: Record<string, T>): Promise<"OK"> {
    const entries = Object.entries(pairs);
    await Promise.all(entries.map(([k, v]) => client.set(k, v)));
    return "OK";
  },

  // ✅ 추가: 락용 (NX + EX)
  async setNxEx(
    key: string,
    value: string,
    exSeconds: number
  ): Promise<"OK" | null> {
    // Upstash Redis는 set에 옵션 객체를 받음
    return (await client.set(key, value, { nx: true, ex: exSeconds })) as
      | "OK"
      | null;
  },
};

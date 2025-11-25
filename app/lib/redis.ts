import { Redis } from "@upstash/redis";

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type Json = any;

export const redis = {
  async get(key: string): Promise<Json | null> {
    return await client.get(key);
  },

  async set(key: string, value: Json): Promise<"OK"> {
    await client.set(key, value);
    return "OK";
  },

  async del(key: string): Promise<number> {
    await client.del(key);
    return 1;
  },

  async mget(keys: string[]): Promise<(Json | null)[]> {
    return await client.mget(...keys);
  },

  // 🔥 여기만 이렇게 고쳐 쓰면 됨
  async mset(pairs: Record<string, Json>): Promise<"OK"> {
    const entries = Object.entries(pairs);
    await Promise.all(entries.map(([key, value]) => client.set(key, value)));
    return "OK";
  },
};

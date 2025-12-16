import { Redis } from "@upstash/redis";

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type Json = any;

type SetOpts = {
  ex?: number; // seconds
  px?: number; // ms
  nx?: boolean;
  xx?: boolean;
};

export const redis = {
  async get(key: string): Promise<Json | null> {
    return await client.get(key);
  },

  // ✅ 옵션 지원 (nx/xx + ex/px)
  async set(key: string, value: Json, opts?: SetOpts): Promise<"OK" | null> {
    // Upstash REST는 set(key, value, opts) 지원
    // nx/xx를 쓰면 "OK" 대신 null이 올 수 있음
    // (nx=true인데 이미 key 있으면 null)
    // opts 없으면 "OK"
    // @ts-ignore - 라이브러리 타입이 구버전이면 opts 타입이 빡셀 수 있어서 안전장치
    return await (client as any).set(key, value, opts);
  },

  async del(key: string): Promise<number> {
    await client.del(key);
    return 1;
  },

  async mget(keys: string[]): Promise<(Json | null)[]> {
    return await client.mget(...keys);
  },

  async mset(pairs: Record<string, Json>): Promise<"OK"> {
    const entries = Object.entries(pairs);
    await Promise.all(entries.map(([key, value]) => client.set(key, value)));
    return "OK";
  },
};

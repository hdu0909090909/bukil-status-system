// app/lib/redis.ts
import { Redis } from "@upstash/redis";

// 환경변수 있는지 먼저 본다
const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// 메모리 폴백을 글로벌에 박아두자 (dev에서 리로드돼도 유지)
const g = globalThis as unknown as {
  __memoryRedis?: Map<string, any>;
};

if (!g.__memoryRedis) {
  g.__memoryRedis = new Map();
}

const memory = g.__memoryRedis;

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : {
      // upstash랑 인터페이스 비슷하게
      async get(key: string) {
        return memory.get(key) ?? null;
      },
      async set(key: string, value: any) {
        memory.set(key, value);
        return "OK";
      },
    };

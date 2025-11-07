// app/lib/redis.ts
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

// Upstash REST로 간단히 GET/SET 하는 유틸
export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    // env 없으면 null
    return null;
  }

  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  // Upstash get은 { result: "string" } 이런 식이라 한번 까야 함
  if (!data.result) return null;
  try {
    return JSON.parse(data.result) as T;
  } catch {
    return data.result as T;
  }
}

export async function redisSet(key: string, value: unknown) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return;
  }

  await fetch(`${REDIS_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
}

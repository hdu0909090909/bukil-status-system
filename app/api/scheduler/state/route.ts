import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

const KEY = "scheduler:enabled";

export async function GET() {
  const v = await redis.get(KEY);
  const enabled = v === null ? true : v === true || v === "true" || v === 1 || v === "1";
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const enabled = !!body.enabled;
  await redis.set(KEY, enabled);
  return NextResponse.json({ ok: true, enabled });
}

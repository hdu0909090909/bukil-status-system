// app/api/scheduler/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, SCHED_KEY_PREFIX, STUDENTS_KEY } from "@/app/lib/seed";

// GET /api/scheduler?day=mon&slot=8교시
export async function GET(req: NextRequest) {
  await ensureSeed();
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  const slot = searchParams.get("slot");

  if (!day || !slot) {
    return NextResponse.json({ ok: false, message: "day, slot이 필요합니다." }, { status: 400 });
  }

  const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
  const plan = await redis.get(key);

  return NextResponse.json(plan ?? { day, slot, items: [] });
}

// POST /api/scheduler  { day, slot, items: [...] }
export async function POST(req: NextRequest) {
  await ensureSeed();
  const { day, slot, items } = await req.json();

  if (!day || !slot || !Array.isArray(items)) {
    return NextResponse.json({ ok: false, message: "day, slot, items가 필요합니다." }, { status: 400 });
  }

  const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
  await redis.set(key, { day, slot, items });

  return NextResponse.json({ ok: true });
}

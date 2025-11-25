// app/api/scheduler/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, SCHED_KEY_PREFIX } from "@/app/lib/seed";

type SchedulerItem = {
  studentId: string;
  name: string;
  status: string; // "변경안함" 포함
  reason: string;
};

type SchedulerPlan = {
  day: string;
  slot: string;
  items: SchedulerItem[];
};

// GET /api/scheduler?day=mon&slot=8교시
export async function GET(req: NextRequest) {
  try {
    await ensureSeed();
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    const slot = searchParams.get("slot");

    if (!day || !slot) {
      return NextResponse.json(
        { ok: false, message: "day와 slot이 필요합니다." },
        { status: 400 },
      );
    }

    const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
    const plan = (await redis.get(key)) as SchedulerPlan | null;

    return NextResponse.json(
      plan ?? { day, slot, items: [] },
      { status: 200 },
    );
  } catch (e) {
    console.error("[scheduler GET] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

// POST /api/scheduler  → 저장
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json();
    const { day, slot, items } = body as SchedulerPlan;

    if (!day || !slot || !Array.isArray(items)) {
      return NextResponse.json(
        { ok: false, message: "day, slot, items가 필요합니다." },
        { status: 400 },
      );
    }

    const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
    await redis.set(key, { day, slot, items });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[scheduler POST] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

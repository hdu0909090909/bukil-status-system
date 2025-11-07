// app/api/scheduler/route.ts
import { NextRequest, NextResponse } from "next/server";
import { schedulerStore } from "../../lib/data";

// GET /api/scheduler?day=mon&slot=8교시
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  const slot = searchParams.get("slot");

  if (!day || !slot) {
    return NextResponse.json(
      { ok: false, message: "day와 slot이 필요합니다." },
      { status: 400 }
    );
  }

  const key = `${day}|${slot}`;
  const plan = schedulerStore[key];

  return NextResponse.json(
    plan ?? { day, slot, items: [] },
    { status: 200 }
  );
}

// POST /api/scheduler  → 저장
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { day, slot, items } = body as {
    day?: string;
    slot?: string;
    items?: Array<{
      studentId: string;
      name: string;
      status: string;
      reason: string;
    }>;
  };

  if (!day || !slot || !Array.isArray(items)) {
    return NextResponse.json(
      { ok: false, message: "day, slot, items가 필요합니다." },
      { status: 400 }
    );
  }

  const key = `${day}|${slot}`;
  schedulerStore[key] = {
    day,
    slot,
    items,
  };

  return NextResponse.json({ ok: true });
}

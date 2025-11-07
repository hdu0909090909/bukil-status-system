// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, SCHED_KEY_PREFIX, STUDENTS_KEY } from "@/app/lib/seed";

// POST { day, slot }
export async function POST(req: NextRequest) {
  await ensureSeed();
  const { day, slot } = await req.json();

  if (!day || !slot) {
    return NextResponse.json({ ok: false, message: "day, slot이 필요합니다." }, { status: 400 });
  }

  const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
  const plan = (await redis.get(key)) as
    | { day: string; slot: string; items: Array<{ studentId: string; name: string; status: string; reason: string }> }
    | null;

  if (!plan) {
    return NextResponse.json({ ok: false, message: "해당 시간에 저장된 스케줄이 없습니다." }, { status: 404 });
  }

  // 현재 학생들
  const students = ((await redis.get(STUDENTS_KEY)) as any[]) ?? [];

  // 스케줄에서 "변경안함" 아닌 것만 학생에 반영
  const next = students.map((s) => {
    const item = plan.items.find((i) => i.studentId === s.id);
    if (!item) return s;
    if (item.status === "변경안함") return s;
    return {
      ...s,
      status: item.status,
      reason: item.reason ?? "",
    };
  });

  await redis.set(STUDENTS_KEY, next);

  return NextResponse.json({ ok: true });
}

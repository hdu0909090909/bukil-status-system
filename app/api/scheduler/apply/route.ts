// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { schedulerStore, students } from "@/app/lib/data";
import { getSchedulerEnabled } from "../state/route"; // ← 방금 만든 거 import

// POST /api/scheduler/apply
// body: { day: "mon", slot: "8교시" }
export async function POST(req: NextRequest) {
  // 스케줄러 꺼져 있으면 막기
  if (!getSchedulerEnabled()) {
    return NextResponse.json(
      { ok: false, message: "스케줄러가 꺼져 있어서 적용되지 않았습니다." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { day, slot } = body as { day?: string; slot?: string };

  if (!day || !slot) {
    return NextResponse.json(
      { ok: false, message: "day, slot이 필요합니다." },
      { status: 400 }
    );
  }

  const key = `${day}|${slot}`;
  const plan = schedulerStore[key];

  if (!plan || !Array.isArray(plan.items)) {
    return NextResponse.json(
      { ok: false, message: "해당 시간에 저장된 스케줄이 없습니다." },
      { status: 404 }
    );
  }

  // 스케줄에 있는 학생 목록을 실제 students에 반영
  for (const item of plan.items) {
    // "변경안함"은 건너뛴다
    if (item.status === "변경안함") continue;

    const st = students.find((s) => s.id === item.studentId);
    if (!st) continue;

    st.status = item.status;
    st.reason = item.reason ?? "";
  }

  return NextResponse.json({ ok: true });
}

// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { schedulerStore, students } from "../../../lib/data";

// POST /api/scheduler/apply
// { day: "mon", slot: "8교시" }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { day, slot } = body as { day?: string; slot?: string };

  if (!day || !slot) {
    return NextResponse.json(
      { ok: false, message: "day와 slot이 필요합니다." },
      { status: 400 }
    );
  }

  const key = `${day}|${slot}`;
  const plan = schedulerStore[key];

  if (!plan) {
    return NextResponse.json(
      { ok: false, message: "해당 시간에 저장된 스케줄이 없습니다." },
      { status: 404 }
    );
  }

  // 실제 학생 데이터에 반영
  for (const item of plan.items) {
    if (item.status === "변경안함") continue;
    const st = students.find((s) => s.id === item.studentId);
    if (!st) continue;

    st.status = item.status;
    st.reason = item.reason ?? "";
  }

  return NextResponse.json({ ok: true });
}

// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, schedulerStore } from "@/app/lib/data";

// POST /api/scheduler/apply  { day, slot }
export async function POST(req: NextRequest) {
  const { day, slot } = await req.json();

  if (!day || !slot) {
    return NextResponse.json(
      { ok: false, message: "day, slot 필요" },
      { status: 400 }
    );
  }

  const key = `${day}|${slot}`;
  const plan = schedulerStore[key];

  if (!plan || !Array.isArray(plan.items)) {
    // 저장된 스케줄 없으면 그냥 성공만
    return NextResponse.json({ ok: true, message: "no plan" });
  }

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

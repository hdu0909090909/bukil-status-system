// app/api/scheduler/apply/route.ts
import { NextResponse } from "next/server";
import { schedulerStore, schedulerEnabledRef, students } from "@/app/lib/data";

// POST body: { day: "mon"|"tue"|..., slot: "8교시"|"야간 1차시"|... }
export async function POST(req: Request) {
  try {
    const { day, slot } = await req.json();

    if (!day || !slot) {
      return NextResponse.json({ ok: false, message: "day, slot 필요" }, { status: 400 });
    }

    // 스케줄러가 OFF면 적용 거부
    if (!schedulerEnabledRef.schedulerEnabled) {
      return NextResponse.json({ ok: false, message: "스케줄러가 OFF입니다." }, { status: 400 });
    }

    const key = `${day}|${slot}`;
    const plan = schedulerStore[key];
    if (!plan || !Array.isArray(plan.items)) {
      return NextResponse.json({ ok: false, message: "해당 시간 저장된 스케줄이 없습니다." }, { status: 404 });
    }

    // “변경안함” 제외하고만 실제 반영
    const byId = new Map(students.map((s) => [s.id, s]));
    for (const it of plan.items) {
      if (!it.studentId) continue;
      if (it.status && it.status !== "변경안함") {
        const target = byId.get(it.studentId);
        if (target) {
          target.status = it.status;
          target.reason = it.reason ?? "";
          // approved는 스케줄로는 건드리지 않음
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

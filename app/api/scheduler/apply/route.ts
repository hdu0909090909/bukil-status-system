// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  schedulerStore,
  students,
  schedulerEnabled,
} from "@/app/lib/data";

// POST /api/scheduler/apply
// body: { day: "mon", slot: "8교시" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const day = body.day as string;
    const slot = body.slot as string;

    if (!day || !slot) {
      return NextResponse.json(
        { ok: false, message: "day, slot 이 필요합니다." },
        { status: 400 }
      );
    }

    // 스케줄러가 OFF면 적용 안 함
    if (!schedulerEnabled.value) {
      return NextResponse.json(
        { ok: false, message: "스케줄러가 비활성화되어 있습니다." },
        { status: 400 }
      );
    }

    const key = `${day}:${slot}`;
    const items = schedulerStore[key] || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "해당 시간에 저장된 스케줄이 없습니다." },
        { status: 404 }
      );
    }

    // items: [{ studentId, status, reason }, ...]
    for (const it of items) {
      const stu = students.find((s) => s.id === it.studentId);
      if (!stu) continue;

      // "변경안함"은 그대로 두기
      if (it.status && it.status !== "변경안함") {
        stu.status = it.status;
      }
      if (typeof it.reason === "string") {
        stu.reason = it.reason;
      }
    }

    return NextResponse.json({ ok: true, students: students }, { status: 200 });
  } catch (err) {
    console.error("scheduler apply error", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

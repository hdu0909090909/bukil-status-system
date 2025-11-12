// app/api/scheduler/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  students,
  schedulerStore,
  schedulerEnabledRef,
} from "@/app/lib/data";

// POST /api/scheduler/apply
// body: { day: "mon", slot: "8교시" }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const day = body?.day as string | undefined;
  const slot = body?.slot as string | undefined;

  if (!day || !slot) {
    return NextResponse.json(
      { ok: false, message: "day, slot 둘 다 필요합니다." },
      { status: 400 }
    );
  }

  // 스케줄러가 꺼져 있으면 그냥 성공만 응답
  if (!schedulerEnabledRef.schedulerEnabled) {
    return NextResponse.json(
      { ok: true, message: "스케줄러가 OFF라서 적용하지 않았습니다." },
      { status: 200 }
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

  // 실제 학생 배열에 덮어쓰기
  for (const item of plan.items) {
    // "변경안함"은 건너뜀
    if (item.status === "변경안함") continue;

    const stu = students.find((s) => s.id === item.studentId);
    if (!stu) continue;

    stu.status = item.status;
    stu.reason = item.reason ?? "";
    // 허가는 그대로 두기로 했으니 stu.approved 는 안 건드림
  }

  // 정렬해서 돌려주면 프론트가 바로 다시 그릴 수 있음
  const sorted = [...students].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  return NextResponse.json(
    { ok: true, students: sorted },
    { status: 200 }
  );
}

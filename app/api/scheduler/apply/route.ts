// app/api/scheduler/apply/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import {
  ensureSeed,
  STUDENTS_KEY,
  SCHED_KEY_PREFIX,
  SCHED_ENABLED_KEY,
} from "@/app/lib/seed";

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
  password?: string;
};

type SchedulerItem = {
  studentId: string;
  name: string;
  status: string;
  reason: string;
};

type SchedulerPlan = {
  day: string;
  slot: string;
  items: SchedulerItem[];
};

// POST body: { day: "mon"|"tue"|..., slot: "8교시"|"야간 1차시"|... }
export async function POST(req: Request) {
  try {
    const { day, slot } = await req.json();

    if (!day || !slot) {
      return NextResponse.json(
        { ok: false, message: "day, slot 필요" },
        { status: 400 },
      );
    }

    await ensureSeed();

    const enabled = (await redis.get(SCHED_ENABLED_KEY)) as boolean | null;
    if (!enabled) {
      return NextResponse.json(
        { ok: false, message: "스케줄러가 OFF입니다." },
        { status: 400 },
      );
    }

    const key = `${SCHED_KEY_PREFIX}${day}|${slot}`;
    const plan = (await redis.get(key)) as SchedulerPlan | null;

    if (!plan || !Array.isArray(plan.items)) {
      return NextResponse.json(
        { ok: false, message: "해당 시간 저장된 스케줄이 없습니다." },
        { status: 404 },
      );
    }

    let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
    if (!students) students = [];

    const byId = new Map(students.map((s) => [s.id, s]));

    // “변경안함” 제외하고만 실제 반영
    for (const it of plan.items) {
      if (!it.studentId) continue;
      if (it.status && it.status !== "변경안함") {
        const target = byId.get(it.studentId);
        if (target) {
          target.status = it.status;
          target.reason = it.reason ?? "";
        }
      }
    }

    await redis.set(STUDENTS_KEY, students);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[scheduler/apply POST] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

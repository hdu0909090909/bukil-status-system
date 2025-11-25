// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY, DAILY_RESET_KEY } from "@/app/lib/seed";

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
  password?: string;
};

const sortById = (list: Student[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

async function getStudentsWithDailyReset(): Promise<Student[]> {
  await ensureSeed();

  let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
  if (!students) students = [];

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  const lastReset = (await redis.get(DAILY_RESET_KEY)) as string | null;

  // 08시 이후 + 아직 오늘 리셋이 안 됐으면 전체 재실 초기화
  if (hour >= 8 && lastReset !== today) {
    students = students.map((s) => ({
      ...s,
      status: "재실",
      reason: "",
      // approved 그대로 유지
    }));
    await redis.set(STUDENTS_KEY, students);
    await redis.set(DAILY_RESET_KEY, today);
  }

  return sortById(students);
}

// GET: 매 호출마다 08:00 리셋 체크
export async function GET() {
  try {
    const list = await getStudentsWithDailyReset();
    // password는 클라이언트에 안 넘겨도 되니 제거
    const sanitized = list.map(({ password, ...rest }) => rest);
    return NextResponse.json(sanitized, { status: 200 });
  } catch (e) {
    console.error("[students GET] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

// PATCH: 단건({id,...}) 또는 벌크([{id,...},...])
export async function PATCH(req: NextRequest) {
  try {
    await ensureSeed();

    const body = await req.json();
    let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
    if (!students) students = [];

    const applyPatch = (patch: any) => {
      const { id, ...updates } = patch as { id: string; [k: string]: any };
      if (!id) return;
      const idx = students!.findIndex((s) => s.id === id);
      if (idx === -1) return;
      students![idx] = { ...students![idx], ...updates };
    };

    if (Array.isArray(body)) {
      for (const item of body) applyPatch(item);
    } else {
      applyPatch(body);
    }

    await redis.set(STUDENTS_KEY, students);
    const sorted = sortById(students);
    const sanitized = sorted.map(({ password, ...rest }) => rest);

    return NextResponse.json(
      { ok: true, students: sanitized },
      { status: 200 },
    );
  } catch (e) {
    console.error("[students PATCH] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY } from "@/app/lib/seed";
import { publishStudentsChanged } from "@/app/lib/ably-server";

export type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string | null;
  password?: string;
};

const sortById = (list: Student[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

async function getStudents(): Promise<Student[]> {
  await ensureSeed();
  let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
  if (!students) students = [];
  return sortById(students);
}

/** GET: 조회만 */
export async function GET() {
  try {
    const list = await getStudents();
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

/** POST: 학생 추가 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json();

    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    const seatId =
      body.seatId === null ||
      body.seatId === undefined ||
      String(body.seatId).trim() === ""
        ? null
        : String(body.seatId).trim();

    if (!id || !name) {
      return NextResponse.json(
        { ok: false, message: "id와 name이 필요합니다." },
        { status: 400 },
      );
    }

    let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
    if (!students) students = [];

    if (students.find((s) => s.id === id)) {
      return NextResponse.json(
        { ok: false, message: "이미 존재하는 학생입니다." },
        { status: 409 },
      );
    }

    const newStudent: Student = {
      id,
      name,
      status: "재실",
      reason: "",
      approved: true,
      seatId, // 자리배정 탭에서 관리할 거면 null 허용
      password: "12345678",
    };

    students.push(newStudent);
    await redis.set(STUDENTS_KEY, students);

    const sorted = sortById(students);
    const sanitized = sorted.map(({ password, ...rest }) => rest);

    // ✅ 변경 이벤트 publish (return 직전)
    await publishStudentsChanged();

    return NextResponse.json({ ok: true, students: sanitized }, { status: 201 });
  } catch (e) {
    console.error("[students POST] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

/** PATCH: 단건({id,...}) 또는 벌크([{id,...},...]) */
export async function PATCH(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json();

    let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
    if (!students) students = [];

    let changed = 0;

    const applyPatch = (patch: any) => {
      const { id, ...updates } = patch as { id: string; [k: string]: any };
      if (!id) return;

      const idx = students!.findIndex((s) => s.id === id);
      if (idx === -1) return;

      // seatId 빈 문자열 들어오면 null로 정규화
      if ("seatId" in updates) {
        const v = updates.seatId;
        updates.seatId =
          v === "" || v === undefined
            ? null
            : v === null
            ? null
            : String(v).trim();
      }

      students![idx] = { ...students![idx], ...updates };
      changed++;
    };

    if (Array.isArray(body)) {
      for (const item of body) applyPatch(item);
    } else {
      applyPatch(body);
    }

    await redis.set(STUDENTS_KEY, students);

    const sorted = sortById(students);
    const sanitized = sorted.map(({ password, ...rest }) => rest);

    // ✅ 실제로 바뀐 경우에만 publish
    if (changed > 0) {
      await publishStudentsChanged();
    }

    return NextResponse.json({ ok: true, students: sanitized }, { status: 200 });
  } catch (e) {
    console.error("[students PATCH] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

/** DELETE: 학생 삭제 (단일 또는 여러 명) */
export async function DELETE(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json().catch(() => ({} as any));

    const id = body.id as string | undefined;
    const ids = body.ids as string[] | undefined;

    if (!id && !ids) {
      return NextResponse.json(
        { ok: false, message: "id 또는 ids가 필요합니다." },
        { status: 400 },
      );
    }

    const removeIds = new Set(ids ?? (id ? [id] : []));

    let students = (await redis.get(STUDENTS_KEY)) as Student[] | null;
    if (!students) students = [];

    const before = students.length;
    students = students.filter((s) => !removeIds.has(s.id));
    const after = students.length;

    await redis.set(STUDENTS_KEY, students);

    const sorted = sortById(students);
    const sanitized = sorted.map(({ password, ...rest }) => rest);

    // ✅ 삭제로 변화가 있었으면 publish
    if (before !== after) {
      await publishStudentsChanged();
    }

    return NextResponse.json({ ok: true, students: sanitized }, { status: 200 });
  } catch (e) {
    console.error("[students DELETE] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

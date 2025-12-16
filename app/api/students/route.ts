// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { publishStudentsChanged } from "@/app/lib/ably-server";

export const runtime = "nodejs";

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string | null;
};

const KEY = "students:list";

const sortById = (list: Student[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

async function readStudents(): Promise<Student[]> {
  const data = (await redis.get(KEY)) as unknown;

  return Array.isArray(data) ? (data as Student[]) : [];
}


async function writeStudents(next: Student[]) {
  await redis.set(KEY, next);
}

export async function GET() {
  const students = await readStudents();
  return NextResponse.json(sortById(students));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Student;

    const students = await readStudents();
    if (students.some((s) => s.id === body.id)) {
      return NextResponse.json(
        { ok: false, message: "이미 존재하는 학번입니다." },
        { status: 400 }
      );
    }

    const next = sortById([...students, body]);
    await writeStudents(next);

    // ✅ 성공 후 publish
    await publishStudentsChanged();

    return NextResponse.json({ ok: true, students: next });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "POST error", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await req.json();

    const students = await readStudents();

    // 1) 배치 PATCH (배열)
    if (Array.isArray(payload)) {
      const map = new Map(students.map((s) => [s.id, s] as const));

      for (const item of payload) {
        const id = String(item.id ?? "");
        if (!id) continue;
        const cur = map.get(id);
        if (!cur) continue;

        map.set(id, {
          ...cur,
          ...item,
          id: cur.id, // id 고정
        });
      }

      const next = sortById(Array.from(map.values()));
      await writeStudents(next);

      // ✅ 성공 후 publish
      await publishStudentsChanged();

      return NextResponse.json({ ok: true, students: next });
    }

    // 2) 단건 PATCH ({id, ...})
    const id = String(payload?.id ?? "");
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "id가 필요합니다." },
        { status: 400 }
      );
    }

    const next = sortById(
      students.map((s) => (s.id === id ? { ...s, ...payload, id: s.id } : s))
    );

    await writeStudents(next);

    // ✅ 성공 후 publish
    await publishStudentsChanged();

    return NextResponse.json({ ok: true, students: next });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "PATCH error", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { ok: false, message: "ids 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const students = await readStudents();
    const idSet = new Set(ids.map(String));
    const next = students.filter((s) => !idSet.has(s.id));

    await writeStudents(sortById(next));

    // ✅ 성공 후 publish
    await publishStudentsChanged();

    return NextResponse.json({ ok: true, students: sortById(next) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "DELETE error", detail: String(e) },
      { status: 500 }
    );
  }
}

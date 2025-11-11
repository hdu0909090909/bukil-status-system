// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStudents, saveStudents } from "@/app/lib/store";

function sortById<T extends { id: string }>(arr: T[]) {
  return [...arr].sort((a, b) => Number(a.id) - Number(b.id));
}

export async function GET() {
  const students = await getStudents();
  return NextResponse.json(students, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const students = await getStudents();

  // 여러 명
  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as { id: string; [key: string]: any };
      if (!id) continue;
      const target = students.find((s) => s.id === id);
      if (!target) continue;
      Object.assign(target, updates);
    }
    await saveStudents(students);
    return NextResponse.json(
      { ok: true, students: sortById(students) },
      { status: 200 }
    );
  }

  // 한 명
  const { id, ...updates } = body as { id?: string; [key: string]: any };
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 }
    );
  }

  const target = students.find((s) => s.id === id);
  if (!target) {
    return NextResponse.json(
      { ok: false, message: "해당 학생을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  Object.assign(target, updates);
  await saveStudents(students);

  return NextResponse.json(
    { ok: true, student: target },
    { status: 200 }
  );
}

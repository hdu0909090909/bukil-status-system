// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// 공통: 항상 학번순으로 정렬해서 내보내기
function getSortedStudents() {
  return [...students].sort((a, b) => Number(a.id) - Number(b.id));
}

// GET /api/students
export async function GET() {
  return NextResponse.json(getSortedStudents(), { status: 200 });
}

// PATCH /api/students
// 1) 단건: { id, ...updates }
// 2) 벌크: [ { id, ...updates }, { id, ...updates }, ... ]
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // 배열이면 벌크 업데이트
  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as { id: string; [key: string]: any };
      const target = students.find((s) => s.id === id);
      if (target) {
        Object.assign(target, updates);
      }
    }
    return NextResponse.json({ ok: true, students: getSortedStudents() });
  }

  // 단건 업데이트
  const { id, ...updates } = body as { id: string; [key: string]: any };
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

  return NextResponse.json({ ok: true, student: target });
}

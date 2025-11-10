// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

function getSortedStudents() {
  return [...students].sort((a, b) => Number(a.id) - Number(b.id));
}

// GET /api/students
export async function GET() {
  // ❌ 여기서 더 이상 ensureDailyReset() 안 부른다
  return NextResponse.json(getSortedStudents(), { status: 200 });
}

// PATCH /api/students
// 1) [{...}, {...}] 벌크
// 2) {...} 단건
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // 배열이면 벌크
  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as { id: string; [key: string]: any };
      if (!id) continue;
      const target = students.find((s) => s.id === id);
      if (!target) continue;
      Object.assign(target, updates);
    }
    return NextResponse.json(
      {
        ok: true,
        students: getSortedStudents(),
      },
      { status: 200 }
    );
  }

  // 단건
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

  return NextResponse.json(
    {
      ok: true,
      student: target,
    },
    { status: 200 }
  );
}

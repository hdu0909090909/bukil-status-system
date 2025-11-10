// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, ensureDailyReset } from "@/app/lib/data";

// 공통: 학번순 정렬해서 보내기
function getSortedStudents() {
  return [...students].sort((a, b) => Number(a.id) - Number(b.id));
}

// GET /api/students
export async function GET() {
  // 08:00 이후 최초 요청이면 여기서 한 번 전체 재실로 맞춘다
  ensureDailyReset();
  return NextResponse.json(getSortedStudents(), { status: 200 });
}

// PATCH /api/students
// 1) 한 명만 수정: { id, status?, reason?, approved? }
// 2) 여러 명 한꺼번에: [{ id, ... }, { id, ... }]
export async function PATCH(req: NextRequest) {
  // 패치 들어올 때도 날짜 체크 한번
  ensureDailyReset();

  const body = await req.json();

  // 배열이면 벌크 업데이트
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

  // 단일 업데이트
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

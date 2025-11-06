// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// GET /api/students
export async function GET() {
  // 학번순으로 항상 정렬해서 줌
  const sorted = [...students].sort((a, b) => a.id.localeCompare(b.id));
  return NextResponse.json(sorted);
}

// PATCH /api/students  { id, ...updates }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body as { id?: string };

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "id가 필요합니다." },
      { status: 400 }
    );
  }

  const target = students.find((s) => s.id === id);
  if (!target) {
    return NextResponse.json(
      { ok: false, message: "해당 학생이 없습니다." },
      { status: 404 }
    );
  }

  Object.assign(target, rest);
  return NextResponse.json({ ok: true });
}

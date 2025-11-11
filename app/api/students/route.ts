// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getStudents,
  saveStudents,
  type Student,
} from "@/app/lib/store";

// (Vercel에서 fs 쓰려면 node 런타임으로)
export const runtime = "nodejs";

// 공통 정렬
function sortById(list: Student[]) {
  return [...list].sort((a, b) => Number(a.id) - Number(b.id));
}

// GET /api/students  → 항상 파일에서 읽음
export async function GET() {
  const students = await getStudents();
  return NextResponse.json(sortById(students), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// PATCH /api/students
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const students = await getStudents();

  // 여러 명 한꺼번에
  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as {
        id?: string;
        status?: string;
        reason?: string;
        approved?: boolean;
      };
      if (!id) continue;
      const target = students.find((s) => s.id === id);
      if (!target) continue;
      if (typeof updates.status === "string") target.status = updates.status;
      if (typeof updates.reason === "string") target.reason = updates.reason;
      if (typeof updates.approved === "boolean")
        target.approved = updates.approved;
    }
    await saveStudents(students);
    return NextResponse.json(
      { ok: true, students: sortById(students) },
      { status: 200 }
    );
  }

  // 한 명
  const { id, ...updates } = body as {
    id?: string;
    status?: string;
    reason?: string;
    approved?: boolean;
  };

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

  if (typeof updates.status === "string") target.status = updates.status;
  if (typeof updates.reason === "string") target.reason = updates.reason;
  if (typeof updates.approved === "boolean")
    target.approved = updates.approved;

  await saveStudents(students);

  return NextResponse.json(
    { ok: true, student: target },
    { status: 200 }
  );
}

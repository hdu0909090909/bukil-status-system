// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "../../lib/data";

// GET /api/students
export async function GET() {
  // 그냥 현재 메모리 학생 전체 반환
  return NextResponse.json(students, { status: 200 });
}

/**
 * PATCH /api/students
 * 1) 단일 업데이트
 *    { "id": "11110", "status": "미디어스페이스", "reason": "...", "approved": true }
 *
 * 2) 벌크 업데이트
 *    { "updates": [ {id: "...", status: "재실"}, {id: "...", approved: false} ] }
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // 2) bulk 모드
  if (Array.isArray(body.updates)) {
    const idsUpdated: string[] = [];

    for (const u of body.updates as Array<Record<string, any>>) {
      const target = students.find((s) => s.id === u.id);
      if (!target) continue;

      if (typeof u.status === "string") target.status = u.status;
      if (typeof u.reason === "string") target.reason = u.reason;
      if (typeof u.approved === "boolean") target.approved = u.approved;

      idsUpdated.push(u.id);
    }

    return NextResponse.json({ ok: true, updated: idsUpdated });
  }

  // 1) single 모드
  const { id, status, reason, approved } = body as {
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

  const student = students.find((s) => s.id === id);
  if (!student) {
    return NextResponse.json(
      { ok: false, message: "해당 학생을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (typeof status === "string") student.status = status;
  if (typeof reason === "string") student.reason = reason;
  if (typeof approved === "boolean") student.approved = approved;

  return NextResponse.json({ ok: true });
}

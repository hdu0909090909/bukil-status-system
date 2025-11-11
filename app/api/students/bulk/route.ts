// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

function getSortedStudents() {
  return [...students].sort((a, b) => Number(a.id) - Number(b.id));
}

// POST /api/students/bulk
// { updates: [ { id, status?, reason?, approved? }, ... ] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = body.updates as Array<
      Partial<{
        id: string;
        status: string;
        reason: string;
        approved: boolean;
      }>
    >;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { ok: false, message: "updates 배열이 필요합니다." },
        { status: 400 }
      );
    }

    for (const u of updates) {
      if (!u.id) continue;
      const target = students.find((s) => s.id === u.id);
      if (!target) continue;

      if (typeof u.status === "string") target.status = u.status;
      if (typeof u.reason === "string") target.reason = u.reason;
      if (typeof u.approved === "boolean") target.approved = u.approved;
    }

    return NextResponse.json(
      { ok: true, students: getSortedStudents() },
      { status: 200 }
    );
  } catch (err) {
    console.error("bulk update error", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

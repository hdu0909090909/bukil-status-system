// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStudents, saveStudents, type Student } from "@/app/lib/store";

export const runtime = "nodejs";

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

    const students = await getStudents();

    for (const u of updates) {
      if (!u.id) continue;
      const st = students.find((s) => s.id === u.id);
      if (!st) continue;

      if (typeof u.status === "string") st.status = u.status;
      if (typeof u.reason === "string") st.reason = u.reason;
      if (typeof u.approved === "boolean") st.approved = u.approved;
    }

    await saveStudents(students);

    // 교원 페이지가 이걸로 자기 상태를 덮어쓸 수 있게 전체를 돌려준다
    return NextResponse.json(
      { ok: true, students: students.sort((a, b) => Number(a.id) - Number(b.id)) },
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

// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// 요청 형태:
// POST /api/students/bulk
// { updates: [ { id: "11101", status: "재실", approved: true, reason: "" }, ... ] }
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

    // 메모리에 있는 students 한 번에 수정
    for (const u of updates) {
      if (!u.id) continue;
      const st = students.find((s) => s.id === u.id);
      if (!st) continue;

      if (typeof u.status === "string") {
        st.status = u.status;
      }
      if (typeof u.reason === "string") {
        st.reason = u.reason;
      }
      if (typeof u.approved === "boolean") {
        st.approved = u.approved;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("bulk update error", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

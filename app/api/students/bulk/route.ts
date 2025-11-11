// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

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

    // 필요한 사람은 여기서 전체를 받아가게 할 수도 있음
    const sorted = [...students].sort((a, b) => Number(a.id) - Number(b.id));
    return NextResponse.json({ ok: true, students: sorted }, { status: 200 });
  } catch (err) {
    console.error("bulk update error", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

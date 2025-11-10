// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, ensureDailyReset } from "@/app/lib/data";

// POST /api/students/bulk
// { updates: [ { id: "11101", status: "재실", approved: true, reason: "" }, ... ] }
export async function POST(req: NextRequest) {
  try {
    // 🔵 여기서도 하루 한 번 리셋 로직을 태워서
    // GET이든 POST든 같은 기준을 쓰게 한다
    ensureDailyReset();

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

    // 🔵 교원 페이지가 이걸 바로 다시 그릴 수 있게 전체를 내려준다
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

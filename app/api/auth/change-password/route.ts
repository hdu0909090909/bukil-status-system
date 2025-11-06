// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, teacherUsers } from "@/app/lib/data";

/**
 * 비밀번호 변경 API
 * - POST /api/auth/change-password
 * - body: { role: "student" | "teacher", id: string, oldPw: string, newPw: string }
 * - 응답: { ok: boolean, message?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { role, id, oldPw, newPw } = await req.json();

    if (!id || !oldPw || !newPw) {
      return NextResponse.json({ ok: false, message: "필수 입력값이 누락되었습니다." }, { status: 400 });
    }

    // 🧑‍🎓 학생 비밀번호 변경
    if (role === "student") {
      const st = students.find((s) => s.id === id);
      if (!st) return NextResponse.json({ ok: false, message: "해당 학번이 없습니다." }, { status: 404 });

      const currentPw = st.password ?? "12345678";
      if (currentPw !== oldPw)
        return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });

      st.password = newPw;
      return NextResponse.json({ ok: true, message: "비밀번호가 변경되었습니다." });
    }

    // 👩‍🏫 교사/교원 비밀번호 변경
    if (role === "teacher") {
      const t = teacherUsers.find((u) => u.id === id);
      if (!t) return NextResponse.json({ ok: false, message: "해당 교원 계정이 없습니다." }, { status: 404 });

      if (t.password !== oldPw)
        return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });

      t.password = newPw;
      return NextResponse.json({ ok: true, message: "비밀번호가 변경되었습니다." });
    }

    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  } catch (err) {
    console.error("비밀번호 변경 오류:", err);
    return NextResponse.json({ ok: false, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { students, teacherUsers } from "@/app/lib/data";

export async function POST(req: Request) {
  const { role, id, password } = await req.json();

  if (!role || !id || !password) {
    return NextResponse.json(
      { ok: false, message: "필수 값이 없습니다." },
      { status: 400 }
    );
  }

  // 🧑‍🎓 학생 로그인
  if (role === "student") {
    const stu = students.find((s) => s.id === id);
    if (!stu) {
      return NextResponse.json(
        { ok: false, message: "해당 학번이 없습니다." },
        { status: 404 }
      );
    }

    // 비밀번호가 변경된 적 없으면 기본 12345678로 비교
    const realPw = stu.password ?? "12345678";

    if (realPw !== password) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      role: "student",
      id: stu.id,
    });
  }

  // 👩‍🏫 교사/교원 로그인
  if (role === "teacher") {
    const t = teacherUsers.find((u) => u.id === id);
    if (!t) {
      return NextResponse.json(
        { ok: false, message: "교원 계정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (t.password !== password) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      role: "teacher",
      id: t.id,
    });
  }

  return NextResponse.json(
    { ok: false, message: "알 수 없는 role입니다." },
    { status: 400 }
  );
}

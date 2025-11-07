// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, teacherUsers } from "../../../lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role, id, password } = body as {
    role?: "student" | "teacher";
    id?: string;
    password?: string;
  };

  if (!role || !id) {
    return NextResponse.json(
      { ok: false, message: "role과 id가 필요합니다." },
      { status: 400 }
    );
  }

  // 학생 로그인
  if (role === "student") {
    const stu = students.find((s) => s.id === id);
    if (!stu) {
      return NextResponse.json(
        { ok: false, message: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    // 학생 비번이 없으면 기본 12345678로 써놨던 구조였지
    const pw = stu.password ?? "12345678";
    if (password !== pw) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }
    return NextResponse.json({ ok: true, id: stu.id, name: stu.name });
  }

  // 교원 로그인
  if (role === "teacher") {
    const tea = teacherUsers.find((t) => t.id === id);
    if (!tea) {
      return NextResponse.json(
        { ok: false, message: "교원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    if (password !== tea.password) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }
    return NextResponse.json({ ok: true, id: tea.id, name: tea.name });
  }

  return NextResponse.json(
    { ok: false, message: "알 수 없는 role입니다." },
    { status: 400 }
  );
}

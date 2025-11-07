// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, teacherUsers } from "../../../lib/data";

// POST /api/auth/change-password
// body: { role: "student" | "teacher", id: string, oldPassword?: string, newPassword: string }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role, id, oldPassword, newPassword } = body as {
    role?: "student" | "teacher";
    id?: string;
    oldPassword?: string;
    newPassword?: string;
  };

  if (!role || !id || !newPassword) {
    return NextResponse.json(
      { ok: false, message: "role, id, newPassword가 필요합니다." },
      { status: 400 }
    );
  }

  // 학생 비밀번호 변경
  if (role === "student") {
    const stu = students.find((s) => s.id === id);
    if (!stu) {
      return NextResponse.json(
        { ok: false, message: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기존 비번 검증 (기존에 12345678로 박아뒀던 경우도 있음)
    const currentPw = stu.password ?? "12345678";
    if (oldPassword && oldPassword !== currentPw) {
      return NextResponse.json(
        { ok: false, message: "현재 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    stu.password = newPassword;
    return NextResponse.json({ ok: true });
  }

  // 교원 비밀번호 변경
  if (role === "teacher") {
    const teacher = teacherUsers.find((t) => t.id === id);
    if (!teacher) {
      return NextResponse.json(
        { ok: false, message: "교원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (oldPassword && oldPassword !== teacher.password) {
      return NextResponse.json(
        { ok: false, message: "현재 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    teacher.password = newPassword;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, message: "알 수 없는 role입니다." },
    { status: 400 }
  );
}

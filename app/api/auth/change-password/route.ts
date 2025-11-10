// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, teacherUsers } from "@/app/lib/data"; // ✅ 절대경로로 수정

// POST /api/auth/change-password
// body: { role: "student" | "teacher", id: string, oldPassword?: string, newPassword: string }
export async function POST(req: NextRequest) {
  try {
    console.log("[API] change-password called");

    const body = await req.json();
    console.log("[API] body:", body);

    const { role, id, oldPassword, newPassword } = body as {
      role?: "student" | "teacher";
      id?: string;
      oldPassword?: string;
      newPassword?: string;
    };

    // ✅ 필수값 검사
    if (!role || !id || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "role, id, newPassword가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ 학생 처리
    if (role === "student") {
      const stu = students.find((s) => s.id === id);
      if (!stu) {
        return NextResponse.json(
          { ok: false, message: "학생을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const currentPw = stu.password ?? "12345678";
      if (oldPassword && oldPassword !== currentPw) {
        return NextResponse.json(
          { ok: false, message: "현재 비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      stu.password = newPassword;
      console.log(`[API] ${id} 학생 비밀번호 변경 완료`);
      return NextResponse.json({ ok: true });
    }

    // ✅ 교원 처리
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
      console.log(`[API] ${id} 교원 비밀번호 변경 완료`);
      return NextResponse.json({ ok: true });
    }

    // ✅ 잘못된 role
    return NextResponse.json(
      { ok: false, message: "알 수 없는 role입니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API] change-password error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 내부 오류", error: String(err) },
      { status: 500 }
    );
  }
}

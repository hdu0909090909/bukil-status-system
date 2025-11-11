// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, teacherUsers } from "@/app/lib/data";

// POST /api/auth/change-password
// body 예시:
// { role: "student", id: "11101", oldPassword: "12345678", newPassword: "abcd1234" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 프런트에서 oldPassword/newPassword로 보내지만
    // 혹시 oldPw/newPw로 오는 경우도 대비
    const role = body.role as "student" | "teacher" | undefined;
    const id = body.id as string | undefined;
    const oldPassword =
      body.oldPassword ?? body.oldPw ?? body.currentPassword ?? "";
    const newPassword = body.newPassword ?? body.newPw ?? "";

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

      // 학생은 초기 비번이 없을 수도 있으니 기본값 12345678
      const currentPw = stu.password ?? "12345678";
      if (oldPassword && oldPassword !== currentPw) {
        return NextResponse.json(
          { ok: false, message: "현재 비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      stu.password = newPassword;
      return NextResponse.json({ ok: true }, { status: 200 });
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
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // role이 student/teacher가 아닐 때
    return NextResponse.json(
      { ok: false, message: "알 수 없는 role입니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[change-password] error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 내부 오류" },
      { status: 500 }
    );
  }
}

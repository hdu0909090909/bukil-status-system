// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getStudents,
  saveStudents,
  getTeachers,
  saveTeachers,
} from "@/app/lib/store";

export async function POST(req: NextRequest) {
  try {
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

    if (role === "student") {
      const students = await getStudents();
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
      await saveStudents(students);
      return NextResponse.json({ ok: true });
    }

    if (role === "teacher") {
      const teachers = await getTeachers();
      const teacher = teachers.find((t) => t.id === id);
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
      await saveTeachers(teachers);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, message: "알 수 없는 role입니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("change-password error", err);
    return NextResponse.json(
      { ok: false, message: "서버 내부 오류" },
      { status: 500 }
    );
  }
}

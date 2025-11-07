// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY, TEACHERS_KEY } from "@/app/lib/seed";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const { role, id, oldPw, newPw } = await req.json();

  if (!id || !oldPw || !newPw) {
    return NextResponse.json({ ok: false, message: "필수 입력이 없습니다." }, { status: 400 });
  }

  if (role === "student") {
    const students = ((await redis.get(STUDENTS_KEY)) as any[]) ?? [];
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "해당 학번이 없습니다." }, { status: 404 });
    }
    const currentPw = students[idx].password ?? "12345678";
    if (currentPw !== oldPw) {
      return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });
    }
    students[idx].password = newPw;
    await redis.set(STUDENTS_KEY, students);
    return NextResponse.json({ ok: true });
  }

  if (role === "teacher") {
    const teachers = ((await redis.get(TEACHERS_KEY)) as any[]) ?? [];
    const idx = teachers.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, message: "해당 교원 계정이 없습니다." }, { status: 404 });
    }
    if (teachers[idx].password !== oldPw) {
      return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });
    }
    teachers[idx].password = newPw;
    await redis.set(TEACHERS_KEY, teachers);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "잘못된 요청" }, { status: 400 });
}

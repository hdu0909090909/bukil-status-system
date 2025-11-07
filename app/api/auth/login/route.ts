// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY, TEACHERS_KEY } from "@/app/lib/seed";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const { role, id, password } = await req.json();

  if (role === "student") {
    const students = ((await redis.get(STUDENTS_KEY)) as any[]) ?? [];
    const st = students.find((s) => s.id === id);
    if (!st) {
      return NextResponse.json({ ok: false, message: "해당 학번이 없습니다." }, { status: 404 });
    }
    const pw = st.password ?? "12345678";
    if (pw !== password) {
      return NextResponse.json({ ok: false, message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    return NextResponse.json({ ok: true, id: st.id });
  }

  if (role === "teacher") {
    const teachers = ((await redis.get(TEACHERS_KEY)) as any[]) ?? [];
    const t = teachers.find((u) => u.id === id);
    if (!t) {
      return NextResponse.json({ ok: false, message: "해당 교원 계정이 없습니다." }, { status: 404 });
    }
    if (t.password !== password) {
      return NextResponse.json({ ok: false, message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    return NextResponse.json({ ok: true, id: t.id });
  }

  return NextResponse.json({ ok: false, message: "잘못된 요청" }, { status: 400 });
}

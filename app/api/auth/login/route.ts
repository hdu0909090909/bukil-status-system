// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY, TEACHERS_KEY } from "@/app/lib/seed";

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();

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

    if (role === "student") {
      const list = (await redis.get(STUDENTS_KEY)) as any[]; // [{id, password, ...}]
      const stu = list.find((s) => s.id === id);
      if (!stu) {
        return NextResponse.json(
          { ok: false, message: "학생을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      const pw = stu.password ?? "12345678";
      if (password !== pw) {
        return NextResponse.json(
          { ok: false, message: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }
      return NextResponse.json({ ok: true, id: stu.id, name: stu.name });
    }

    if (role === "teacher") {
      const list = (await redis.get(TEACHERS_KEY)) as any[];
      const tea = list.find((t) => t.id === id);
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
  } catch (e) {
    console.error("[login] error:", e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

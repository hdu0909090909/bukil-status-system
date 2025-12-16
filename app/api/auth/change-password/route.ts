// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY, TEACHERS_KEY } from "@/app/lib/seed";

// POST body: { role: "student"|"teacher", id: string, oldPassword: string, newPassword: string }
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();

    const body = await req.json();
    const role = body.role as "student" | "teacher" | undefined;
    const id = body.id as string | undefined;
    const oldPassword = body.oldPassword ?? body.oldPw ?? body.currentPassword ?? "";
    const newPassword = body.newPassword ?? body.newPw ?? "";

    if (!role || !id || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "role, id, Password가 필요합니다." },
        { status: 400 }
      );
    }

    if (role === "student") {
      const list = ((await redis.get(STUDENTS_KEY)) as any[]) ?? [];
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json({ ok: false, message: "학생을 찾을 수 없습니다." }, { status: 404 });
      }
      const currentPw = list[idx].password ?? "12345678";
      if (oldPassword && oldPassword !== currentPw) {
        return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });
      }
      list[idx].password = newPassword;
      await redis.set(STUDENTS_KEY, list);
      return NextResponse.json({ ok: true });
    }

    if (role === "teacher") {
      const list = ((await redis.get(TEACHERS_KEY)) as any[]) ?? [];
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) {
        return NextResponse.json({ ok: false, message: "교원을 찾을 수 없습니다." }, { status: 404 });
      }
      const currentPw = list[idx].password;
      if (oldPassword && oldPassword !== currentPw) {
        return NextResponse.json({ ok: false, message: "현재 비밀번호가 일치하지 않습니다." }, { status: 401 });
      }
      list[idx].password = newPassword;
      await redis.set(TEACHERS_KEY, list);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, message: "알 수 없는 role입니다." }, { status: 400 });
  } catch (err) {
    console.error("[change-password] error:", err);
    return NextResponse.json({ ok: false, message: "서버 내부 Error" }, { status: 500 });
  }
}

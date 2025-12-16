// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

type Role = "student" | "teacher";

type StudentUser = {
  id: string;
  password: string;
};

type TeacherUser = {
  id: string;
  password: string;
};

const STUDENT_USERS_KEY = "auth:students";
const TEACHER_USERS_KEY = "auth:teachers";

async function readUsers<T>(key: string): Promise<T[]> {
  const data = await redis.get<T[]>(key);
  return Array.isArray(data) ? data : [];
}

async function writeUsers<T>(key: string, next: T[]) {
  await redis.set(key, next);
}

// POST /api/auth/change-password
// body: { role: "student" | "teacher", id: string, oldPassword?: string, newPassword: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const role = body?.role as Role | undefined;
    const id = String(body?.id ?? "");
    const oldPassword = String(body?.oldPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!role || !id || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "요청 값이 부족합니다." },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { ok: false, message: "새 비밀번호가 너무 짧습니다." },
        { status: 400 }
      );
    }

    if (role === "student") {
      const users = await readUsers<StudentUser>(STUDENT_USERS_KEY);
      const idx = users.findIndex((u) => u.id === id);
      if (idx < 0) {
        return NextResponse.json(
          { ok: false, message: "학생을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      // 기존 비밀번호 검증을 쓰고 있다면 여기서 체크
      if (users[idx].password && oldPassword && users[idx].password !== oldPassword) {
        return NextResponse.json(
          { ok: false, message: "기존 비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      users[idx] = { ...users[idx], password: newPassword };
      await writeUsers(STUDENT_USERS_KEY, users);

      return NextResponse.json({ ok: true });
    }

    if (role === "teacher") {
      const users = await readUsers<TeacherUser>(TEACHER_USERS_KEY);
      const idx = users.findIndex((u) => u.id === id);
      if (idx < 0) {
        return NextResponse.json(
          { ok: false, message: "교원을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      if (users[idx].password && oldPassword && users[idx].password !== oldPassword) {
        return NextResponse.json(
          { ok: false, message: "기존 비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      users[idx] = { ...users[idx], password: newPassword };
      await writeUsers(TEACHER_USERS_KEY, users);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, message: "role 값이 올바르지 않습니다." },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "서버 오류", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

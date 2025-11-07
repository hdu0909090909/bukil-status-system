// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY } from "@/app/lib/seed";

export async function GET() {
  await ensureSeed();
  const students = (await redis.get(STUDENTS_KEY)) as any[] | null;
  return NextResponse.json(students ?? []);
}

export async function PATCH(req: NextRequest) {
  await ensureSeed();
  const { id, ...updates } = await req.json();

  const students = ((await redis.get(STUDENTS_KEY)) as any[]) ?? [];
  const next = students.map((s) =>
    s.id === id ? { ...s, ...updates } : s
  );
  await redis.set(STUDENTS_KEY, next);

  return NextResponse.json({ ok: true });
}

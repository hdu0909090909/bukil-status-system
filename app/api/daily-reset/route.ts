import { NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, STUDENTS_KEY } from "@/app/lib/seed";
import { publishStudentsChanged } from "@/app/lib/ably-server";

export const runtime = "nodejs";

type Student = {
  id: string; name: string; status: string; reason: string; approved: boolean; seatId?: string | null;
};

const ymd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

export async function GET() {
  // KST
  const utc = new Date();
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);

  // ✅ 하루 1회만
  const key = `daily-reset:done:${ymd(kst)}`;
  const done = await redis.get(key);
  if (done) return NextResponse.json({ ok: true, skipped: "already" });

  await ensureSeed();
  const raw = await redis.get<Student[]>(STUDENTS_KEY);
  const students = Array.isArray(raw) ? raw : [];

  const updated = students.map((s) => ({
    ...s,
    status: "재실",
    reason: "",
  }));

  await redis.set(STUDENTS_KEY, updated);
  await redis.set(key, true, { ex: 60 * 60 * 24 });

  await publishStudentsChanged();

  return NextResponse.json({ ok: true, reset: true });
}

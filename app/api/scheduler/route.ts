import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
type TimeSlot = "8교시" | "야간 1차시" | "야간 2차시";

type Item = {
  studentId: string;
  name: string;
  status: string; // "변경안함" or 실제 status
  reason: string;
};

const keyOf = (day: DayKey, slot: TimeSlot) => `scheduler:template:${day}:${slot}`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day") as DayKey;
  const slot = searchParams.get("slot") as TimeSlot;
  if (!day || !slot) return NextResponse.json({ items: [] });

  const items = (await redis.get<Item[]>(keyOf(day, slot))) ?? [];
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const day = body?.day as DayKey;
  const slot = body?.slot as TimeSlot;
  const items = (body?.items as Item[]) ?? [];

  if (!day || !slot) {
    return NextResponse.json({ ok: false, message: "day/slot 필요" }, { status: 400 });
  }

  await redis.set(keyOf(day, slot), items);
  return NextResponse.json({ ok: true });
}

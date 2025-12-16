import { NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
type TimeSlot = "8교시" | "야간 1차시" | "야간 2차시";

// ✅ 학교 시간표(분 단위)
const SLOT_START_MINUTE: Record<TimeSlot, number> = {
  "8교시": 16 * 60 + 50,      // 16:50
  "야간 1차시": 19 * 60 + 10, // 19:10
  "야간 2차시": 21 * 60 + 15, // 21:15
};

const APPLY_WINDOW_MIN = 10; // 시작 후 10분 안에만 적용

const enabledKey = "scheduler:enabled";
const appliedKey = (yyyyMMdd: string, slot: TimeSlot) => `scheduler:applied:${yyyyMMdd}:${slot}`;

const ymd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

const dayKeyKST = (d: Date): DayKey => {
  const n = d.getDay();
  const map: Record<number, DayKey> = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
  return map[n] ?? "mon";
};

function nowMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function pickSlot(d: Date): TimeSlot | null {
  const m = nowMinutes(d);
  for (const slot of Object.keys(SLOT_START_MINUTE) as TimeSlot[]) {
    const start = SLOT_START_MINUTE[slot];
    if (m >= start && m < start + APPLY_WINDOW_MIN) return slot;
  }
  return null;
}

export async function GET() {
  // ✅ KST 기준으로 동작(서버가 UTC여도 Date는 “런타임” 기준이지만, Vercel은 UTC인 경우가 많음)
  // 👉 그래서 “KST 변환”을 직접 함:
  const utc = new Date();
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);

  // 1) 스케줄러 ON/OFF
  const enabledRaw = await redis.get(enabledKey);
  const enabled =
    enabledRaw === null ? true : enabledRaw === true || enabledRaw === "true" || enabledRaw === 1 || enabledRaw === "1";
  if (!enabled) return NextResponse.json({ ok: true, skipped: "disabled" });

  // 2) 요일(월~금만)
  const dk = dayKeyKST(kst);
  if (!["mon", "tue", "wed", "thu", "fri"].includes(dk)) {
    return NextResponse.json({ ok: true, skipped: "weekend" });
  }

  // 3) 지금 슬롯 시간인지
  const slot = pickSlot(kst);
  if (!slot) return NextResponse.json({ ok: true, skipped: "not-in-window" });

  // 4) 오늘 이 슬롯 이미 적용했는지
  const key = appliedKey(ymd(kst), slot);
  const already = await redis.get(key);
  if (already) return NextResponse.json({ ok: true, skipped: "already-applied", slot });

  // 5) 적용 실행 (/api/scheduler/apply 호출)
  const base = process.env.NEXT_PUBLIC_BASE_URL || ""; // 필요하면 설정
  const url = `${base}/api/scheduler/apply`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ✅ day/slot 전달
    body: JSON.stringify({ day: dk, slot }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, slot, error: "apply-failed", detail: t }, { status: 500 });
  }


  const locked = await redis.set(key, true, { nx: true, ex: 60 * 60 * 24 });
if (!locked) {
  return NextResponse.json({ ok: true, skipped: true, reason: "already-applied" });
}


  return NextResponse.json({ ok: true, applied: true, day: dk, slot });
}

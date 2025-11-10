// app/api/scheduler/state/route.ts
import { NextResponse } from "next/server";

// ─────────────────────────────
// 메모리에 스케줄러 on/off 보관
// ─────────────────────────────
const g = globalThis as unknown as {
  __schedulerEnabled?: boolean;
};

if (typeof g.__schedulerEnabled === "undefined") {
  // 처음엔 켜진 상태
  g.__schedulerEnabled = true;
}

// GET: 현재 상태 조회
export async function GET() {
  return NextResponse.json({ enabled: g.__schedulerEnabled });
}

// POST: 상태 변경 { enabled: boolean }
export async function POST(req: Request) {
  const body = await req.json();
  const enabled = Boolean(body.enabled);
  g.__schedulerEnabled = enabled;
  return NextResponse.json({ ok: true, enabled });
}

// 다른 라우트에서 import해서 쓰려고 export
export function getSchedulerEnabled() {
  return g.__schedulerEnabled ?? true;
}

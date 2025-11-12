// app/api/scheduler/state/route.ts
import { NextResponse } from "next/server";
import { schedulerEnabledRef } from "@/app/lib/data";

// GET: 현재 스케줄러 ON/OFF 상태 조회
export async function GET() {
  return NextResponse.json({ enabled: !!schedulerEnabledRef.schedulerEnabled });
}

// POST: { enabled: boolean }로 설정
export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ ok: false, message: "enabled(boolean) 필요" }, { status: 400 });
    }
    schedulerEnabledRef.schedulerEnabled = enabled;
    return NextResponse.json({ ok: true, enabled });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

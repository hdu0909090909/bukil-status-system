// app/api/scheduler/state/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";
import { ensureSeed, SCHED_ENABLED_KEY } from "@/app/lib/seed";

// GET: 현재 스케줄러 ON/OFF 상태 조회
export async function GET() {
  try {
    await ensureSeed();
    const enabled = (await redis.get(SCHED_ENABLED_KEY)) as boolean | null;
    return NextResponse.json({ enabled: enabled ?? true });
  } catch (e) {
    console.error("[scheduler/state GET] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

// POST: { enabled: boolean }로 설정
export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { ok: false, message: "enabled(boolean) 필요" },
        { status: 400 },
      );
    }
    await ensureSeed();
    await redis.set(SCHED_ENABLED_KEY, enabled);
    return NextResponse.json({ ok: true, enabled });
  } catch (e) {
    console.error("[scheduler/state POST] error", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 },
    );
  }
}

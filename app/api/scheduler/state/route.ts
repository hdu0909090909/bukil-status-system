// app/api/scheduler/state/route.ts
import { NextRequest, NextResponse } from "next/server";

// 기본은 켜짐
let schedulerEnabled = true;

export async function GET() {
  return NextResponse.json({ enabled: schedulerEnabled }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled === "boolean") {
    schedulerEnabled = body.enabled;
    return NextResponse.json({ ok: true, enabled: schedulerEnabled });
  }
  return NextResponse.json({ ok: false, message: "enabled 필요" }, { status: 400 });
}

// 다른 곳(예: /api/scheduler/apply)에서 쓰게 하려면 이걸 export 해두고 import 해도 됨
export function isSchedulerEnabled() {
  return schedulerEnabled;
}

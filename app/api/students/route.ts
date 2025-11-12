// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students, ensureDailyReset } from "@/app/lib/data";

const sorted = () => [...students].sort((a, b) => Number(a.id) - Number(b.id));

// GET: 매 호출마다 08:00 리셋 체크
export async function GET() {
  ensureDailyReset();
  return NextResponse.json(sorted(), { status: 200 });
}

// PATCH: 단건({id,...}) 또는 벌크([{id,...},...])
export async function PATCH(req: NextRequest) {
  ensureDailyReset();

  const body = await req.json();

  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as { id: string; [k: string]: any };
      const t = students.find((s) => s.id === id);
      if (t) Object.assign(t, updates);
    }
    return NextResponse.json({ ok: true, students: sorted() });
  }

  const { id, ...updates } = body as { id: string; [k: string]: any };
  if (!id) {
    return NextResponse.json({ ok: false, message: "id가 필요합니다." }, { status: 400 });
  }
  const t = students.find((s) => s.id === id);
  if (!t) {
    return NextResponse.json({ ok: false, message: "해당 학생 없음" }, { status: 404 });
  }
  Object.assign(t, updates);
  return NextResponse.json({ ok: true, students: sorted() });
}

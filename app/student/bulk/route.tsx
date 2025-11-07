// app/api/students/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json();
    // updates: [{ id, status?, reason?, approved? }, ...]

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { ok: false, message: "updates 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 각 학생에 대해 일괄 적용
    for (const update of updates) {
      const s = students.find((x) => x.id === update.id);
      if (!s) continue;
      Object.assign(s, update);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("bulk PATCH error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

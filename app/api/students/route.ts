// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// 전체 목록
export async function GET() {
  // 그냥 현재 메모리에 있는 학생들 그대로 내보냄
  // (여기서 막거나 리밋 안 건다)
  return NextResponse.json(students);
}

// 한 명 수정
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "id가 필요합니다." },
        { status: 400 }
      );
    }

    const st = students.find((s) => s.id === id);
    if (!st) {
      return NextResponse.json(
        { ok: false, message: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    Object.assign(st, updates);

    return NextResponse.json({ ok: true, student: st });
  } catch (err) {
    console.error("students PATCH error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}

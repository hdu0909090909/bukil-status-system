// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// 이거 넣어두면 Vercel이 이 라우트 결과를 정적으로 캐싱 안 하게 돼서
// "바꿨는데 또 옛날 거 옴" 같은 게 조금 줄어듦
export const dynamic = "force-dynamic";

// GET /api/students
export async function GET() {
  // 원본 배열을 직접 정렬해버리면 다음 요청에도 영향가니까
  // 복사해서 정렬해서 보내자
  const sorted = [...students].sort((a, b) => a.id.localeCompare(b.id));
  return NextResponse.json(sorted, {
    // 캐시 꺼두는 옵션
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// PATCH /api/students
// body: { id: string, status?: string, reason?: string, approved?: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body as {
      id?: string;
      status?: string;
      reason?: string;
      approved?: boolean;
    };

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "id가 필요합니다." },
        { status: 400 }
      );
    }

    const target = students.find((s) => s.id === id);
    if (!target) {
      return NextResponse.json(
        { ok: false, message: "해당 학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 받은 값만 덮어쓰기
    if (rest.status !== undefined) target.status = rest.status;
    if (rest.reason !== undefined) target.reason = rest.reason;
    if (rest.approved !== undefined) target.approved = rest.approved;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/students error:", err);
    return NextResponse.json(
      { ok: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

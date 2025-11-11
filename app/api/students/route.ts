// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

// 오늘 날짜를 기억해두는 모듈 변수
let lastResetDate = ""; // "2025-11-11" 이런 식

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 08:00 이후 처음 호출될 때만 전체 재실
function maybeDailyReset() {
  const now = new Date();
  const today = getTodayString();
  const minutes = now.getHours() * 60 + now.getMinutes();

  // 8시 이후면서 오늘 아직 리셋 안했으면
  if (minutes >= 8 * 60 && lastResetDate !== today) {
    for (const s of students) {
      s.status = "재실";
      s.reason = "";
    }
    lastResetDate = today;
  }
}

// 공통: 항상 학번순으로 정렬해서 내보내기
function getSortedStudents() {
  return [...students].sort((a, b) => Number(a.id) - Number(b.id));
}

// GET /api/students
export async function GET() {
  // 매 요청마다 한번 체크
  maybeDailyReset();
  return NextResponse.json(getSortedStudents(), { status: 200 });
}

// PATCH /api/students
// 1) 단건: { id, ...updates }
// 2) 벌크: [ { id, ...updates }, ... ]
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // 혹시 PATCH만 단독으로 호출됐을 때도 8시 지나있으면 맞춰주자
  maybeDailyReset();

  if (Array.isArray(body)) {
    for (const item of body) {
      const { id, ...updates } = item as { id: string; [key: string]: any };
      const target = students.find((s) => s.id === id);
      if (target) {
        Object.assign(target, updates);
      }
    }
    return NextResponse.json({ ok: true, students: getSortedStudents() });
  }

  const { id, ...updates } = body as { id: string; [key: string]: any };
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

  Object.assign(target, updates);

  return NextResponse.json({ ok: true, student: target });
}

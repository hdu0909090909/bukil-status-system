// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";

export type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

// 메모리에 들고 있을 데이터
let students: Student[] = [
  { id: "11101", name: "김규민", status: "재실", reason: "", approved: true, seatId: "11101" },
  { id: "11102", name: "김사무엘", status: "재실", reason: "", approved: true, seatId: "11102" },
  { id: "11103", name: "김서준", status: "재실", reason: "", approved: true, seatId: "11103" },
  { id: "11104", name: "김연수", status: "재실", reason: "", approved: true, seatId: "11104" },
  { id: "11106", name: "김유민", status: "재실", reason: "", approved: true, seatId: "11106" },
  { id: "11107", name: "김주헌", status: "재실", reason: "", approved: true, seatId: "11107" },
  { id: "11108", name: "김지섭", status: "재실", reason: "", approved: true, seatId: "11108" },
  { id: "11109", name: "박경민", status: "재실", reason: "", approved: true, seatId: "11109" },
  { id: "11110", name: "박시온", status: "재실", reason: "", approved: true, seatId: "11110" },
  { id: "11111", name: "손지우", status: "재실", reason: "", approved: true, seatId: "11111" },
  { id: "11112", name: "송준서", status: "재실", reason: "", approved: true, seatId: "11112" },
  { id: "11113", name: "안준영", status: "재실", reason: "", approved: true, seatId: "11113" },
  { id: "11115", name: "이도현", status: "재실", reason: "", approved: true, seatId: "11115" },
  { id: "11116", name: "이승우", status: "재실", reason: "", approved: true, seatId: "11116" },
  { id: "11117", name: "이승화", status: "재실", reason: "", approved: true, seatId: "11117" },
  { id: "11118", name: "이예찬", status: "재실", reason: "", approved: true, seatId: "11118" },
  { id: "11119", name: "이지온", status: "재실", reason: "", approved: true, seatId: "11119" },
  { id: "11120", name: "이진우", status: "재실", reason: "", approved: true, seatId: "11120" },
  { id: "11121", name: "전주형", status: "재실", reason: "", approved: true, seatId: "11121" },
  { id: "11122", name: "정민건", status: "재실", reason: "", approved: true, seatId: "11122" },
  { id: "11124", name: "조주형", status: "재실", reason: "", approved: true, seatId: "11124" },
  { id: "11125", name: "진승우", status: "재실", reason: "", approved: true, seatId: "11125" },
  { id: "11126", name: "최배겸", status: "재실", reason: "", approved: true, seatId: "11126" },
  { id: "11127", name: "최준성", status: "재실", reason: "", approved: true, seatId: "11127" },
  { id: "11128", name: "함주완", status: "재실", reason: "", approved: true, seatId: "11128" },
  { id: "11129", name: "허준우", status: "재실", reason: "", approved: true, seatId: "11129" },
  { id: "11130", name: "황도운", status: "재실", reason: "", approved: true, seatId: "11130" },
];

// 이거 넣어두면 dev에서 캐시 덜 타서 편함
export const dynamic = "force-dynamic";

// GET /api/students
export async function GET() {
  return NextResponse.json(students);
}

// PATCH /api/students
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body as Partial<Student> & { id: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    students = students.map((s) =>
      s.id === id ? { ...s, ...rest } : s
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    // 파싱 실패했을 때도 JSON으로 응답
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}
